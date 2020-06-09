/**
 * @fileOverview
 * base class for graph
 * @author dodio
 */

import util from "../../util";

export default class Base {
    getDefaultCfg() {
        return {};
    }

    constructor(cfg) {
        const defaultCfg = this.getDefaultCfg();
        this._cfg = util.extend(true, {}, defaultCfg, cfg);
    }

    get(name) {
        return this._cfg[name];
    }

    set(name, value) {
        if (typeof name === "object") {
            return this.setAll(name);
        }
        this._cfg[name] = value;
    }

    setAll(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.set(key, obj[key]);
            }
        }
    }

    destroy() {
        this._cfg = {};
        this.destroyed = true;
    }
}
