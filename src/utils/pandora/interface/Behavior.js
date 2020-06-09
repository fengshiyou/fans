import Base from "../core/base/Base";

export default class Behavior extends Base {
    constructor(chart, cfg) {
        super(cfg);
        this.chart = chart;
        this.working = false;
    }

    turnOn() {
        throw new Error("子类实现");
    }
    turnOff() {
        throw new Error("子类实现");
    }
    destroy() {
        throw new Error("子类实现");
    }
}
