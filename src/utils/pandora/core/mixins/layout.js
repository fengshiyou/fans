import util from "../../util";
import config from "../../config";
import Symbol from "../../interface/Symbol";

const Mixin = {
    INIT: "_initLayout",

    CFG: {},

    mixin: {
        _initLayout() {
            this.__tickId__ = 1;
            this.__tickList__ = [];
            this.layout = util.makePackage();
        },

        tick(tickList) {
            if (config.debug) {
                console.log("位置通知开始，通知对象：", tickList);
                console.log(new Error("调用栈:"));
            }
            if (!Array.isArray(tickList)) {
                tickList = [tickList];
            }
            const sample = tickList[0];
            if (!(sample instanceof Symbol)) {
                tickList = this.get("symbolKeeper").getSymbolList(tickList);
            }

            this.__tickList__ = this.__tickList__.concat(tickList);
            clearTimeout(this.__tickThread__);
            this.__tickThread__ = setTimeout(_tick.bind(this));
        }
    }
};
export default Mixin;

function _tick() {
    const tickList = this.__tickList__;
    this.__tickList__ = [];

    const tickId = this.__tickId__++;
    const arrLength = tickList.length;

    tickList.forEach((s, index) => {
        if (s.__tickId__ === tickId) {
            return;
        }
        s.__tickId__ = tickId;
        // not animate
        s.tick();
    });
}
