import './register';
import pandora from 'pandora';
import updateKeeper from './controller/updateKeeper';
import { userSetting } from './symbol/data/userSetting';
import { createNet, transform, setZlevel, getSymbolId, sortClassify, downLoadFile, compareObj, mergeSide } from './util';
import { Graph } from './controller/graph';
import CircleNode from './symbol/CircleNode';
import zLevels from './zLevels';
import Link from './symbol/Link';
import { getAllGraphRenderList } from './controller/renderList';
import Filter from './Filter';
import { panguCircleLayout, panguTreeLayout, panguForceLayout, panguCascadLayout } from './layout/index';
import _ from 'lodash';

export default class Pangu extends pandora.Pandora {
    constructor(container, options) {
        super({
            _layoutName: 'circle',
            userSetting: userSetting,
            candidateCenters: [],
            ...options,
            el: container,
            renderListGetter: getAllGraphRenderList
        });
        _init.call(this);
        this.clearSession = true;
    }

    getCurrentData() {
        const graph = this.get('dataKeeper').get('graph');
        const keeper = this.get('symbolKeeper');
        const nodes = keeper.getSymbolList(graph.getNodesId()).map(n => n.model);
        const links = keeper.getSymbolList(graph.getLinksId()).map(l => l.model);
        return {
            nodes,
            links
        };
    }
    /**
     * 提供数据重置图谱
     * @param {*} data 业务图数据
     * @param {Array[nodeid]} candidateCenters 候选的图中心节点列表
     */
    data(data) {
        data.links = mergeSide(data.links);
        data.nodes = sortClassify(data.nodes);
        const { dataKeeper, symbolKeeper } = this._cfg;
        const { nodes, links } = transform(data.nodes, data.links);
        updateKeeper.call(this, data, symbolKeeper);
        const graph = new Graph(nodes, links);
        this.emit('beforesetdata', data, graph);
        dataKeeper.set('graph', graph);
        this.emit('aftersetdata', data, graph);
        this.emit('dataupdated', this.getCurrentData());

        this.doLayout();
        this.render();

        /* setTimeout(() => {
            this.setFlagNodes([1860568969344], 'compass', 'blue', true);
            this.setUserSetting(JSON.stringify({ baseConfig: { maxNode: 40, lineColor: 'red' }, Person: { nodeSize: 40 }}));
        }, 4000); */
    }

    addNet(data, candidateCenter) {
        data.links = mergeSide(data.links);
        data.nodes = sortClassify(data.nodes);
        const { dataKeeper, symbolKeeper } = this._cfg;
        updateKeeper.call(this, data, symbolKeeper);
        const net = createNet(data.nodes, data.links);
        if (candidateCenter) {
            this.set('candidateCenters', this.get('candidateCenters').concat(candidateCenter));
        }
        this.emit('beforeaddnet', net);
        const graph = dataKeeper.get('graph');
        const rs = graph.addNet(net);
        this.emit('afteraddnet', net, rs);
        this.render();
        this.doLayout();
        if (rs.nodes.length || rs.links.length) {
            this.emit('dataupdated', this.getCurrentData());
        }
        const highlightSymbols = net.getNodesId().concat(net.getLinksId());
        // this.getBehavior('Selection').setSelect(highlightSymbols);
    }

    /**
     * 重点节点发现
     * nodes 节点数组, [{id: 1, weighted_sum: 22}]
     * color 节点颜色red、blue、yellow
     * showIcon: 是否显示皇冠
     * showScore: 是否显示节点分数
     * position: 分数位置， 支持left,right
     * */
    setCoreNodes(nodes, color = 'red', showIcon, showScore, position = 'right') {
        if (!nodes.length) {
            return;
        }
        if (this.coreNodes) {
            this.clearCoreNodes(this.coreNodes);
        }
        this.setUserSetting(JSON.stringify({
            baseConfig: {
                coreScore: {
                    scorePosition: position,
                    color: color
                },
            },
            HG: {
                iconColor: color
            }
        }), true);
        const { symbolKeeper } = this._cfg;
        nodes.forEach(item => {
            let node = symbolKeeper.get(item.id);
            if (node) {
                node.model.core = showIcon;
                node.model.showScore = showScore;
                node.model.score = item.weighted_sum || 0;
                node.updatePicture();
            } else {
                console.log('没有对应节点');
            }
        });
        this.coreNodes = nodes;
    }

