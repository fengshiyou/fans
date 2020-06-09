import pandora from 'pandora';
const d3 = pandora.d3;
const Vector = pandora.Vector;

export default class Resize extends pandora.interface.Behavior {
    getDefaultCfg() {
        return {
        };
    }
    constructor(chart, options) {
        super(chart, options);
        this.init();
    }

    init() {
        const onResize = pandora.util.debounce(this.resize, 500, this);
        this.set({
            onResize
        });
    }

    resize() {
        const chart = this.chart;
        chart.get('canvas').resize();
    }

    turnOn() {
        window.addEventListener('resize', this.get('onResize'));
    }

    turnOff() {
        window.removeEventListener('resize', this.get('onResize'));
    }

    destroy() {
        this.turnOff();
    }
}