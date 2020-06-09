import Net from './Net';
import NetLink from './NetLink';
import NetNode from './NetNode';
import * as util from './util';
import { getDegreeInfo } from './degree';

// 多个独立的网，构成一个图.
export default class Graph {
    constructor(nodes = [], links = []) {
        if (nodes[0] instanceof Net) {
            this.nets = nodes;
            return;
        }
        this.nets = util.createNets(nodes, links);
    }

    getNodesId() {
        return Array.prototype.concat.apply([], this.nets.map(net => net.getNodesId()));
    }

    getLinksId() {
        return Array.prototype.concat.apply([], this.nets.map(net => net.getLinksId()));
    }

    get links() {
        return Array.prototype.concat.apply([], this.nets.map(n => n.links));
    }

    get nodes() {
        return Array.prototype.concat.apply([], this.nets.map(n => n.nodes));
    }
    get aloneNodes() {
        return this.nodes.filter(n => n.isAlone);
    }

    get aloneNets() {
        return this.nets.filter(n => n.nodes.length === 1);
    }

    get notAloneNets() {
        return this.nets.filter(n => n.nodes.length > 1);
    }

    getNetsByNodesAmount(min = 0, max) {
        if (!max) {
            max = min;
        }
        return this.nets.filter(n => n.nodes.length >= min && n.nodes.length <= max);
    }

    clone() {
        const graph = new Graph();
        graph.nets = this.nets.map(net => net.clone());
        return graph;
    }

    /**
     * 添加Node, 可添加多个
     */
    addNode(netNodes) {
        netNodes = Array.isArray(netNodes) ? netNodes : [netNodes];

        const net = new Net();
        netNodes.forEach(netNode => {
            if (!(netNode instanceof NetNode)) {
                throw new Error('不是NetNode类');
            }
            if (!this.getNodeInfo(netNode)) {
                net.addNode(netNode);
            }
        });
        this.nets.push(net);
    }

    /**
     * 添加线，给节点连线，链接后，可能会减少网的个数
     */
    addLink(link) {
        if (!(link instanceof NetLink)) {
            throw new Error('请添加NetLink 的实例');
        }
        let sourceInfo = this.getNodeInfo(link.sourceId);
        let targetInfo = this.getNodeInfo(link.targetId);
        if (!sourceInfo || !targetInfo) {
            console.warn('不能为不存在的node增加链接');
            return null;
        }
        const rs = {
            link,
            sourceInfo,
            targetInfo
        };

        if (sourceInfo.net === targetInfo.net) {
            sourceInfo.net.addLink(link);
            return rs;
        }
        const newNet = Net.merge([sourceInfo.net, targetInfo.net]);
        newNet.addLink(link);
        util.removeItem(this.nets, sourceInfo.net);
        util.removeItem(this.nets, targetInfo.net);
        this.nets.push(newNet);
        return rs;
    }
    /**
     * 添加网
     * 先添加已在图中的点，以及线
     * 需要优化性能，简单的直接把线和节点添加进去，性能很差，会不停的增加和删除网
     * @param {Net} net
     * @param {NetData} 新增的节点和链接信息
     */
    addNet(net) {
        if (!(net instanceof Net)) {
            throw new Error('参数需要为 Net');
        }
        if (this.isEmpty()) {
            this.nets.push(net);
            return {
                nodes: net.nodes,
                links: net.links
            };
        }
        if (this.nets.length === 1) {
            const rs = this.nets[0].merge(net);
            this.singlelize();
            return rs;
        }
        const rs = {
            nodes: [],
            links: []
        };
        net.nodes.forEach(netNode => {
            const nodeInfo = this.getNodeInfo(netNode);
            if (nodeInfo) {
                return;
            }
            rs.nodes.push(netNode);
        });
        net.links.forEach(link => {
            const linkInfo = this.getLinkInfo(link);
            if (linkInfo) {
                return;
            }
            rs.links.push(link);
        });

        const newNet = Net.merge(this.nets.concat(net));
        this.nets = [newNet];
        this.singlelize();

        return rs;
    }

    /**
     * 移除线，移除以后，可能会增加网的个数，可批量
     * @param {NetLink} link
     */
    removeLink(link) {
        const links = util.arraylize(link);
        const nets = [...this.nets];
        let rs = [];
        nets.forEach(net => {
            const thisRs = net.removeLink(links);
            if (!thisRs.length) {
                return;
            }
            rs = rs.concat(thisRs);
            util.removeItem(this.nets, net);
            this.nets = this.nets.concat(util.singlelize(net));
        });
        return rs;
    }
    /**
     * 移除节点，可能会增加网，也可能会减少网，可批量
     * @param {NetNode|string} node 节点或id
     */
    removeNode(node) {
        const nodes = util.arraylize(node);
        const nets = [...this.nets];
        let rs = [];
        nets.forEach(net => {
            const thisRs = net.removeNode(nodes);
            if (!thisRs.length) {
                return;
            }
            rs = rs.concat(thisRs);
            if (net.isEmpty()) {
                util.removeItem(this.nets, net);
                return;
            }
            util.removeItem(this.nets, net);
            this.nets = this.nets.concat(util.singlelize(net));
        });
        return rs;
    }

    /**
     * 移除一个网
     * @param {Net} net 另外的一个网
     * @returns {NetData} 移除了的节点与链接信息
     */
    removeNet(net) {
        if (!(net instanceof Net)) {
            throw new Error('参数需要为 Net');
        }
        const rs = {
            nodes: [],
            links: []
        };
        net.nodes.forEach(n => {
            const info = this.getNodeInfo(n);
            if (!info) {
                return;
            }
            info.net.removeNode(n);
            rs.nodes.push(n);
        });
        net.links.forEach(link => {
            const info = this.getLinkInfo(link);
            if (!info) {
                return null;
            }
            const rs = info.net.removeLink(info.link);
            rs.links.push(link);
        });
        return rs;
    }

    singlelize() {
        this.nets = this.nets.reduce((nets, net) => {
            return nets.concat(util.singlelize(net));
        }, []);
    }

    /**
     * 查询node所在网的信息
     * @param {node|id} nodeOrId
     */
    getNodeInfo(nodeOrId) {
        for (let i = 0; i < this.nets.length; i++) {
            const net = this.nets[i];
            const node = net.getNode(nodeOrId);
            if (node) {
                return {
                    node,
                    net,
                    index: i
                };
            }
        }
        return null;
    }

    /**
     * 获得两个节点间连线信息
     * @param {NetNode|NetLink} node1 节点1
     * @param {NetNode} node2 节点2
     */
    getLinkInfo(node1, node2) {
        if (node1 instanceof NetLink) {
            node1 = node1.sourceId;
            node2 = node1.targetId;
        }
        const node1Info = this.getNodeInfo(node1);
        if (!node1Info) {
            return null;
        }
        const link = node1Info.net.getLink(node1, node2);
        if (!link) {
            return null;
        }
        return {
            link,
            net: node1Info.net,
            index: node1Info.index
        };
    }

    isEmpty() {
        return !this.nets.length;
    }
}