    /**
     * 清除已经标记的节点
     * */
    clearCoreNodes(nodes) {
        const { symbolKeeper } = this._cfg;
        nodes.forEach(item => {
            let node = symbolKeeper.get(item.id);
            if (node) {
                node.model.core = false;
                node.model.showScore = false;
                node.model.score = 0;
                node.updatePicture();
            } else {
                console.log('没有要清除的节点');
            }
        });
        this.coreNodes = null;
    }

    /**
     * 标记节点
     * ids节点id数组
     * type water: 水滴, compass: 指南针
     * color 节点颜色
     * show: true标识添加标记，false表示清除标记
     * */
    setFlagNodes(ids, type, color = 'red', show = true) {
        if (!ids.length) {
            return;
        }
        this.setUserSetting(JSON.stringify({ BJ: { fonticon: type }}));
        const { symbolKeeper } = this._cfg;
        ids.forEach(id => {
            let node = symbolKeeper.get(id);
            node.model.flag = show;
            node.model.flagColor = color;
            node.updatePicture();
        });
    }

    /**
     * 设置用户自定义样式
     * settings结构必须和pangu-graph/symbol/data/userSetting.js里面的userSetting一样
     * example: {
     *      Person: {
     *          nodeSize: 40
     *      }
     * }
     * 改变人的节点大小
     * flag: 是否更新节点，true为不更新
     * */
    setUserSetting(settings, flag) {
        if (!settings) {
            return;
        }
        let obj = {};
        compareObj(true, obj, this.get('userSetting'), JSON.parse(settings));
        this.set('userSetting', obj);
        // 用于获取图上是否有节点，判断是否进行视图更新
        const graph = this.get('dataKeeper').get('graph');
        const keeper = this.get('symbolKeeper');
        const nodes = keeper.getSymbolList(graph.getNodesId()).map(n => n.model);
        // 图谱上有元素才进行更新，线是基于nodes的，所以只需要判断有nodes就肯定有元素
        if (nodes) {
            if (!flag) {
                this.doLayout();
                // 更新所有的节点和线条
                const { _symbols } = this._cfg.symbolKeeper;
                for (let key in _symbols) {
                    if (_symbols[key] instanceof CircleNode) {
                        _symbols[key].updatePicture();
                    } else {
                        _symbols[key].tick();
                    }
                }
            }
        }
    }

    /**
     * 获取最大节点半径, 用于计算线条之间的距离，
     * 如果设置的节点nodeSize大于maxNode，请记得更新baseConfig.maxNode
     * */
    getMaxNode() {
        let setting = this.get('userSetting');
        return setting.baseConfig.maxNode;
    }

    /**
     * direction: cascad布局的方向
     * vertical: 垂直
     * horizontal: 水平（默认）
     * */
    setLayout(name, force = false, direction) {
        const layout = this.layout(name);
        const preLayout = this.getLayout();
        if (!layout) {
            return;
        }
        if (layout === preLayout && !force) {
            return;
        }
        this.set('_layoutName', name);
        this.set('_direction', direction || 'horizontal');
        this.doLayout();
        console.log('this', this);
        // this.get('behavior').fitCenter();
    }

    getLayout() {
        const layoutName = this.get('_layoutName');
        const layout = this.layout(layoutName);
        return layout;
    }

    doLayout() {
        const layout = this.getLayout();
        layout(this, this._cfg.dataKeeper.get('graph'), this._cfg.symbolKeeper, this.get('userSetting').baseConfig.maxNode || 23);
    }
    /**
     * canvas转存图片
     * */
    drawImage(canvasName) {
        let canvas = document.querySelector(`#${canvasName}`).querySelectorAll('canvas')[0];
        downLoadFile('tupu.png', canvas.toDataURL('image/png'));
    }

