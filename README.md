# userscript-common

This repository contains a collection of userscript libraries that provide common tootls, utilities, helpers to help and ease the development of userscripts.

## Available Libraries

- **Mutation Observer** ([Source][mos]): A simple wrapper around MutationObserver API to watch DOM changes.
- **Wait for Element** ([Source][wfes]): Provides utility functions to get and wait for elements that are not yet loaded or available on the page.

[mos]: https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
[wfes]: https://github.com/owowed/userscript-common/raw/main/wait-for-element.js

## How to Use

To use any of the libraries in this repository, simply add the following lines to your userscript header:

```javascript
// ==UserScript==
// ...
// @require  https://github.com/owowed/userscript-common/raw/main/<filename-here>.js
// ...
// ==/UserScript==
```

Replace "\<filename-here>" with the filename of the library you want to use. For example, to include the `mutation-observer.js` library, add the following line to your userscript header:

```javascript
// @require  https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
```

You can also copy the raw `Source` link under [Available Libraries](#available-libraries).

### Library Dependency

Some library may depend on other library. You can usually see this on the library's `@require` directive, placed on the userscript header (on top of the file). For those kinds of libraries, you must also require the same dependencies as required by the library itself. For example, the `wait-for-element.js` library requires the `mutation-observer.js` library. In order to include `wait-for-element.js` in your userscript, you must also include `mutation-observer.js`.

```javascript
// ==UserScript==
// ...
// @require  https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
// @require  https://github.com/owowed/userscript-common/raw/main/wait-for-element.js
// ...
// ==/UserScript==
```

*(note: the order of `@require` directive does not matter, as userscript-common libraries only provide functions that are not executed immediately unless called/used by the developer.)*

## License

This repository and all of its libraries are licensed under [GNU LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html), a free and open-source license. For more information, please see the [license file](https://github.com/owowed/userscript-common/blob/3574a4c7a29e8600ddc899cfafd7a4f54674b81d/LICENSE.txt).