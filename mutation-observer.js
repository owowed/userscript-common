// ==UserScript==
// @name         Mutation Observer
// @description  A simple wrapper around MutationObserver API to watch DOM changes.
// @version      1.0.1
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @license      LGPL-3.0
// ==/UserScript==

/**
 * @typedef {MutationObserverInit & {
 *  target: HTMLElement,
 *  abortSignal: AbortSignal 
 * }} MakeMutationObserverOptions
 */

/**
 * @typedef {(info: { records: MutationRecord[], observer: MutationObserver }) => void} MakeMutationObserverCallback
 */

/**
 * Create a new `MutationObserver` with options and callback.
 * @param {MakeMutationObserverOptions} options 
 * @param {MakeMutationObserverCallback} callback 
 * @returns {void}
 */
function makeMutationObserver({ target, abortSignal, ...options }, callback) {
    const observer = new MutationObserver(records => {
        abortSignal?.throwIfAborted();
        callback({ records, observer });
    });

    observer.observe(target, options);

    abortSignal?.addEventListener("abort", () => {
        observer.disconnect();
    });

    return observer;
}