    removeNode(node) {
        const { dataKeeper, symbolKeeper } = this._cfg;
        const graph = dataKeeper.get('graph');
        const rs = graph.removeNode(node);
        console.log('rs', rs);
        if (rs.length) {
            this.render();
            this.emit('dataupdated', this.getCurrentData());
            // 移除节点的时候清除节点的选中状态
            this.getBehavior('Selection').unselect(rs.map(n => n.id));
        }
    }

    collapse(node) {
        const { dataKeeper, symbolKeeper } = this._cfg;
        const graph = dataKeeper.get('graph');
        const nodeInfo = graph.getNodeInfo(node.id);
        if (!nodeInfo) {
            return;
        }
        const children = nodeInfo.node.children.filter(n => n.children.length < 2).map(n => n.clone());
        graph.removeNode(children);
        if (children.length) {
            this.render();
            this.emit('dataupdated', this.getCurrentData());
            this.getBehavior('Selection').unselect(children.map(n => n.id));
        }
    }

    collapseAllChildren(node) {
        const { dataKeeper, symbolKeeper } = this._cfg;
        const graph = dataKeeper.get('graph');
        const nodeInfo = graph.getNodeInfo(node.id);
        if (!nodeInfo) {
            return;
        }
        const children = nodeInfo.net.nodes.filter(n => n.id !== node.id).map(n => n.clone());
        graph.removeNode(children);
        if (children.length) {
            this.render();
            this.emit('dataupdated', this.getCurrentData());
            this.getBehavior('Selection').unselect(children.map(n => n.id));
        }
    }
    // 反选
    inverseSelection = () => {
        const currentData = this.getCurrentData();
        const selection = this.getBehavior('Selection');
        const selectedNodes = selection.getSelectedNode();
        const selectedLinks = selection.getSelectedLink();
        let newNodes;
        let newLinks;
        newNodes = _.difference(currentData.nodes, selectedNodes);
        newLinks = _.difference(currentData.links, selectedLinks);
        selection.unselect(selectedLinks.map(n => n.id));
        selection.select(newLinks.map(n => n.id));
        selection.unselect(selectedNodes.map(n => n.id));
        selection.select(newNodes.map(n => n.id));
    };

    getFilter() {
        let filter = this.get('datafilter');
        if (!filter) {
            filter = new Filter(this);
            this.set('dataFilter', filter);
        }
        return filter;
    }

    /**
     * 切换selection与pancanvas行为
     */
    toggleSelectionBehavior() {
        const selection = this.getBehavior('Selection');
        if (!selection || !selection.working) {
            this.behaviorOff('PanCanvas');
            this.behaviorOn('Selection');
            return true;
        }
        this.behaviorOff('Selection');
        this.behaviorOn('PanCanvas');
        return false;
    }

    /**
     * 切换mousemove与pancanvas行为
     */
    toggleMouseMoveBehavior() {
        const mouseMove = this.getBehavior('MouseMove');
        if (!mouseMove || !mouseMove.working) {
            // this.behaviorOff('PanCanvas');
            this.behaviorOn('MouseMove');
            return true;
        }
        this.behaviorOff('MouseMove');
        // this.behaviorOn('PanCanvas');
        return false;
    }

    _clearDragedMap() {
        this.set('dragedNodeMap', {});
    }

