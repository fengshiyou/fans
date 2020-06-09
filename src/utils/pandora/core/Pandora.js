import EventfulBase from "./base/EventfulBase";
import util from "../util";
import Mixins from "./mixins";

import config from "../config";

export default class Pandora extends EventfulBase {
    getDefaultCfg() {
        const cfg = {};
        Mixins.forEach(function(mixin) {
            let CFG = mixin.CFG;
            if (typeof CFG === "function") {
                CFG = CFG();
            }
            util.extend(cfg, CFG || {});
        });

        return util.extend(true, cfg, {
            plugins: []
        });
    }

    constructor(cfg) {
        super(cfg);
        _pluginInit.call(this);

        this.emit("beforeinit");
        _init.call(this);
        this.emit("afterinit");
    }

    config(key, value) {
        const cfg = this.get("config") || {};
        if (value === undefined) {
            return cfg[key];
        }
        cfg[key] = value;
        this.emit("config:" + key, value);
    }

    destroy() {
        [...Mixins].reverse().forEach(mixin => {
            mixin.DESTROY && this[mixin.DESTROY]();
        });
        super.destroy();
    }
}

function _init() {
    Mixins.forEach(Mixin => {
        Mixin.INIT && this[Mixin.INIT]();
    });
}

function _pluginInit() {
    const plugins = this.get("plugins");
    plugins.forEach(plugin => {
        plugin.graph = this;
        plugin.init && plugin.init();
    });
}

Mixins.forEach(function(Mixin) {
    util.extend(Pandora.prototype, Mixin.mixin);
});
