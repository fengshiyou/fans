import util from "../../util";
import d3 from "../../lib/d3";
import Overlay from "../Overlay";

const styleLeftTop = {
    position: "absolute",
    top: "0",
    left: "0"
};

const Mixin = {
    INIT: "_initContainer",
    DESTROY: "_destoryContainer",

    CFG: {
        el: ""
    },

    mixin: {
        _initContainer() {
            const wrapper = d3.select(this.get("el"));
            if (wrapper.empty()) {
                throw new Error("can not find a container to build chart");
            }

            const container = wrapper.append("div");
            util.v4Style(container, {
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden"
            });

            const stage = container.append("div");
            util.v4Style(stage, { ...styleLeftTop, width: "100%", height: "100%" });
            // 创建overlay容器
            const overlay = container.append("div");
            util.v4Style(overlay, { ...styleLeftTop, zIndex: 10000 });

            this.setAll({
                container,
                wrapper,
                stage,
                overlay,
                styleLeftTop,
                _overlayCache: {}
            });
        },
        _destoryContainer() {
            this.get("stage").remove();
            this.get("overlay").remove();
            this.get("container").remove();
            Object.values(this.get("_overlayCache")).forEach(o => {
                o.destroy();
            });
        },
        /**
         * 获取一个 覆盖层div
         * @param {number|event} x
         * @param {number} y
         * @param {string} className
         */
        getOverlay(id, x, y, initStyle) {
            const overlayContainer = this.get("overlay");
            const cache = this.get("_overlayCache");
            const overlay = cache[id]
                ? cache[id]
                : (cache[id] = new Overlay(id, overlayContainer.append("div"), initStyle));
            overlay.cache = cache;
            overlay.setStyle({
                top: y + "px",
                left: x + "px"
            });
            return overlay;
        }
    }
};

export default Mixin;