    focus(nodeid) {
        const panBehavier = this.getBehavior('PanCanvas');
        const symbol = this.get('symbolKeeper').get(nodeid);
        const position = symbol instanceof CircleNode ? [symbol.x, symbol.y] : pandora.Vector.add.apply(null, symbol.getAnchorPoints()).scale(0.5).toArray();
        panBehavier.focus(position, this.config('animate'), symbol.group);
    }
    // 全部高亮
    hightLightAll() {
        this.clearSession = true;
        let data = this.getCurrentData();
        let nodesIds = data.nodes.map(obj => {
            if (!obj) {
                return obj;
            }
            this.get('symbolKeeper').get(obj.id).group._children.forEach(obj => {
                this.updateShape(obj, {
                    style: {
                        opacity: 1
                    }
                }, true, {
                    time: 100
                });
            });
            return obj.id;
        });
        let linksIds = data.links.map(obj => {
            if (!obj) {
                return obj;
            }
            this.updateShape(this.get('symbolKeeper').get(obj.id).text, {
                style: {
                    opacity: 0.8
                }
            }, true, {
                time: 100
            });
            this.updateShape(this.get('symbolKeeper').get(obj.id).textGroup, {
                style: {
                    opacity: 0.8
                }
            }, true, {
                time: 100
            });
            this.updateShape(this.get('symbolKeeper').get(obj.id).textRect, {
                style: {
                    opacity: 0.8
                }
            }, true, {
                time: 100
            });
            return obj.id;
        });
        if (this._cfg.el.getAttribute('id') === 'canvasImage') {
            sessionStorage.setItem('hightLightIds', JSON.stringify({ nodes: nodesIds, links: linksIds }));
        } else {
            sessionStorage.setItem('hightLightCRIds', JSON.stringify({ nodes: nodesIds, links: linksIds }));
        }
    }

    beginClearHightLight = () => {
        this.clearSession = true;
    };

