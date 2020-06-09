import { NetLink, util } from './controller/graph';

const STATE = {
    notbegin: 'notbegin',
    doing: 'doing'
};
const STATES = Object.values(STATE);

export default class Filter {
    constructor(chart) {
        this.chart = chart;
        this.dataKeeper = this.chart.get('dataKeeper');
        this.__changeState(STATE.notbegin);
    }

    __changeState(state) {
        if (!STATES.includes(state)) {
            throw Error('状态未在枚举列表中');
        }
        this._state = state;
    }

    __checkState(state) {
        state = Array.isArray(state) ? state : [state];
        if (!state.includes(this._state)) {
            throw new Error('状态不对');
        }
    }

    begin() {
        this.__checkState(STATE.notbegin);
        this._syncDataToFilter();
        this._bindEvents();
        this.__changeState(STATE.doing);
    }

    _syncDataToChart = (net) => {
        this.dataKeeper.set('graph', this.originalGraph);
    }
    _syncDataToFilter = (net) => {
        this.originalGraph = this.dataKeeper.get('graph').clone();
    }

    _bindEvents() {
        this.chart.on('beforeaddnet', this._syncDataToChart);
        this.chart.on('dataupdated', this._syncDataToFilter);
    }
    _unbindEvents() {
        this.chart.off('beforeaddnet', this._syncDataToChart);
        this.chart.off('dataupdated', this._syncDataToFilter);
    }
    cancel() {
        this.__checkState(STATE.doing);
        this._unbindEvents();
        this._syncDataToChart();
        this.chart.render();
        this.chart.emit('dataupdated', this.chart.getCurrentData());
        this.__changeState(STATE.notbegin);
    }

    complete() {
        this.__checkState(STATE.doing);
        this._unbindEvents();
        this.originalGraph = null;
        this.chart.emit('dataupdated', this.chart.getCurrentData());
        this.__changeState(STATE.notbegin);
    }

    removeNode(nodes) {
        this.__checkState(STATE.doing);
        const graph = this.originalGraph.clone();
        graph.removeNode(nodes);
        this.dataKeeper.set('graph', graph);
        this.chart.render();
    }

    removeLink(links) {
        this.__checkState(STATE.doing);
        const graph = this.originalGraph.clone();
        links = util.arraylize(links).map(link => new NetLink(link.startId, link.endId, link.id));
        graph.removeLink(links);
        this.dataKeeper.set('graph', graph);
        this.chart.render();
    }
}