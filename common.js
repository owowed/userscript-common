// ==UserScript==
// @name         Common
// @description  Provides common utilities for userscript-common libraries.
// @version      1.0.0
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @license      LGPL-3.0
// ==/UserScript==

class OxiError extends Error {
    name = this.constructor.name;
}