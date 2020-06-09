import pandora from 'pandora';
import { getSymbolId } from '../util';
import CircleNode from '../symbol/CircleNode';
import Link from '../symbol/Link';
const d3 = pandora.d3;
const SELECTION_ID = 'selection';
const EVENTS = {
    SELECT: 'select', // 某个symbol被选中时触发，发送该symbol的id
    UNSELECT: 'unselect', // 某个symbol 被取消选中时触发，发送该symbol的id
    IN: 'select:in', // 当新添加元素到选区时触发，发送新增加的symbolid
    OUT: 'select:out', // 当有symbol从选区中移除时触发，发送移除了的symbolid
    UPDATE: 'select:update', // 当选区更新时，发送最新选区中的symbolid
    BEFORESELECT: 'beforeselect', // 选区变更前事件，发送所要操作的symbolid以及 模式名称
    AFTERSELECT: 'afterselect', // 选区变更前事件，发送所要操作的symbolid以及 模式名称
};

export default class Selection extends pandora.interface.Behavior {
    static events = EVENTS
    events = EVENTS

    constructor(chart, options) {
        super(chart, options);
        this.init();
        this.emptySelection();
    }
    getDefaultCfg() {
        return {
        };
    }

    init() {
        const chart = this.chart;
        const zr = chart.get('canvas');
        let selectionRect;
        let selectionLayer;
        const selectionBehavior = this;
        let isCtrlKeyDown = false;
        let isAltKey = false;
        _bindEvent.call(this);

        function mouseDown() {
            if (d3.event.button !== 0) {
                return;
            }
            isCtrlKeyDown = d3.event.ctrlKey;
            isAltKey = d3.event.altKey;

            const target = zr.handler.findHover(d3.event.offsetX, d3.event.offsetY).target;
            const symbolId = getSymbolId(target);
            if (symbolId) {
                const symbol = chart.get('symbolKeeper').getSymbol(symbolId);
                if (symbol) {
                    selectionBehavior.toggleSelect(symbolId);
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
                    return;
                }
            }
            selectionRect = {
                x: d3.event.offsetX,
                y: d3.event.offsetY,
                width: 0,
                height: 0
            };
            selectionLayer = chart.getOverlay(SELECTION_ID, selectionRect.x, selectionRect.y);
            selectionLayer.setStyle({
                border: '1px solid #888',
                'background-color': 'rgba(0, 0, 0, 0.2)',
                display: 'block',
                width: 0,
                height: 0,
                left: selectionRect.x + 'px',
                top: selectionRect.y + 'px'
            });
            d3.select(document).on('mousemove', mouseMove);
            d3.select(document).on('mouseup', mouseUp);
        }
        function mouseMove() {
            if (selectionRect) {
                selectionRect.width += d3.event.movementX;
                selectionRect.height += d3.event.movementY;
            }
            const rect = getBoundingRect(selectionRect);
            selectionLayer.setStyle({
                left: rect.x + 'px',
                top: rect.y + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px'
            });
            debounceSelect(rect, isCtrlKeyDown ? 'union' : isAltKey ? 'decrease' : 'new');
        }
        function mouseUp() {
            selectionRect = null;
            selectionLayer.setStyle({
                display: 'none'
            });
            d3.select(document).on('mousemove', null);
            d3.select(document).on('mouseup', null);
        }

        const debounceSelect = pandora.util.debounce(this.selectRect, 16, this);

        this.set({
            mouseDown,
            mouseMove,
            mouseUp,
        });
    }

    emptySelection() {
        this.selected = [];
    }

    isSelected(symbolId) {
        return this.selected.includes(String(symbolId));
    }
    /**
     *
     * @param {*} rect 选择区域
     * @param {*} mode 选择模式，new全新,原来选择了则取消, union则全部加入, decrease 去掉选中的, toggle 增加新增的，去掉已选中的。
     */
    selectRect(rect, mode = 'new') {
        const rootGroup = this.chart.get('rootGroup');
        const children = rootGroup.children();
        const scale = rootGroup.scale[0];
        const symbolIds = [];
        const rectVector = (new pandora.Vector(rect.width, rect.height)).scale(1 / scale);
        rect = {
            ...rect,
            width: rectVector.x,
            height: rectVector.y
        };
        children.forEach(shape => {
            const symbolId = shape._symbolId;
            const symbol = this.chart.get('symbolKeeper').get(symbolId);
            if (!(symbol instanceof CircleNode)) {
                return;
            }
            if (isHit(rect, shape)) {
                symbolIds.push(symbolId);
            }
        });
        _select.call(this, symbolIds, mode);
    }

    toggleSelect(symbolId = []) {
        symbolId = Array.isArray(symbolId) ? symbolId : [symbolId];
        _select.call(this, symbolId, 'toggle');
    }

    select(symbolId = []) {
        symbolId = Array.isArray(symbolId) ? symbolId : [symbolId];
        _select.call(this, symbolId, 'union');
    }

    unselect(symbolId = []) {
        symbolId = Array.isArray(symbolId) ? symbolId : [symbolId];
        _select.call(this, symbolId, 'decrease');
    }

    setSelect(symbolId = []) {
        symbolId = Array.isArray(symbolId) ? symbolId : [symbolId];
        _select.call(this, symbolId, 'new');
    }

    getSelected() {
        return this.selected;
    }

