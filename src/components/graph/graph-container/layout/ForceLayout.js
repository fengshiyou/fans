import * as d3Force from 'd3-force';
import CircleNode from '../symbol/CircleNode';
import pandora from 'pandora';

export default class ForceLayout {
    constructor(chart, options) {
        this.chart = chart;
        this.nodes = [];
        this.options = pandora.util.extend({}, {
            collision: {
                radius: 10 + options.radius * 2
            },
            center: {
                center: [0, 0]
            },
            link: {
                distance: 200
            },
            manyBody: {
                strength: (n) => {
                    const st = this.graph.getNodeInfo(n.id).node.isAlone ? 20 : -1000;
                    return st;
                }
            }
        }, options);
        this._init();
    }
    get graph() {
        return this.chart.get('dataKeeper').get('graph');
    }
    _init() {
        const simulation = this.simulation = d3Force.forceSimulation();
        simulation.stop();
        simulation.force('x', d3Force.forceX());
        simulation.force('y', d3Force.forceY());
        this.bindEvent();
    }

    reload(clearFix = false) {
        const graph = this.graph;
        const keeper = this.chart.get('symbolKeeper');
        const simulation = this.simulation;
        simulation.stop();
        const nodes = keeper.getSymbolList(graph.getNodesId());
        this.nodes = nodes;
        simulation.nodes(nodes);
        if (clearFix) {
            this.clearFix();
        }
        this._force();
        this.reheat();
    }

    reheat(alpha = 1) {
        const simulation = this.simulation;
        simulation.alpha(alpha);
        simulation.restart();
    }

    _force() {
        const options = this.options;
        const simulation = this.simulation;
        const graph = this.graph;
        if (options.center) {
            // options.center[0], options.center[1]
            simulation.force('center', d3Force.forceCenter());
        } else {
            simulation.force('center', null);
        }
        if (options.collision) {
            const collision = d3Force.forceCollide(options.collision.radius);
            simulation.force('collision', collision);
        } else {
            simulation.force('collision', null);
        }
        if (options.link) {
            const links = graph.links.map(link => ({
                source: link.sourceId,
                target: link.targetId,
                strength: 1 / Math.max(graph.getNodeInfo(link.sourceId).node.children.length, graph.getNodeInfo(link.targetId).node.children.length)
            }));
            const linkForce = d3Force.forceLink(links)
                .distance(options.link.distance)
                .strength(l => l.strength)
                .id(n => n.id);
            simulation.force('link', linkForce);
        } else {
            simulation.force('link', null);
        }
        if (options.manyBody) {
            const manyBody = d3Force.forceManyBody();
            manyBody.strength(options.manyBody.strength);
            simulation.force('charge', manyBody);
        } else {
            simulation.force('charge', null);
        }
    }

    tick = () => {
        this.chart.tick(this.nodes);
    }

    fixNode = (symbol) => {
        symbol.fx = symbol.x;
        symbol.fy = symbol.y;
    }

    dragNode = (symbol) => {
        if (symbol instanceof CircleNode) {
            this.fixNode(symbol);
            this.reheat(0.5);
        }
    }

    clearFix() {
        this.nodes.forEach(n => {
            this.fix(n, null, null);
        });
    }

    fix(symbol, x, y) {
        symbol.fx = x;
        symbol.fy = y;
    }

    onDataupdated = () => {
        this.reload();
    }

    bindEvent() {
        this.simulation.on('tick', this.tick);
        this.chart.on('item:drag', this.dragNode);
        this.chart.on('dataupdated', this.onDataupdated);
    }

    unbindEvent() {
        this.chart.off('item:drag', this.dragNode);
        this.chart.off('dataupdated', this.onDataupdated);
    }

    destroy() {
        this.simulation.stop();
        this.unbindEvent();
    }
}