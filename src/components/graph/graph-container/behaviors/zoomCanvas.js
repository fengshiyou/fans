import pandora from 'pandora';
const d3 = pandora.d3;
const Vector = pandora.Vector;

export default class ZoomCanvas extends pandora.interface.Behavior {
    getDefaultCfg() {
        return {
            minScale: 30,
            maxScale: 250,
            // step: 35
            step: 15
        };
    }
    constructor(chart, options) {
        super(chart, options);
        this.init();
    }

    init() {
        const chart = this.chart;
        const rootGroup = chart.get('rootGroup');
        const zoomCanvas = this;
        const mouseWheel = function () {
            const origin = rootGroup.transformCoordToLocal(d3.event.offsetX, d3.event.offsetY);
            d3.event.wheelDelta > 0 ? zoomCanvas.zoomIn(origin) : zoomCanvas.zoomOut(origin);
        };

        this.set({
            mouseWheel
        });
    }

    scaleTo(scale, animate = false, origin = this.chart.getViewCenter()) {
        const rootGroup = this.chart.get('rootGroup');
        this.chart.updateShape(rootGroup, {
            scale: [scale, scale],
            origin
        }, animate, { time: 100, callback: () => this.chart.emit('afterzoom', scale) });
    }

    zoomIn(origin = this.chart.getViewCenter()) {
        const rootGroup = this.chart.get('rootGroup');
        const presentScale = rootGroup.scale[0] * 100;
        const { maxScale, step } = this._cfg;
        const scale = Math.min(presentScale + step, maxScale);
        if (presentScale === scale) {
            return;
        }
        this.scaleTo(scale / 100, true, origin);
        if (scale / 100 >= 0.7) {
            let userSetting = this.chart.get('userSetting');
            userSetting.baseConfig.smallHidden = false;
            this.chart.setUserSetting(JSON.stringify(userSetting));
        }
    }

    zoomOut(origin = this.chart.getViewCenter()) {
        const rootGroup = this.chart.get('rootGroup');
        const presentScale = rootGroup.scale[0] * 100;
        const { minScale, step } = this._cfg;
        const scale = Math.max(presentScale - step, minScale);
        if (presentScale === scale) {
            return;
        }
        this.scaleTo(scale / 100, true, origin);
        if (scale / 100 < 0.7) {
            let userSetting = this.chart.get('userSetting');
            userSetting.baseConfig.smallHidden = true;
            this.chart.setUserSetting(JSON.stringify(userSetting));
        }
    }

    turnOn() {
        this.chart.get('stage').on('mousewheel', this.get('mouseWheel'));
    }

    turnOff() {
        this.chart.get('stage').on('mousewheel', null);
    }

    destroy() {
    }
}