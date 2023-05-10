// ==UserScript==
// @name         Mutation Observer
// @description  A simple wrapper around MutationObserver API to watch DOM changes.
// @version      1.0.2
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
 * @returns {MutationObserver}
 */
function makeMutationObserver({ target, abortSignal, once, ...options }, callback) {
    const observer = new MutationObserver(records => {
        abortSignal?.throwIfAborted();
        if (once) observer.disconnect();
        callback({ records, observer });
    });

    observer.observe(target, options);

    abortSignal?.addEventListener("abort", () => {
        observer.disconnect();
    });

    return observer;
}