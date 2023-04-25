# userscript-common
Repository for userscript libraries that contains common utilities designed to help and ease the development of userscript.

# How to use
Add these following lines to your userscript headers:
```javascript
// ==UserScript==
// ...
// @require  https://github.com/owowed/userscript-common/raw/main/<filename-here>.js
// ...
// ==/UserScript==
```
Replace "\<filename-here>" with the library available in the repository. For example, to use the `mutation-observer.js` library, you must add this line:
```javascript
// @require  https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
```
## Library dependency
Some library may depend on other library. You can see this on the library's `@require` directive, usually placed on the userscript header (on top of the file). For that kind of library, you must also require the same dependencies as required by the library. For example, the `wait-for-element.js` library requires `mutation-observer.js` library, in order to include `wait-for-element.js` in your userscript, you must also include `mutation-observer.js`:
```javascript
// ==UserScript==
// ...
// @require  https://github.com/owowed/userscript-common/raw/main/mutation-observer.js
// @require  https://github.com/owowed/userscript-common/raw/main/wait-for-element.js
// ...
// ==/UserScript==
```

# License
This project is licensed under [GNU LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html), a free and open-source license. For more information, please see the [license file](https://github.com/owowed/userscript-common/blob/3574a4c7a29e8600ddc899cfafd7a4f54674b81d/LICENSE.txt).