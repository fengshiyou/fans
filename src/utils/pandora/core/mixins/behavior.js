/**
 * @description
 *
 * pandora behavior api
 */

import config from "../../config";
import { behavior as behaviorPackage, mode as modePackage } from "../../behavior";

const Mixin = {
    INIT: "_initBehavior",
    DESTROY: "_destoryBehavior",
    CFG() {
        return {
            behaviors: [],
            initBehaviors: null,
            mode: ""
        };
    },
    mixin: {
        _initBehavior() {
            const behaviors = _getBehaviors.call(this);
            behaviors.forEach(name => {
                this.behaviorOn(name);
            });
        },

        _destoryBehavior() {
            this.get("behaviors").forEach(b => {
                b.destroy();
            });
        },

        getBehavior(name) {
            return _getExistBehaviorInstance.call(this, name);
        },

        behaviorOn(name) {
            const cfg = _normalizeBehaviorCfg(name);
            let behavior = _getExistBehaviorInstance.call(this, cfg.name);
            if (!behavior) {
                /**
                 * 这个地方主要是初始化时想能初始化行为实例，但是又不想激活它。但是实际上只要调用 behaviorOn({
                        name: '',
                        working: false
                    })
                    如果原来未创建实例的情况下，并不会真的turnOn.
                 */
                behavior = _getBehaviorInstance.call(this, cfg.name, cfg);
                if (cfg.hasOwnProperty("working") && !cfg.working) {
                    return;
                }
            }
            if (behavior.working) {
                return;
            }

            behavior.turnOn(this);
            behavior.working = true;
            this.emit("behaviorOn", behavior);
        },

        behaviorOff(name) {
            const behavior = _getExistBehaviorInstance.call(this, name);
            if (!behavior) {
                return;
            }
            if (behavior.working) {
                behavior.turnOff();
                behavior.working = false;
            }
            this.emit("behaviorOff", behavior);
        },

        isBehaviorOn(name) {
            const behavior = _getExistBehaviorInstance.call(this, name);
            if (!behavior) {
                return false;
            }
            return behavior.working;
        },

        changeMode(name) {
            // 新模式behavior开启
            // 老模式behavior 且不在defaultBehavior中 也不在新模式中的Behavior的关闭
            const oldMode = this.get("mode");
            const initBehaviors = this.get("initBehaviors");
            const oldBehaviors = modePackage(oldMode);
            const newBehaviors = modePackage(name);
            if (!newBehaviors) {
                return;
            }
            if (oldBehaviors) {
                oldBehaviors.forEach(b => {
                    if (!newBehaviors.includes(b) && !initBehaviors.includes(b)) {
                        this.behaviorOff(b);
                    }
                });
            }
        }
    }
};

export default Mixin;

function _getBehaviors() {
    const modeName = this.get("mode");
    const modeBehaviors = modePackage(modeName);
    const initBehaviors = this.get("initBehaviors");
    if (!initBehaviors) {
        // 初始化未配置图表初始行为，则优先模式配置
        this.set("initBehaviors", config.defaultBehavior);
        return _combineBehaviorList(config.defaultBehavior || [], modeBehaviors);
    }
    // 优先初始化图表时使用的behavior配置
    return _combineBehaviorList(modeBehaviors, initBehaviors);
}

function _getBehaviorInstance(name, options) {
    let behavior = _getExistBehaviorInstance.call(this, name);
    if (!behavior) {
        const BehaviorFactory = behaviorPackage(name);
        if (!BehaviorFactory) {
            throw new Error(`${name}行为没有工厂函数`);
        }
        behavior = new BehaviorFactory(this, options);
        behavior.name = name;
        const behaviors = this.get("behaviors");
        behaviors.push(behavior);
    }
    return behavior;
}

function _getExistBehaviorInstance(name) {
    const behaviors = this.get("behaviors");
    return behaviors.find(b => b.name === name);
}

// 行为的配置项可以为 string 或者 {name: 'behaviorName'}对象
function _normalizeBehaviorCfg(conf) {
    if (typeof conf === "string") {
        conf = {
            name: conf
        };
    }
    if (!conf.name) {
        throw new Error("请正确配置behavior:" + JSON.stringify(conf));
    }
    return conf;
}

/**
 * 合并两个behavior列表，
 * 相同的behavior，是b中的替换a中的。
 * @param {*} a
 * @param {*} b
 */
function _combineBehaviorList(a, b) {
    b = b ? b.map(_normalizeBehaviorCfg) : [];
    a = a ? a.map(_normalizeBehaviorCfg).filter(a => !b.find(b => b.name === a.name)) : [];
    return a.concat(b);
}
