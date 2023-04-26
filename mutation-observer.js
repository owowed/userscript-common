// ==UserScript==
// @name         Mutation Observer
// @description  A simple wrapper around MutationObserver API to watch DOM changes.
// @version      1.0.1
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @license      LGPL-3.0
// ==/UserScript==

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