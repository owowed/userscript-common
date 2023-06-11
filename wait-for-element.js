// ==UserScript==
// @name         Wait for Element
// @description  Provides utility functions to get and wait for elements asyncronously that are not yet loaded or available on the page.
// @version      1.0.4
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @require      https://github.com/owowed/userscript-common/raw/main/common.js
// @require      https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
// @license      LGPL-3.0
// ==/UserScript==

/**
 * @typedef WaitForElementOptions
 * @prop {string} [id] - when used, it will select element by ID, and it will use the `document` as the selector parent.
 * @prop {string | string[]} selector - the selector for the element. If `selector` is `string[]`, then `multiple` option is automatically enabled. Setting `multiple` option to `false` will not have effect at all.
 * @prop {ParentNode} [parent] - when used, it will instead use `parent` parent element as the selector parent. This option will specify/limit the scope of query selector from `parent` parent element. This may be useful for optimizing selecting element.
 * @prop {AbortSignal} [abortSignal] - when used, user may able to abort waiting for element by using `AbortSignal#abort()`.
 * @prop {boolean} [multiple] - when used, `waitForElement*` will act as `ParentNode#querySelectorAll()`.
 * @prop {number} [timeout] - will set wait for element timeout. Default timeout is 5 seconds.
 * @prop {boolean} [enableTimeout] - if timeout set by `timeout` reached, `waitForElement*` will throw `WaitForElementTimeoutError`.
 * @prop {number} [maxTries] - will set how many attempt `waitForElement*` will query select, and if it reached, it will throw `WaitForElementMaximumTriesError`.
 * @prop {boolean} [ensureDomContentLoaded] - ensure DOM content loaded by listening to `DOMContentLoad` event, and then execute by that, or checking by using `document.readyState`.
 * @prop {MutationObserverInit} [observerOptions] - set options for `MutationObserver` used in `waitForElement*`.
 * @prop {(elem: HTMLElement) => boolean} [filter] - filter multiple or single element before being returned.
 * @prop {(elem: HTMLElement) => HTMLElement} [transform] - transform or modify multiple or single element before being returned.
 */

/**
 * @typedef {Element[] | Element | null} WaitForElementReturnValue
 */

class WaitForElementError extends OxiError {}
class WaitForElementTimeoutError extends WaitForElementError {}
class WaitForElementMaximumTriesError extends WaitForElementError {}

/**
 * Wait for element asyncronously until the element is available on the page. This function immediately accept `parent` as its first parameter. `parent` parameter will specify/limit the scope of query selector. This may be useful for optimizing selecting element.
 * @param {NonNullable<WaitForElementOptions["parent"]>} parent 
 * @param {WaitForElementOptions["selector"]} selector 
 * @param {WaitForElementOptions} options 
 * @returns {WaitForElementReturnValue}
 */
function waitForElementByParent(parent, selector, options) {
    return waitForElementOptions({ selector, parent, ...options });
}

/**
 * Wait for element asyncronously until the element is available on the page. This function immediately accept `selector` as its first parameter.
 * @param {WaitForElementOptions["selector"]} selector 
 * @param {WaitForElementOptions} options 
 * @returns {WaitForElementReturnValue}
 */
function waitForElement(selector, options) {
    return waitForElementOptions({ selector, ...options });
}

/**
 * Wait for element asyncronously until the element is available on the page.
 * @param {WaitForElementOptions} options 
 * @returns {WaitForElementReturnValue}
 */
function waitForElementOptions(
    { id,
        selector,
        parent = document.documentElement,
        abortSignal, // abort controller signal
        multiple = false,
        timeout = 5000,
        enableTimeout = true,
        maxTries = Number.MAX_SAFE_INTEGER,
        ensureDomContentLoaded = true,
        observerOptions = {},
        filter,
        transform,
        throwError } = {}) {
    return new Promise((resolve, reject) => {
        let result, tries = 0;
        
        function* applyFilterTransform(result) {
            if (filter != undefined) {
                for (let elem of result) {
                    if (filter(elem)) {
                        if (transform) elem = transform(elem);
                        yield elem;
                    }
                }
            }
            else if (transform != undefined) {
                for (const elem of result) {
                    yield transform(elem);
                }
            }
        }

        function tryQueryElement(observer) {
            abortSignal?.throwIfAborted();

            if (multiple && id == undefined) {
                if (Array.isArray(selector)) {
                    result = [];
                    for (const sel of selector) {
                        result = result.concat(Array.from(parent.querySelectorAll(sel)));
                    }
                }
                else {
                    result = Array.from(parent.querySelectorAll(selector));
                }
                result = Array.from(applyFilterTransform(result));
            }
            else {
                if (id) {
                    result = document.getElementById(id);
                }
                else if (Array.isArray(selector)) {
                    result = [];

                    function* querySelectorIterator() {
                        for (const sel of selector) {
                            yield parent.querySelector(sel);
                        }
                    }

                    result = Array.from(applyFilterTransform(querySelectorIterator()));
                }
                else {
                    result = parent.querySelector(selector);
                }
                if (transform) result = transform(result);
                if (filter != undefined && !filter(result)) {
                    return false;
                }
            }

            if (multiple ? result?.length > 0 : result) {
                observer?.disconnect();
                resolve(result);
                return result;
            }

            tries++;

            if (tries >= maxTries) {
                observer?.disconnect();
                if (throwError) {
                    reject(new WaitForElementMaximumTriesError(`maximum number of tries (${maxTries}) reached waiting for element "${selector}"`));
                }
                else {
                    resolve(null);
                }
                return false;
            }
        }

        function startWaitForElement() {
            const firstResult = tryQueryElement();

            if (firstResult) return;
            
            let observer = makeMutationObserver(
                { target: parent,
                    childList: true,
                    subtree: true,
                    abortSignal,
                    ...observerOptions },
                () => tryQueryElement(observer));
    
            let timeoutId = null;
    
            if (enableTimeout) {
                timeoutId = setTimeout(() => {
                    observer.disconnect();
                    if (throwError) {
                        reject(new WaitForElementTimeoutError(`timeout waiting for element "${selector}"`));
                    }
                    else {
                        resolve(null);
                    }
                }, timeout);
            }
    
            abortSignal?.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                observer.disconnect();
                if (throwError) {
                    reject(new DOMException(abortSignal.reason, "AbortError"));
                }
                else {
                    resolve(null);
                }
            });
    
            tryQueryElement();
        }

        if (ensureDomContentLoaded && document.readyState == "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                startWaitForElement();
            });
        }
        else {
            startWaitForElement();
        }
    });
}