import Base from "../core/base/Base";

/**
 * 所有图形的渲染器基类
 */
export default class Symbol extends Base {
    /**
     * 创建Renderable
     * @param  {[type]} id     可渲染对象的id
     * @param  {[type]} keeper 所属管理器实例
     */
    constructor(id, cfg) {
        if (!id) {
            throw new Error("a Renderable must be generate a unique id");
        }
        super(cfg);
        this.id = id;
        this.x = this.y = 0;
        this.keeper = null; // 由SymbolWorld 调用统一进行设置
        this.fixed = false; // 该图形是否固定位置（不参与布局自动计算）
        this._picture = null; // 可由canvas 操作 add 或 remove 的对象
    }

    setZlevel(zLevel) {}

    beforeAdd() {}
    /**
     * 添加到界面上以后调用，与beforeRemove 一样主要用于动画使用
     */
    afterAdded() {}

    /**
     * 被从世界移除之前调用
     * @return {Promise} 返回一个Promise resolve了后从界面上删除
     */
    beforeRemove() {}

    afterRemoved() {}

    get chart() {
        return this.keeper.chart;
    }

    /**
     * 获取图像的方法，子类请不要复写
     * @param  {[type]} chart [description]
     * @return {[type]}       [description]
     */
    getPicture() {
        if (this._picture === false || this._picture) {
            return this._picture;
        }
        this._picture = this.drawPicture();
        this._picture._symbolId = this.id;
        return this._picture;
    }

    /**
     * 可以return false 不创建图形，用来代理其它的图形
     * @param  {[type]} chart [description]
     * @return {[type]}       [description]
     */
    drawPicture() {
        throw new Error("这是默认的创建图像的方法，请需要绘图的子类复写，但不要做添加操作");
    }
    /**
     * 更新
     */
    updatePicture() {
        throw new Error("这是默认的更新图像的方法，请子图实现");
    }
    /**
     * 位置更新时的调用函数
     */
    tick() {
        console.error("这是默认更新位置的方法，请需要绘图的子类复写");
    }

    getLinkage() {
        return [];
    }
}
