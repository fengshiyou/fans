import pandora from 'pandora';
import { getSymbolId, setZlevel } from '../util';
import zLevels from '../zLevels';
const d3 = pandora.d3;
const Vector = pandora.Vector;

export default class PanCanvas extends pandora.interface.Behavior {
    constructor(chart, options) {
        super(chart, options);
        this.init();
    }
    getDefaultCfg() {
        return {
            cursor: true,
            dragNode: true,
            dragCanvas: true
        };
    }

    init() {
        const chart = this.chart;
        const rootGroup = chart.get('rootGroup');
        const panCanvas = this;
        const zr = chart.get('canvas');
        let symbol;
        let x;
        let y;
        function mouseDown() {
            if (d3.event.button !== 0) {
                return;
            }
            const { dragNode, dragCanvas } = panCanvas._cfg;
            if (!dragNode && !dragCanvas) {
                return;
            }
            const target = zr.handler.findHover(d3.event.offsetX, d3.event.offsetY).target;
            const symbolId = getSymbolId(target);
            if (symbolId && dragNode) {
                symbol = chart.get('symbolKeeper').getSymbol(symbolId);
                chart.emit('item:dragstart', symbol, d3.event);
                x = d3.event.offsetX;
                y = d3.event.offsetY;
                if (chart._cfg.el.getAttribute('id') === 'canvasImage') {
                    const sessionData = sessionStorage.getItem('hightLightIds');
                    if (sessionData) {
                        if (JSON.parse(sessionData).nodes.length > 0) {
                            if (JSON.parse(sessionData).nodes.includes(symbolId)) {
                                chart.hightLightAll();
                                chart.beginClearHightLight();
                            }
                        }
                        if (JSON.parse(sessionData).links.length > 0) {
                            if (JSON.parse(sessionData).links.includes(symbolId)) {
                                chart.hightLightAll();
                                chart.beginClearHightLight();
                            }
                        }
                    }
                } else {
                    const sessionData = sessionStorage.getItem('hightLightCRIds');
                    if (sessionData) {
                        if (JSON.parse(sessionData).nodes.length > 0) {
                            if (JSON.parse(sessionData).nodes.includes(symbolId)) {
                                chart.hightLightAll();
                                chart.beginClearHightLight();
                            }
                        }
                        if (JSON.parse(sessionData).links.length > 0) {
                            if (JSON.parse(sessionData).links.includes(symbolId)) {
                                chart.hightLightAll();
                                chart.beginClearHightLight();
                            }
                        }
                    }
                }
            }
            d3.select(document).on('mousemove', mouseMove);
            d3.select(document).on('mouseup', mouseUp);
        }
        function mouseMove() {
            const { dragNode, dragCanvas } = panCanvas._cfg;
            const position = rootGroup.position;
            const newPos = [position[0] + d3.event.movementX, position[1] + d3.event.movementY];
            if (symbol && dragNode) {
                chart.emit('item:drag', symbol, d3.event);
                return;
            }
            if (dragCanvas) {
                panCanvas.panTo(newPos);
            }
        }
        function mouseUp() {
            // 如果点击的是节点并且节点的位置没有发生变化，就让当前节点被选中或取消选中
            if (symbol && symbol.circle && x === d3.event.offsetX && y === d3.event.offsetY) {
                chart.getBehavior('Selection').toggleSelect(symbol.id);
                x = null;
                y = null;
            }
            const { dragNode } = panCanvas._cfg;
            if (symbol && dragNode) {
                chart.emit('item:dragend', symbol, d3.event);
                symbol = null;
            }
            d3.select(document).on('mousemove', null);
            d3.select(document).on('mouseup', null);
        }

        this.set({
            mouseDown,
            mouseMove,
            mouseUp
        });
    }

    panTo(position, animate = false) {
        const rootGroup = this.chart.get('rootGroup');
        this.chart.updateShape(rootGroup, {
            position
        }, animate, {
            time: 300,
            tween: 'backOut',
            force: true,
            callback: () => {
                this.chart.emit('afterpan', position);
            }
        });
    }


    focus(position, animate = true) {
        const size = this.chart.getSize();
        const rootGroup = this.chart.get('rootGroup');
        const globalPosition = rootGroup.transformCoordToGlobal(position[0], position[1]);
        const movement = [size[0] / 2 - globalPosition[0], size[1] / 2 - globalPosition[1]];
        const oldPosition = rootGroup.position;
        const pantoPosition = [oldPosition[0] + movement[0], oldPosition[1] + movement[1]];
        this.panTo(pantoPosition, animate);
    }

    // 将rootGroup整个区域的中心对准画布的中心
    fitCenter(animate = true) {
        this.focus(this.chart.getImageCenter(), animate);
    }

    turnOn() {
        this.chart.get('stage').on('mousedown', this.get('mouseDown'));
    }

    turnOff() {
        this.chart.get('stage').on('mousedown', null);
    }

    disableCanvasDrag() {
        this.set('dragCanvas', false);
    }
    enableCanvasDrag() {
        this.set('dragCanvas', true);
    }
    disableNodeDrag() {
        this.set('dragCanvas', false);
    }
    enableNodeDrag() {
        this.set('dragCanvas', true);
    }
    destroy() {
    }
}
