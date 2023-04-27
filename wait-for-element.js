// ==UserScript==
// @name         Wait for Element
// @description  Provides utility functions to get and wait for elements asyncronously that are not yet loaded or available on the page.
// @version      1.0.2
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @require      https://github.com/owowed/userscript-common/raw/main/common.js
// @require      https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
// @license      LGPL-3.0
// ==/UserScript==

class WaitForElementTimeoutError extends OxiError {}
class WaitForElementMaximumTriesError extends OxiError {}

function waitForElementByParent(parent, selector, options) {
    return waitForElementOptions({ selector, parent, ...options });
}

function waitForElement(selector, options) {
    return waitForElementOptions({ selector, ...options });
}

function waitForElementOptions(
    { id,
        selector,
        parent = document.documentElement,
        abortSignal, // abort controller signal
        multiple = false,
        timeout = 5000,
        noTimeout = false,
        maxTries = Number.MAX_SAFE_INTEGER,
        ensureDomContentLoaded = true,
        observerOptions = {} } = {}) {
    return new Promise((resolve, reject) => {
        let result, tries = 0;
        
        function checkElement() {
            abortSignal?.throwIfAborted();

            if (id) {
                result = document.getElementById(id);
            }
            else {
                result = multiple
                    ? parent.querySelectorAll(selector)
                    : parent.querySelector(selector);
            }

            if (multiple ? result?.length > 0 : result) {
                observer.disconnect();
                return resolve(result);
            }

            tries++;

            if (tries >= maxTries) {
                observer.disconnect();
                reject(new WaitForElementMaximumTriesError(`maximum number of tries (${maxTries}) reached waiting for element "${selector}"`));
            }
        }

        function startWaitForElement() {
            let observer = null;
    
            checkElement();
            
            observer = makeMutationObserver(
                { target: parent,
                    childList: true,
                    subtree: true,
                    abortSignal,
                    ...observerOptions },
                checkElement);
    
            let timeoutId = null;
    
            if (!noTimeout) {
                timeoutId = setTimeout(() => {
                    abortSignal?.throwIfAborted();
                    observer.disconnect();
                    reject(new WaitForElementTimeoutError(`timeout waiting for element "${selector}"`));
                }, timeout);
            }
    
            abortSignal?.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                observer.disconnect();
                reject(new DOMException(abortSignal.reason, "AbortError"));
            });
    
            checkElement();
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