    selectAllNodes = () => {
        this.select(this.chart.get('dataKeeper').get('graph').getNodesId());
    }
    unselectAll = () => {
        this.setSelect();
    }
    /**
     * 返回选择了的链接
     * @param {string} dataType 返回的数据类型格式
     */
    getSelectedNode(dataType = 'model') {
        const selectSymbols = this.chart.get('symbolKeeper').getSymbolList(this.selected).filter(s => s instanceof CircleNode);
        return selectDataType(selectSymbols, dataType);
    }
    /**
     * 返回选择了的链接
     * @param {string} dataType 返回的数据类型格式
     */
    getSelectedLink(dataType = 'model') {
        const selectSymbols = this.chart.get('symbolKeeper').getSymbolList(this.selected).filter(s => s instanceof Link);
        return selectDataType(selectSymbols, dataType);
    }

    turnOn() {
        const stage = this.chart.get('stage');
        stage.on('mousedown', this.get('mouseDown'));
        this.chart.get('container').on('dblclick', () => {
            this.unselectAll();
        });
    }
    turnOff() {
        const stage = this.chart.get('stage');
        stage.on('mousedown', null);
        this.chart.get('container').on('dblclick', null);
    }

    destroy() {
        this.unselect(this.selected);
        _unbindEvent.call(this);
    }
}

function getBoundingRect(selectRect) {
    const rect = {
        x: selectRect.width < 0 ? selectRect.x + selectRect.width : selectRect.x,
        y: selectRect.height < 0 ? selectRect.y + selectRect.height : selectRect.y,
        width: Math.abs(selectRect.width),
        height: Math.abs(selectRect.height)
    };
    return rect;
}

function isHit(rect, testShape) {
    const localPoint = testShape.transformCoordToLocal(rect.x, rect.y);
    const localRect = new pandora.zrender.BoundingRect(localPoint[0], localPoint[1], rect.width, rect.height);
    const shapeRect = testShape.getBoundingRect();
    const corners = [
        // [shapeRect.x, shapeRect.y],
        [shapeRect.x + shapeRect.width / 2, shapeRect.y + shapeRect.height / 2],
        // [shapeRect.x + shapeRect.width, shapeRect.y + shapeRect.height]
    ];
    return corners.every(point => localRect.contain(point[0], point[1]));
}

function _select(symbolIds, mode = 'new') {
    symbolIds = symbolIds.map(s => String(s));
    this.chart.emit(EVENTS.BEFORESELECT, symbolIds, mode);
    const notInThisRect = [];
    const inThisRect = [];
    this.selected.forEach(sid => {
        symbolIds.includes(sid) ? inThisRect.push(sid) : notInThisRect.push(sid);
    });
    const newToSelect = symbolIds.filter(sid => !inThisRect.includes(sid));
    if (mode === 'new') {
        notInThisRect.forEach(sid => _unselectOne.call(this, sid));
        notInThisRect.length && this.chart.emit(EVENTS.OUT, notInThisRect);

        newToSelect.forEach(sid => _selectOne.call(this, sid));
        newToSelect.length && this.chart.emit(EVENTS.IN, newToSelect);

    } else if (mode === 'union') {
        newToSelect.forEach(sid => _selectOne.call(this, sid));
        newToSelect.length && this.chart.emit(EVENTS.IN, newToSelect);

    } else if (mode === 'decrease') {
        inThisRect.forEach(sid => _unselectOne.call(this, sid));
        inThisRect.length && this.chart.emit(EVENTS.OUT, inThisRect);

    } else if (mode === 'toggle') {
        inThisRect.forEach(sid => _unselectOne.call(this, sid));
        inThisRect.length && this.chart.emit(EVENTS.OUT, inThisRect);

        newToSelect.forEach(sid => _selectOne.call(this, sid));
        newToSelect.length && this.chart.emit(EVENTS.IN, newToSelect);
    }
    if (['new', 'union', 'decrease', 'toggle'].includes(mode)) {
        this.chart.emit(EVENTS.UPDATE, this.selected);
    }
    this.chart.emit(EVENTS.AFTERSELECT, symbolIds, mode);
}


function _selectOne(symbolId) {
    symbolId = String(symbolId);
    const selected = this.selected;
    if (selected.includes(symbolId)) {
        return;
    }
    selected.push(symbolId);
    this.chart.emit(EVENTS.SELECT, symbolId);
}

function _unselectOne(symbolId) {
    symbolId = String(symbolId);
    const selected = this.selected;
    const index = selected.indexOf(symbolId);
    if (index < 0) {
        return;
    }
    selected.splice(index, 1);
    this.chart.emit(EVENTS.UNSELECT, symbolId);
}


function selectDataType(symbols, dataType) {
    switch (dataType) {
        case 'id':
            return symbols.map(s => s.id);
        case 'model':
            return symbols.map(s => s.model);
        case 'symbol':
        default:
            return symbols;
    }
}

function _bindEvent() {
    const behavior = this;
    let canvasId = behavior.chart._cfg.el.getAttribute('id');
    // 监听整个document事件时两张图谱会出现覆盖监听,这里分成两个事件来分别监听不同的图谱
    if (canvasId === 'canvasImage') {
        d3.select(document).on('keydown', () => {
            const event = d3.event;
            if (event.keyCode === 65 && event.ctrlKey) {
                behavior.selectAllNodes();
                event.preventDefault();
                return;
            }
            if (event.keyCode === 27) {
                behavior.unselectAll();
                event.preventDefault();
                return;
            }
        });
    } else {
        d3.select(document).on('keyup', () => {
            const event = d3.event;
            if (event.keyCode === 65 && event.ctrlKey) {
                behavior.selectAllNodes();
                event.preventDefault();
                return;
            }
            if (event.keyCode === 27) {
                behavior.unselectAll();
                event.preventDefault();
                return;
            }
        });
    }
}

function _unbindEvent() {
    d3.select(document).on('keydown', null);
}