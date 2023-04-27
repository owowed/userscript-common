// ==UserScript==
// @name         OxiStorage
// @description  Provides an API and wrapper around `GM_getValue` and `GM_setValue` to manage userscript's storage.
// @version      1.0.0
// @namespace    owowed.moe
// @author       owowed <island@owowed.moe>
// @include      *://*/*
// @require      https://github.com/owowed/userscript-common/raw/main/common.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @license      LGPL-3.0
// ==/UserScript==

class OxiStorageError extends OxiError {}

class OxiStorageSerializationError extends OxiStorageError {}
class OxiStorageDeserializationError extends OxiStorageError {}

class OxiStorage {
    valueGetter = GM_getValue ?? GM?.getValue;
    valueSetter = GM_setValue ?? GM?.setValue;
    valueDeleter = GM_deleteValue ?? GM?.deleteValue ?? ((propPath) => {
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
                version: [1, 0, 0]
            });
        }
        if (this.valueGetter("@") == undefined) {
            this.valueSetter("@", {
                root: true,
                type: "object",
                keys: [],
            });
        }
    }

    static isPrimitive(obj) {
        return !OxiStorage.isObject(obj) || obj === null;
    }

    static isObject(obj) {
        return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
    }

    static isDictionaryObject(obj) {
        return OxiStorage.isObject(obj) && obj.constructor == Object;
    }

    static isClassObject(obj) {
        return OxiStorage.isObject(obj) && obj.constructor != Object;
    }

    static isDataObject(obj) {
        return obj?.type && true;
    }

    parsePath(path) {
        path = this.#resolvePath(path);
        return path.split(".");
    }

    #resolvePath(path) {
        if (path[0] != "@") {
            return `@.${path}`;
        }
        return path;
    }

    #updateAssignationData(mode, { parent, valueKey, subroot, parentKey } = {}) {
        if (mode != "update" && mode != "delete") throw new TypeError("invalid string enum");
        if (OxiStorage.isDataObject(parent)) {
            let assignationData;
            if (parent.type == "object") {
                assignationData = {
                    ...parent,
                    keys: mode == "update"
                        ? Array.from(new Set(parent.keys.concat(valueKey)))
                        : parent.keys.filter(i => i != valueKey),
                };
            }
            else if (parent.type == "array") {
                assignationData = {
                    ...parent,
                    length: mode == "update"
                        ? parent.length + 1
                        : parent.length - 1,
                };
            }
            this.valueSetter(subroot ? `${subroot}.${parentKey}` : parentKey, assignationData);
        }
        else throw new Error("is data object");
    }

    #getAssignationData(path) {
        const parsedPath = this.parsePath(path);
        const [parentKey, valueKey] = parsedPath.slice(-2);
        const subroot = parsedPath.slice(0, -2).join(".");
        const parent = this.valueGetter(subroot ? `${subroot}.${parentKey}` : parentKey);
        const value = this.valueGetter(`${path}`);

        if (!OxiStorage.isDataObject(parent)) {
            return { parent: undefined, parentKey, value, valueKey };
        }
        return { parent, parentKey, value, valueKey, subroot };
    }

    getValue(path) {
        path = this.#resolvePath(path);

        const { parent, value } = this.#getAssignationData(path);
        
        if (parent == undefined) {
            throw new Error("expect parent");
        }

        if (OxiStorage.isDataObject(value)) {
            return this.createProxy(path, value);
        }
        else {
            return value;
        }
    }

    setValue(path, value) {
        path = this.#resolvePath(path);

        const { parent, parentKey, valueKey, subroot } = this.#getAssignationData(path);

        if (parent == undefined) {
            throw new Error("expect parent");
        }

        if (OxiStorage.isClassObject(value)) {
            throw new Error("unsupported class object");
        }
        if (OxiStorage.isDictionaryObject(value)) {
            this.valueSetter(path, {
                type: "object",
                keys: Object.keys(value),
            });

            for (const [k, v] of Object.entries(value)) {
                this.setValue(`${path}.${k}`, v);
            }
        }
        else if (Array.isArray(value)) {
            this.valueSetter(path, {
                type: "array",
                length: value.length,
            });

            for (let index = 0; index < value.length; index++) {
                this.setValue(`${path}.${index}`, value[index]);
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

        this.#updateAssignationData("update", { parent, valueKey, subroot, parentKey });
    }

    deleteValue(path) {
        path = this.#resolvePath(path);

        const { parent, parentKey, valueKey, value, subroot } = this.#getAssignationData(path);
        
        if (parent == undefined) {
            throw new Error("expect parent");
        }

        if (OxiStorage.isDataObject(value)) {
            for (const key of value.keys) {
                this.valueDeleter(`${path}.${key}`);
            }
        }

        this.valueDeleter(path);
        this.#updateAssignationData("delete", { parent, valueKey, subroot, parentKey });
    }

    createProxy(path, { type }) {
        const proxy = new Proxy({
            isActive: true
        }, {
            get: (target, prop, receiver) => {
                if (prop == this.#proxyMetadata) {
                    return target;
                }
                if (!target.isActive) {
                    return;
                }
                if (prop == Symbol.toPrimitive) {
                    return { type };
                }
                if (typeof prop == "string" || typeof prop == "number") {
                    return this.getValue(`${path}.${prop}`);
                }
                else {
                    console.error("unexpected property", prop);
                    return undefined;
                }
            },
            set: (target, prop, value, receiver) => {
                if (prop == this.#proxyMetadata) {
                    throw new Error("unexpected assignment");
                }
                if (!target.isActive) {
                    return false;
                }
                this.setValue(`${path}.${prop}`, value);
                return true;
            }
        });

        this.#activeProxies.push(proxy);

        return proxy;
    }
    
    removeProxy(proxy) {
        proxy[this.#proxyMetadata].isActive = false;
        this.#activeProxies = this.#activeProxies.filter(p => p != proxy);
    }
}
