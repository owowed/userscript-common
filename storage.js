// ==UserScript==
// @name         OxiStorage
// @description  Provides an API and wrapper around `GM_getValue` and `GM_setValue` to manage userscript storage.
// @version      1.0.1
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @match        *://*/*
// @require      https://github.com/owowed/userscript-common/raw/main/common.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @license      LGPL-3.0
// ==/UserScript==

class OxiStorageError extends OxiError {
    constructor (message, { data, cause, ...rest }) {
        super(message, { cause, ...rest });
        this.data = data;
    }
}

class OxiStorageSerializationError extends OxiStorageError {}
class OxiStorageDeserializationError extends OxiStorageError {}

/**
 * @typedef {string | number | null | undefined | Record<string, UserscriptStorageValue>} UserscriptStorageValue
 */

/**
 * @typedef AssignationData
 */


class OxiStorage {
    valueGetter = GM_getValue;
    valueSetter = GM_setValue;
    valueDeleter = GM_deleteValue ?? ((propPath) => {
        this.valueSetter(propPath, undefined);
    });
    #activeProxies = [];
    #proxyMetadata = Symbol("oxi storage proxy key");

    constructor (
        { valueGetter,
            valueSetter,
            valueDeleter } = {}) {
        this.valueGetter ??= valueGetter;
        this.valueSetter ??= valueSetter;
        this.valueDeleter ??= valueDeleter;

        if (this.valueGetter("oxi_storage_metadata") == undefined) {
            this.valueSetter("oxi_storage_metadata", {
                version: [1, 0, 0],
                creationDate: Date.now()
            });
        }
        if (this.valueGetter(".") == undefined) {
            this.valueSetter(".", {
                root: true,
                type: "object",
                keys: [],
            });
        }
    }

    /**
     * Check if `obj` is primitive.
     * @param {any} obj 
     * @returns {boolean}
     */
    static isPrimitive(obj) {
        return !OxiStorage.isObject(obj) || obj === null;
    }

    /**
     * Check if `obj` is an object, whether or not is a class object or dictionary object.
     * @param {any} obj 
     * @returns {boolean}
     */
    static isObject(obj) {
        return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
    }

    /**
     * Check if `obj` is a dictionary object, an object that is usually created in object literal expression.
     * @param {any} obj 
     * @returns {boolean}
     */
    static isDictionaryObject(obj) {
        return OxiStorage.isObject(obj) && obj.constructor == Object;
    }

    /**
     * Check if `obj` is a class object, an object that is usually created/constructed by class.
     * @param {any} obj 
     * @returns {boolean}
     */
    static isClassObject(obj) {
        return OxiStorage.isObject(obj) && obj.constructor != Object;
    }

    /**
     * Check if `obj` is `OxiStorage` data object, an object that is stored in userscript storage, usually indicating that the property is an array or an object.
     * @param {any} obj 
     * @returns {boolean}
     */
    static isDataObject(obj) {
        return obj?.type && true;
    }

    /**
     * Parse a string path into array of string.
     * @param {string} path 
     * @returns {string[]}
     */
    parsePath(path) {
        path = this.resolvePath(path);
        return path.split(".");
    }

    /**
     * Resolve string path to correct string path.
     * @param {string | string[]} path 
     * @returns {boolean}
     */
    resolvePath(path) {
        if (Array.isArray(path)) {
            path = path.join(".");
        }
        if (path.includes("\\.")) {
            throw new OxiStorage("escaping path character is not supported at the moment", {
                data: { path }
            });
        }
        if (path[0] != ".") {
            return `.${path}`;
        }
        path = path.replace(/^\.+(.+)?/, ".$1");
        return path;
    }

    /**
     * @param {"update" | "delete"} mode 
     * @param {AssignationData} param1 
     */
    #modifyParentObjectData(mode, { parent, valueKey, subroot, parentKey } = {}) {
        if (mode != "update" && mode != "delete") {
            throw new TypeError(`modify parent object data: invalid mode "${mode}"`);
        }
        if (!OxiStorage.isDataObject(parent)) {
            throw new OxiStorageSerializationError("value is not data object", {
                data: {
                    subroot,
                    parent,
                    parentKey,
                    valueKey,
                }
            });
        }
        
        let assignationData;

        switch (parent.type) {
            case "object": {
                assignationData = {
                    ...parent,
                    keys: mode == "update"
                        ? Array.from(new Set(parent.keys.concat(valueKey)))
                        : parent.keys.filter(i => i != valueKey),
                };
            } break;
            case "array": {
                assignationData = {
                    ...parent,
                    length: mode == "update"
                        ? parent.length + 1
                        : parent.length - 1,
                };
            } break;
        }
        
