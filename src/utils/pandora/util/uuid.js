const md5 = require("../lib/md5");

export { md5 };

/**
 * obj 必须是纯粹的obj，不能有循环引用。不然只能stringify 了
 * @param  {Object} obj [一个object]
 * @param  {Array[string]} keyIgnore [需要忽略的key列表]
 * @return {String}     [md5 hash of this object]
 */
export function objectId(obj, keyIgnore) {
    if (obj === null || obj === "undefined") {
        obj = "95271770";
    }
    if (typeof obj === "function") {
        return md5(obj.toString());
    }
    if (typeof obj === "string") {
        return md5(obj);
    }
    if (Array.isArray(obj)) {
        return md5(obj.map(v => objectId(v, keyIgnore)).join("-"));
    }
    if (typeof obj === "object") {
        let keys = Object.keys(obj);
        if (keyIgnore) {
            keys = keys.filter(key => !keyIgnore.includes(key));
        }
        keys = keys.sort(function(k1, k2) {
            return k1 > k2 ? -1 : 1;
        });
        return md5(
            keys
                .map(function(key) {
                    return `${key} + ${objectId(obj[key], keyIgnore)}`;
                })
                .join("-")
        );
    }
    return md5(obj.toString());
}

let uuid = 0;
export function uid() {
    const id = "pandora_" + uuid++;
    return id;
}
