import zrender from "../../lib/zrender";
import config from "../../config";

const LEVEL_NORMAL = 0;
const LEVEL_MOVING = 10;

const Mixin = {
    INIT: "_initCanvas",
    DESTROY: "_destoryCanvas",
    CFG() {
        return {
            zrenderOption: {},
            canvas: null,
            rootGroup: null,
            zrender,
            config: {
                animate: config.animate,
                animate_stop_amount: 300
            },
            renderListGetter() {
                return [];
            }
        };
    },
    mixin: {
        _initCanvas() {
            _initPainter.call(this);
            _initEvent.call(this);
        },
        _destoryCanvas() {
            this.get("canvas").dispose();
        },

        getSize() {
            const zr = this.get("canvas");
            return [zr.getWidth(), zr.getHeight()];
        },
        getImageCenter() {
            const rootGroup = this.get("rootGroup");
            const rootRect = rootGroup.getBoundingRect();
            return [rootRect.x + rootRect.width / 2, rootRect.y + rootRect.height / 2];
        },

        getViewCenter() {
            const rootGroup = this.get("rootGroup");
            const size = this.getSize();
            const scale = rootGroup.scale[0];
            const rootPosition = rootGroup.position;
            return rootGroup.transformCoordToLocal(size[0] / 2, size[1] / 2);
        },

        render() {
            const dataKeeper = this.get("dataKeeper");
            const presentRenders = this.get("renderListGetter")(this);

            const prevRenders = (this.____prevRenders____ = this.____prevRenders____ || []);
            this.diffRender(presentRenders, prevRenders);
            this.____prevRenders____ = presentRenders;
            this.config("animate", presentRenders.length < this.config("animate_stop_amount"));
        },

        diffRender(renderList, prevRenderList = []) {
            _render.call(this, renderList, prevRenderList);
        },

        updateShape(shape, attr, animate = true, animateOption = {}) {
            const globalAnimateStatus = this.config("animate");

            // 因为 zrender 动画无法自动串联，然后还有非常不完善的地方：一个动画未结束又调用animate的情况下，会内部调用sotpAnimation 然后就会停在动画原来的位置，
            // 在本项目中的问题体现在，节点等元素位置无法正确更新。
            // 如果手动调用stopAnimation(true) 则又会导致动画结束回调函数无法执行。在本项目中表现为如果给元素增加”移除动画效果“，则可能因为 hover动画效果导致 触发stopAnimation，
            // 导致回调不执行，而无法删除节点。
            // 所以现在就小范围使用动画，仅移动增加动画
            const shallAnimate = animate && globalAnimateStatus;
            return new Promise(function(resolve, reject) {
                if (shallAnimate) {
                    shape.stopAnimation(true);
                    shape.animateTo(
                        attr,
                        animateOption.time || 300,
                        animateOption.delay || 0,
                        animateOption.tween || "linear",
                        animateEnd,
                        animateOption.force || true
                    );
                    return;
                }
                shape.attr(attr);
                animateEnd();

                function animateEnd() {
                    let rs;
                    if (animateOption.callback) {
                        rs = animateOption.callback.call(null);
                    }
                    resolve(rs);
                }
            });
        }
    }
};

export default Mixin;

function _render(presentRenders, prevRenders = []) {
    const chart = this;
    const canvas = this.get("canvas");
    const rootGroup = this.get("rootGroup");
    const symbolKeeper = this.get("symbolKeeper");

    const diff = symbolKeeper.diff(prevRenders, presentRenders);
    this.emit("beforerender", diff);

    // 需要添加的进行添加，并调用回调函数
    const toAddCount = diff.toRemove.length;
    diff.toAdd.forEach((s, index) => {
        const picture = s.getPicture();
        s.beforeAdd(index, toAddCount);
        picture && rootGroup.add(picture);
        setTimeout(() => {
            s.afterAdded(index, toAddCount);
        });
    });

    const toRemoveCount = diff.toRemove.length;
    // 调用回调后（对方动画执行完后）并移除.
    diff.toRemove.forEach((s, index) => {
        const picture = s.getPicture();
        const rs = s.beforeRemove(index, toRemoveCount);
        Promise.resolve(rs).then(function() {
            if (picture) {
                rootGroup.remove(picture);
            }
            s.afterRemoved(index, toRemoveCount);
        });
    });

    // 保留controller 还在的渲染记录
    this.emit("afterrender", diff);
}

function _initPainter() {
    const stage = this.get("stage");
    const zrenderOption = this.get("zrenderOption");
    console.log("zrender", zrender);
    const canvas = zrender.init(stage.node(), zrenderOption);
    const rootGroup = new zrender.Group();
    canvas.add(rootGroup);
    this.setAll({
        canvas,
        rootGroup,
        zrender
    });
}

function _initEvent() {
    const canvas = this.get("canvas");
    const keeper = this.get("symbolKeeper");
    const chart = this;

    const events = ["click", "mousedown", "mouseup", "mousewheel", "dblclick", "contextmenu"];
    events.forEach(eventName => {
        canvas.on(eventName, makeListener(eventName));
    });

    function makeListener(evtName) {
        return function triggerItemEvent(evt) {
            if (!evt.target) {
                return;
            }
            const symbolId = evt.target.parent._symbolId;
            // toto 按类层级触发事件
            chart.emit(evtName + ".symbol", keeper.get(symbolId), evt);
        };
    }
}