        this.valueSetter(this.resolvePath([subroot, parentKey]), assignationData);
    }

    /**
     * @param {string} path 
     * @returns {AssignationData}
     */
    #getAssignationData(path) {
        const parsedPath = this.parsePath(path);
        const [parentKey, valueKey] = parsedPath.slice(-2);
        const subroot = parsedPath.slice(0, -2).join(".");
        const parent = this.valueGetter(this.resolvePath([subroot, parentKey]));
        const value = this.valueGetter(`${path}`);

        if (!OxiStorage.isDataObject(parent)) {
            return { parent: undefined, parentKey, value, valueKey };
        }
        return { parent, parentKey, value, valueKey, subroot };
    }

    /**
     * Get value from the userscript storage.
     * @template {UserscriptStorageValue} T
     * @param {string | string[]} path - any valid path can be resolved by `OxiStorage#resolvePath()`.
     * @returns {T} - usually JSON primitives, but may also return `undefined` if the property does not exist.
     */
    getValue(path) {
        path = this.resolvePath(path);

        const { parent, parentKey, value } = this.#getAssignationData(path);
        
        if (parent == undefined) {
            throw new OxiStorageDeserializationError("parent is undefined", {
                data: {
                    parent,
                    parentKey,
                    path,
                    value
                }
            });
        }

        if (OxiStorage.isDataObject(value)) {
            return this.createProxy(path, value);
        }
        else {
            return value;
        }
    }

    /**
     * Set value in the userscript storage.
     * @param {string | string[]} path - any valid path can be resolved by `OxiStorage#resolvePath()`.
     * @param {UserscriptStorageValue} value - JSON primitives.
     * @returns {void}
     */
    setValue(path, value) {
        path = this.resolvePath(path);

        const { parent, parentKey, valueKey, subroot } = this.#getAssignationData(path);

        if (parent == undefined) {
            throw new OxiStorageDeserializationError("parent is undefined", {
                data: {
                    parent,
                    parentKey,
                    path,
                    value
                }
            });
        }
        
        if (OxiStorage.isClassObject(value)) {
            throw new OxiStorageSerializationError("unsupported class object", {
                data: {
                    type: typeof value,
                    value
                }
            });
        }

        this.deleteValue(path);

        if (OxiStorage.isDictionaryObject(value)) {
            this.valueSetter(path, {
                type: "object",
                keys: Object.keys(value),
            });

            for (const [okey, ovalue] of Object.entries(value)) {
                this.setValue([path, okey], ovalue);
            }
        }
        else if (Array.isArray(value)) {
            this.valueSetter(path, {
                type: "array",
                length: value.length,
            });

            for (let index = 0; index < value.length; index++) {
                this.setValue([path, index], value[index]);
            }
        }
        else {
            if (OxiStorage.isPrimitive(value)) {
                this.valueSetter(path, value);
            }
            else {
                this.setValue(path, value);
            }
        }

        this.#modifyParentObjectData("update", { parent, valueKey, subroot, parentKey });
    }

    /**
     * Delete value from the userscript storage.
     * @param {string | string[]} path - any valid path can be resolved by `OxiStorage#resolvePath()`.
     * @returns {void}
     */
    deleteValue(path) {
        path = this.resolvePath(path);

        const { parent, parentKey, valueKey, value, subroot } = this.#getAssignationData(path);
        
        if (parent == undefined) {
            throw new OxiStorageDeserializationError("parent is undefined", {
                data: {
                    parent,
                    parentKey,
                    path,
                    value
                }
            });
        }

        if (OxiStorage.isDataObject(value)) {
            for (const key of value.keys) {
                this.valueDeleter(`${path}.${key}`);
            }
        }

        this.valueDeleter(path);
        this.#modifyParentObjectData("delete", { parent, valueKey, subroot, parentKey });
    }

    /**
     * Create a proxy from path. You can access userscript storage using object notation by creating a proxy.
     * @template {Record<string, UserscriptStorageValue>} T
     * @param {string | string[]} path - any valid path can be resolved by `OxiStorage#resolvePath()`.
     * @param {{ type: "array" | "object" }} objectDescriptor 
     * @returns {T}
     */
    createProxy(path, { type }) {
        const proxy = new Proxy({
            isActive: true
        }, {
            get: (target, prop, receiver) => {
                if (prop == this.#proxyMetadata) {
                    return target;
                }
                if (!target.isActive) {
                    return undefined;
                }
                if (prop == Symbol.toPrimitive) {
                    return { type };
                }
                if (!(typeof prop == "string" || typeof prop == "number")) {
                    throw new OxiStorageDeserializationError("unexpected non-primitive property", {
                        data: {
                            type: typeof prop,
                            prop,
                        }
                    });
                }
                return this.getValue([path, prop]);
            },
            set: (target, prop, value, receiver) => {
                if (prop == this.#proxyMetadata) {
                    throw new OxiStorageSerializationError("unexpected assignment: proxy metadata", {
                        data: {
                            prop,
                        }
                    });
                }
                if (!target.isActive) {
                    return false;
                }
                if (!OxiStorage.isPrimitive(value)) {
                    throw new OxiStorageSerializationError("type of value is not primitive type", {
                        data: {
                            type: typeof value,
                            value
                        }
                    });
                }
                this.setValue([path, prop], value);
                return true;
            }
        });

        this.#activeProxies.push(proxy);

        return proxy;
    }
    
    /**
     * Disable and remove created proxy from this class.
     * @param {Record<string, UserscriptStorageValue>} proxy
     * @returns {void}
     */
    removeProxy(proxy) {
        proxy[this.#proxyMetadata].isActive = false;
        this.#activeProxies = this.#activeProxies.filter(p => p != proxy);
    }
}
