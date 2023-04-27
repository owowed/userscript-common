# userscript-common

This repository contains a collection of userscript libraries that provide common tools, utilities, helpers to help and ease the development of userscripts.

## Available Libraries

- **Mutation Observer** ([Source][mos]): A simple wrapper around MutationObserver API to watch DOM changes.
- **Wait for Element** ([Source][wfes]): Provides utility functions to get and wait for elements asyncronously that are not yet loaded or available on the page.
- **Common** ([Source][common]): Provides common utilities for userscript-common libraries. *It is recommended to automatically include this in your userscript, as most library usually depends on it.*

[mos]: https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
[wfes]: https://github.com/owowed/userscript-common/raw/main/wait-for-element.js
[common]: https://github.com/owowed/userscript-common/raw/main/common.js

## How to Use

To use any of the libraries in this repository, simply add the following lines to your userscript header:

```javascript
// ==UserScript==
// ...
// @require  https://github.com/owowed/userscript-common/raw/main/<filename-here>.js
// ...
// ==/UserScript==
```

Replace `<filename-here>` with the filename of the library you want to use. For example, to include the `mutation-observer.js` library, add the following line to your userscript header:

```javascript
// @require  https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
```

You can also copy the raw `Source` link under [Available Libraries](#available-libraries).

### Library Dependency

Some library may depend on other library. You can usually see this on the library's `@require` directive, placed on the userscript header (on top of the file). For those kinds of libraries, you must also require the same dependencies as required by the library itself. For example, the `wait-for-element.js` library requires the `common.js` and `mutation-observer.js` library. In order to include `wait-for-element.js` in your userscript, you must also include `common.js`and `mutation-observer.js`.

```javascript
// ==UserScript==
// ...
// @require  https://github.com/owowed/userscript-common/raw/main/common.js
// @require  https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
// @require  https://github.com/owowed/userscript-common/raw/main/wait-for-element.js
// ...
// ==/UserScript==
```

*(note: the order of `@require` directive does not matter, as userscript-common libraries usually only provide functions that are not executed immediately unless called/used by the developer.)*

## Contributing

If you have any ideas for new userscripts or improvements to existing ones, feel free to fork this repository and submit a pull request.

## License

This repository and all of its libraries are licensed under [GNU LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html), a free and open-source license. For more information, please see the [license file](https://github.com/owowed/userscript-common/blob/main/LICENSE.txt).
