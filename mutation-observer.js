// ==UserScript==
// @name         Mutation Observer
// @description  A library that contains useful functions to ease the use of Mutation Observer.
// @namespace    owowed.moe
// @version      1.0.0
// @author       owowed
// @license      LGPL-2.1
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