    completeClearHightLight = () => {
        this.clearSession = false;
    }
    // 传入节点和边高亮，只在第一次调用进行清除，配合beginClearHightLight和completeClearHightLight可以实现累计高亮
    addHightLight = (nodesIds = [], linksIds = []) => {
        if (this.clearSession) {
            if (this._cfg.el.getAttribute('id') === 'canvasImage') {
                sessionStorage.removeItem('hightLightIds');
            } else {
                sessionStorage.removeItem('hightLightCRIds');
            }
            this.clearSession = false;
        }
        if (this._cfg.el.getAttribute('id') === 'canvasImage') {
            // 核心节点只有节点，所以高亮时只需传节点id即可，由于后台返回的核心节点和图谱节点id字段类型不同，需手动转为数字类型
            const hightLightIds = sessionStorage.getItem('hightLightIds');
            if (hightLightIds) {
                this.hightLight(Array.from(new Set(JSON.parse(hightLightIds).nodes.concat(nodesIds))), Array.from(new Set(JSON.parse(hightLightIds).links.concat(linksIds))));
            } else {
                this.hightLight(nodesIds, linksIds);
            }
        } else {
            // 核心节点只有节点，所以高亮时只需传节点id即可，由于后台返回的核心节点和图谱节点id字段类型不同，需手动转为数字类型
            const hightLightCRIds = sessionStorage.getItem('hightLightCRIds');
            if (hightLightCRIds) {
                this.hightLight(Array.from(new Set(JSON.parse(hightLightCRIds).nodes.concat(nodesIds))), Array.from(new Set(JSON.parse(hightLightCRIds).links.concat(linksIds))));
            } else {
                this.hightLight(nodesIds, linksIds);
            }
        }
    }
    // 暗淡，传入节点和边暗淡, 其余不变
    reduceHightLight = (nodesIds, linksIds) => {
        nodesIds = nodesIds ? (Array.isArray(nodesIds) ? nodesIds : [nodesIds]) : [];
        linksIds = linksIds ? (Array.isArray(linksIds) ? linksIds : [linksIds]) : [];
        if (this._cfg.el.getAttribute('id') === 'canvasImage') {
            // 核心节点只有节点，所以高亮时只需传节点id即可，由于后台返回的核心节点和图谱节点id字段类型不同，需手动转为数字类型
            const hightLightIds = sessionStorage.getItem('hightLightIds');
            if (hightLightIds) {
                if ((nodesIds && nodesIds.length > 0) && JSON.parse(hightLightIds).nodes) {
                    let nodes = JSON.parse(hightLightIds).nodes;
                    nodes = nodes.filter(v => {
                        return !nodesIds.includes(v);
                    });
                    this.hightLight(nodes, JSON.parse(hightLightIds).links);
                }
                if ((linksIds && linksIds.length > 0) && JSON.parse(hightLightIds).links) {
                    let links = JSON.parse(hightLightIds).links;
                    links = links.filter(v => {
                        return !linksIds.includes(v);
                    });
                    this.hightLight(JSON.parse(hightLightIds).nodes, links);
                }
            }
        } else {
            // 核心节点只有节点，所以高亮时只需传节点id即可，由于后台返回的核心节点和图谱节点id字段类型不同，需手动转为数字类型
            const hightLightCRIds = sessionStorage.getItem('hightLightCRIds');
            if (hightLightCRIds) {
                if ((nodesIds && nodesIds.length > 0) && JSON.parse(hightLightCRIds).nodes) {
                    let nodes = JSON.parse(hightLightCRIds).nodes;
                    nodes = nodes.filter(v => {
                        return !nodesIds.includes(v);
                    });
                    this.hightLight(nodes, JSON.parse(hightLightCRIds).links);
                }
                if ((linksIds && linksIds.length > 0) && JSON.parse(hightLightCRIds).links) {
                    let links = JSON.parse(hightLightCRIds).links;
                    links = links.filter(v => {
                        return !linksIds.includes(v);
                    });
                    this.hightLight(JSON.parse(hightLightCRIds).nodes, links);
                }
            }
        }
    }
    // 高亮传入的节点和边，其余不高亮
    hightLight(nodesId = [], linksId = []) {
        let data = this.getCurrentData();
        let nodes = nodesId ? (Array.isArray(nodesId) ? nodesId : [nodesId]) : [];
        let ids = data.nodes.map(obj => obj.id);
        let differenceIds = _.difference(ids, nodes);
        if (nodes && nodes.length > 0 && ids && !nodes.map(v => ids.includes(v)).includes(false)) {
            nodes.forEach(obj => {
                if (!obj) {
                    return obj;
                }
                this.get('symbolKeeper').get(obj).group._children.forEach(obj => {
                    this.updateShape(obj, {
                        style: {
                            opacity: 1
                        }
                    }, true, {
                        time: 100
                    });
                });
            });
        }
        if (differenceIds && differenceIds.length > 0 && ids) {
            differenceIds.forEach(obj => {
                if (!obj) {
                    return obj;
                }
                this.get('symbolKeeper').get(obj).group._children.forEach(obj => {
                    this.updateShape(obj, {
                        style: {
                            opacity: 0.3
                        }
                    }, true, {
                        time: 100
                    });
                });
            });
        }
        let links = linksId ? (Array.isArray(linksId) ? linksId : [linksId]) : [];
        let ids1 = data.links.map(obj => obj.id);
        let differenceIds1 = _.difference(ids1, links);
        if (links && links.length > 0 && ids1 && !links.map(v => ids1.includes(v)).includes(false)) {
            links.forEach(obj => {
                if (!obj) {
                    return obj;
                }
                this.get('symbolKeeper').get(this.get('symbolKeeper').get(obj).sourceId).group._children.forEach(obj => {
                    this.updateShape(obj, {
                        style: {
                            opacity: 1
                        }
                    }, true, {
                        time: 100
                    });
                });
                this.get('symbolKeeper').get(this.get('symbolKeeper').get(obj).targetId).group._children.forEach(obj => {
                    this.updateShape(obj, {
                        style: {
                            opacity: 1
                        }
                    }, true, {
                        time: 100
                    });
                });
                this.updateShape(this.get('symbolKeeper').get(obj).text, {
                    style: {
                        opacity: 0.8
                    }
                }, true, {
                    time: 100
                });
                this.updateShape(this.get('symbolKeeper').get(obj).textGroup, {
                    style: {
                        opacity: 0.8
                    }
                }, true, {
                    time: 100
                });
                this.updateShape(this.get('symbolKeeper').get(obj).textRect, {
                    style: {
                        opacity: 0.8
                    }
                }, true, {
                    time: 100
                });
            });
        }
        if (differenceIds1 && differenceIds1.length > 0 && ids1) {
            differenceIds1.forEach(obj => {
                if (!obj) {
                    return obj;
                }
                this.updateShape(this.get('symbolKeeper').get(obj).text, {
                    style: {
                        opacity: 0.3
                    }
                }, true, {
                    time: 100
                });
                this.updateShape(this.get('symbolKeeper').get(obj).textGroup, {
                    style: {
                        opacity: 0.3
                    }
                }, true, {
                    time: 100
                });
                this.updateShape(this.get('symbolKeeper').get(obj).textRect, {
                    style: {
                        opacity: 0.3
                    }
                }, true, {
                    time: 100
                });
            });
        }
        if (this._cfg.el.getAttribute('id') === 'canvasImage') {
            if ((nodes && nodes.length === 0) && (links && links.length === 0)) {
                this.hightLightAll();
                return;
            }
            if (links && links.length > 0) {
                links.forEach(obj => {
                    if (this.get('symbolKeeper').get(obj)) {
                        nodes.push(this.get('symbolKeeper').get(obj).sourceId);
                        nodes.push(this.get('symbolKeeper').get(obj).targetId);
                    }
                });
            }
            sessionStorage.setItem('hightLightIds', JSON.stringify({ nodes: nodes, links: links }));
        } else {
            if ((nodes && nodes.length === 0) && (links && links.length === 0)) {
                this.hightLightAll();
                return;
            }
            if (links && links.length > 0) {
                links.forEach(obj => {
                    if (this.get('symbolKeeper').get(obj)) {
                        nodes.push(this.get('symbolKeeper').get(obj).sourceId);
                        nodes.push(this.get('symbolKeeper').get(obj).targetId);
                    }
                });
            }
            sessionStorage.setItem('hightLightCRIds', JSON.stringify({ nodes: nodes, links: links }));
        }
    }

