// ==UserScript==
// @name         Wait for Element
// @description  Provides utility functions to get and wait for elements that are not yet loaded or available on the page.
// @version      1.0.0
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @require      https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
// @license      LGPL-3.0
// ==/UserScript==

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
        signal, // abort controller signal
        multiple = false,
        timeout = 5000,
        noTimeout = false,
        maxTries = Number.MAX_SAFE_INTEGER } = {}) {
    return new Promise((resolve, reject) => {
        let result, tries = 0;
        
        function checkElement() {
            signal?.throwIfAborted();

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
                reject(new Error(`Maximum number of tries (${maxTries}) reached waiting for element "${selector}"`));
            }
        }

        const observer = makeMutationObserver(
            { target: parent,
                childList: true,
                subtree: true,
                signal },
            checkElement);

        checkElement();

        let timeoutId = null;

        if (!noTimeout) {
            timeoutId = setTimeout(() => {
                signal?.throwIfAborted();
                observer.disconnect();
                reject(new Error(`Timeout waiting for element "${selector}"`));
            }, timeout);
        }

        signal?.addEventListener("abort", () => {
            clearTimeout(timeoutId);
            observer.disconnect();
            reject(new DOMException(signal.reason, "AbortError"));
        });

        checkElement();
    });
}