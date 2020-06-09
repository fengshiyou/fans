export function asyncLiteration(array, callback, { interval = 10, group = 10 }) {
    let step = 0;
    group = parseInt(group, 10);
    const maxIndex = array.length - 1;
    let cancelFlag = false;
    return {
        cancel() {
            cancelFlag = true;
        },
        done: next()
    };

    function next() {
        const startIndex = step;
        // 遍历完成
        if (startIndex > maxIndex) {
            return Promise.resolve([maxIndex, maxIndex, maxIndex]);
        }
        const endIndex = step + group;
        const subArray = array.slice(startIndex, endIndex);
        step = endIndex;
        return literal(subArray, startIndex, endIndex, array);
    }
    function literal(subArray, startIndex, endIndex, mainArray) {
        return Promise.resolve(callback(subArray, startIndex, endIndex, mainArray)).then(function() {
            // 如果遍历器返回false就停止下次的遍历.
            if (cancelFlag) {
                return Promise.reject([startIndex, endIndex, maxIndex]);
            }
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    if (cancelFlag) {
                        return reject([startIndex, endIndex, maxIndex]);
                    }
                    resolve(next());
                }, interval);
            });
        });
    }
}

let hasOwn = Object.prototype.hasOwnProperty;
let toStr = Object.prototype.toString;
export function isArray(arr) {
    if (typeof Array.isArray === "function") {
        return Array.isArray(arr);
    }

    return toStr.call(arr) === "[object Array]";
}

export function isPlainObject(obj) {
    if (!obj || toStr.call(obj) !== "[object Object]") {
        return false;
    }

    let hasOwnConstructor = hasOwn.call(obj, "constructor");
    let hasIsPrototypeOf =
        obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, "isPrototypeOf");
    // Not own constructor property must be Object
    if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
        return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    let key;
    for (key in obj) {
        /**/
    }

    return typeof key === "undefined" || hasOwn.call(obj, key);
}

export function extend() {
    let options;
    let name;
    let src;
    let copy;
    let copyIsArray;
    let clone;
    let target = arguments[0];
    let i = 1;
    let length = arguments.length;
    let deep = false;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }
    if (target == null || (typeof target !== "object" && typeof target !== "function")) {
        target = {};
    }

    for (; i < length; ++i) {
        options = arguments[i];
        // Only deal with non-null/undefined values
        if (options != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target !== copy) {
                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && isArray(src) ? src : [];
                        } else {
                            clone = src && isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (typeof copy !== "undefined") {
                        target[name] = copy;
                    }
                }
            }
        }
    }

    // Return the modified object
    return target;
}

/**
 * 创建一个简易的包管理工具
 */
export function makePackage() {
    let _module = {};
    const packageHandler = function(name, module) {
        if (!module) {
            return _module[name];
        }
        _module[name] = module;
        return module;
    };
    packageHandler.all = function() {
        return _module;
    };

    packageHandler.each = function(callback, ctx = null) {
        for (let key in _module) {
            if (_module.hasOwnProperty(key)) {
                callback.call(ctx, _module[key], key, _module);
            }
        }
    };

    packageHandler.remove = function(name) {
        const module = _module[name];
        if (module) {
            delete _module[name];
            return _module;
        }
    };

    packageHandler.empty = function() {
        let old = _module;
        _module = {};
        return old;
    };

    return packageHandler;
}

export function debounce(func, time, ctx) {
    let thread;
    return function(...args) {
        clearTimeout(thread);
        thread = setTimeout(function() {
            func.apply(ctx, args);
        }, time);
    };
}
