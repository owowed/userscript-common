// ==UserScript==
// @name         Mutation Observer
// @description  A library that contains utility functions for Mutation Observer.
// @namespace    owowed.moe
// @version      1.0.0
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