import EventEmitter from "events";
import { behavior, mode } from "./behavior";
import Vector from "./classes/Vector";
import config from "./config";
import Pandora from "./core/Pandora";
import Behavior from "./interface/Behavior";
import Plugin from "./interface/Plugin";
import Symbol from "./interface/Symbol";
// 引入内部使用的组件
import d3 from "./lib/d3";
import zrender from "./lib/zrender";
import util from "./util";

function init(...args) {
    return new Pandora(...args);
}

const pandora = {
    Pandora,
    init,
    d3,
    EventEmitter,
    zrender,
    util,
    config,
    interface: {
        Symbol,
        Plugin,
        Behavior
    },
    Vector,
    registerBehavior: behavior,
    registerMode: mode
};

export default pandora;
