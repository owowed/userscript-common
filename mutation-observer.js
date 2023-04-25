// ==UserScript==
// @name         Mutation Observer
// @description  A simple wrapper around MutationObserver API to watch DOM changes.
// @version      1.0.0
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @license      LGPL-3.0
// ==/UserScript==

function makeMutationObserver({ target, signal, ...options }, callback) {
    const observer = new MutationObserver(records => {
        signal?.throwIfAborted();
        callback({ records, observer });
    });

    observer.observe(target, options);

    signal?.addEventListener("abort", () => {
        observer.disconnect();
    });

    return observer;
}