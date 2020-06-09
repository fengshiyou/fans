import util from "../util";

export default class Overlay {
    constructor(id, element, initStyle) {
        if (!id) {
            throw new Error("必须给overlay 一个id");
        }
        this.id = id;
        this.element = element;
        this.setStyle({
            ...initStyle,
            position: "absolute"
        });
    }

    setStyle(style) {
        util.v4Style(this.element, style);
    }

    destroy() {
        this.beforeDestroy && this.beforeDestroy();
        this.element.remove();
        delete this.cache[this.id];
    }
}
