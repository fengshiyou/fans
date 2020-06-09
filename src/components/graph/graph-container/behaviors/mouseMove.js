import pandora from 'pandora';
import * as util from '../util';
const d3 = pandora.d3;
const Vector = pandora.Vector;

const OVERLAY_PREX = 'mousemove_';

export default class MOuseMove extends pandora.interface.Behavior {
    getDefaultCfg() {
        return {
            className: '',
            render() {
            },
            destroy() {

            },
            test(target, symbol, evt) { },
            overlayStyle: {},
        };
    }
    constructor(chart, options) {
        super(chart, options);
        this.init();
    }

    init() {
        const chart = this.chart;
        const stage = chart.get('stage');
        const zr = chart.get('canvas');
        const menuBehavior = this;
        const mouseMoveHandler = function () {
            const evt = d3.event;
            evt.preventDefault();

            const target = zr.handler.findHover(evt.offsetX, evt.offsetY).target;
            let symbol;
            if (target) {
                symbol = chart.get('symbolKeeper').get(util.getSymbolId(target));
            }
            if (!menuBehavior.get('test')(target, chart, symbol, evt)) {
                return;
            }

            const overlayId = symbol ? OVERLAY_PREX + symbol.id : OVERLAY_PREX + 'stage';

            let prevMenu = menuBehavior.get('_prevMenu');
            if (prevMenu && prevMenu.id !== overlayId) {
                menuBehavior.get('destroy')(prevMenu.element);
                prevMenu.destroy();
            }

            const presentMenu = chart.getOverlay(overlayId, evt.offsetX, evt.offsetY, menuBehavior.get('overlayStyle'));
            presentMenu.element.attr('class', menuBehavior.get('className'));

            if (!prevMenu || prevMenu.id !== overlayId) {
                const render = menuBehavior.get('render');
                render(presentMenu, chart, symbol, evt);
            }
            menuBehavior.set('_prevMenu', presentMenu);

            if (!documentCloseHandler.isBinded) {
                d3.select(document).on('mouseout', documentCloseHandler);
                documentCloseHandler.isBinded = true;
            }
        };

        const documentCloseHandler = function () {
            const evt = d3.event;
            const prevMenu = menuBehavior.get('_prevMenu');
            if (prevMenu && Array.prototype.slice.call(evt.path).every(ele => ele !== prevMenu.element.node())) {
                menuBehavior.closeMenu(prevMenu);
            }
        };

        this.set({
            mouseMoveHandler,
            documentCloseHandler
        });
    }
    // 防止移到时频繁开关
    closeMenu(prevMenu) {
        // const menuBehavior = this;
        // const documentCloseHandler = this.get('documentCloseHandler');
        // menuBehavior.get('destroy')(prevMenu.element);
        // prevMenu.destroy();
        // menuBehavior.set('_prevMenu', null);
        // d3.select(document).on('mouseout', null);
        // documentCloseHandler.isBinded = false;
    }

    turnOn() {
        this.chart.get('stage').on('mousemove', this.get('mouseMoveHandler'));
        this.chart.get('stage').on('mouseout', null);
    }

    turnOff() {
        this.chart.get('stage').on('mousemove', null);
    }

    destroy() {
        const prevMenu = this.get('_prevMenu');
        console.log('prevMenu', prevMenu);
        prevMenu && this.closeMenu(prevMenu);
    }
}