    util = {
        getSymbolByPoint: (x, y) => {
            const zr = this.get('canvas');
            const { target } = zr.handler.findHover(x, y);
            if (!target) {
                return;
            }
            return this.util.getSymbolByShape(target);
        },
        getSymbolByShape: (shape) => {
            const symbolId = getSymbolId(shape);
            if (!symbolId) {
                return;
            }
            return this.get('symbolKeeper').get(symbolId);
        }
    }
}

function _init() {
    const chart = this;
    const zr = chart.get('canvas');
    this.layout('circle', panguCircleLayout);
    this.layout('tree', panguTreeLayout);
    this.layout('force', panguForceLayout);
    this.layout('cascad', panguCascadLayout);

    const dataKeeper = this.get('dataKeeper');
    _initEvent.call(this);

    window.chart = chart;
    console.log(chart);
}

/**
 * 初始化图谱事件绑定之类
 */
function _initEvent() {
    const chart = this;
    const symbolKeeper = this.get('symbolKeeper');
    const rootGroup = this.get('rootGroup');
    this._clearDragedMap();

    let draggingSymbols;
    chart.on('item:dragstart', function (symbol, evt) {
        if (symbol instanceof CircleNode) {
            draggingSymbols = _getDragingSymbols.call(this, symbol, evt);
            draggingSymbols.forEach(symbol => {
                setZlevel(symbol.getPicture(), zLevels.MOVING);
                symbol.getLinks().forEach(link => link.getPicture().hide());
            });
            return;
        }
    });

    chart.on('dblclick.symbol', function (symbol, evt) {
        if (!symbol || !symbol.model || !symbol.model.zp) {
            return;
        }
        const userSetting = this.get('userSetting');
        const { showHeaderImage } = userSetting.baseConfig;
        if (!showHeaderImage) {
            return;
        }
        let dv = document.createElement('div');
        let dvStyle = {
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            background: 'rgba(0, 0, 0, .6)',
            zIndex: 1000
        };
        _setStyle(dv, dvStyle);
        let img = document.createElement('img');
        img.src = 'data:image/png;base64,' + symbol.model.zp;
        _setStyle(img, { maxWidth: '100%', maxHeight: '100%' });
        dv.appendChild(img);
        dv.onclick = function() {
            document.body.removeChild(dv);
            dv = null;
        };
        document.body.appendChild(dv);
    });

    chart.on('item:dragend', function (symbol, evt) {
        const dragedNodeMap = this.get('dragedNodeMap');
        if (symbol instanceof CircleNode) {
            draggingSymbols.forEach(symbol => {
                dragedNodeMap[symbol.id] = true;
                const shape = symbol.getPicture();
                setZlevel(shape, shape._prevLevel);
                const links = symbol.getLinks();
                chart.tick(links);
                links.forEach(link => link.getPicture().show());
            });
            draggingSymbols = null;
            return;
        }
        // 如果是链接，还是可以切换选择
        chart.getBehavior('Selection').toggleSelect(symbol.id);
    });

    chart.on('item:drag', function (symbol, evt) {
        const scale = rootGroup.scale[0];
        const distance = pandora.Vector.create(evt.movementX, evt.movementY).scale(1 / scale);
        if (!(symbol instanceof CircleNode)) {
            return;
        }
        draggingSymbols.forEach(symbol => {
            symbol.x += distance.x;
            symbol.y += distance.y;
            symbol.tick(false, false);
        });
    });


    const stateThatWhereNodeSelectedFrom = {};
    chart.on('select', function (symbolId) {
        const symbol = symbolKeeper.getSymbol(symbolId);
        setZlevel(symbol.getPicture(), zLevels.HIGHLIGHT);
        symbol.selectMe();
        const selection = chart.getBehavior('Selection');
        if (symbol instanceof Link) {
            // 记录link关联选择的node
            const tmp = [];
            if (!selection.isSelected(symbol.sourceId)) {
                stateThatWhereNodeSelectedFrom[symbol.sourceId] = symbol.id;
                tmp.push(symbol.sourceId);
            }
            if (!selection.isSelected(symbol.targetId)) {
                stateThatWhereNodeSelectedFrom[symbol.targetId] = symbol.id;
                tmp.push(symbol.targetId);
            }
            tmp.length && selection.select(tmp);
        }
    });

    chart.on('unselect', function (symbolId) {
        const symbol = symbolKeeper.getSymbol(symbolId);
        const selection = chart.getBehavior('Selection');

        setZlevel(symbol.getPicture(), zLevels.NORMAL);
        symbol.unselectMe();

        // 关联取消选择之前选择链接时选择的节点
        if (symbol instanceof Link) {
            const link = symbol;
            const tmp = [];
            if (stateThatWhereNodeSelectedFrom[link.sourceId] && stateThatWhereNodeSelectedFrom[link.sourceId] === link.id) {
                tmp.push(link.sourceId);
                delete stateThatWhereNodeSelectedFrom[link.sourceId];
            }
            if (stateThatWhereNodeSelectedFrom[link.targetId] && stateThatWhereNodeSelectedFrom[link.targetId] === link.id) {
                tmp.push(link.targetId);
                delete stateThatWhereNodeSelectedFrom[link.targetId];
            }
            tmp.length && selection.unselect(tmp);
        }
        // 如果本节点是因为选择链接选择的，取消选择本节点，就取消该链接，并保留另外一端的节点。
        if (symbol instanceof CircleNode) {
            const node = symbol;
            const linkId = stateThatWhereNodeSelectedFrom[node.id];
            // todo 是否取消选择该节点所有的连线
            if (linkId) {
                const link = symbolKeeper.get(linkId);
                const theOther = link.getAnother(node.id);
                delete stateThatWhereNodeSelectedFrom[theOther];
                selection.unselect(linkId);
            }
        }
    });
}

function _setStyle(el, style) {
    if (!style) {
        return;
    }
    for (let k in style) {
        el.style[k] = style[k];
    }
}

function _getDragingSymbols(mainNode, evt) {
    if (!evt.ctrlKey) {
        return [mainNode];
    }
    const selection = this.getBehavior('Selection');
    const selectedNodes = selection.getSelectedNode('symbol');
    const symbols = selectedNodes.length ? selectedNodes : [mainNode];
    return symbols;
}
