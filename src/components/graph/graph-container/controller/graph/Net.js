import NetNode from './NetNode';
import NetLink from './NetLink';
import { removeItem, arraylize, makeLinkId } from './util';

/**
 * 无向网数据结构（含操作方法），如果是有向网，先使用merge Link 合并有向边甚至多条边为一条边
 */
export default class Net {
    constructor(nodes = [], links = []) {
        this.nodes = nodes;
        this.links = links;
        this.__clearCache();
        this.createIndexes();
    }

    getNodesId() {
        return this.nodes.map(n => n.id);
    }

    getLinksId() {
        return Array.prototype.concat.apply([], this.links.map(link => link.links.map(l => l.id)));
    }
    get aloneNodes() {
        return this.nodes.filter(n => n.isAlone);
    }
    /**
     * 给nodes 和links 建立索引，合并相同边，重复节点报错.
     */
    createIndexes() {
        const nodes = this.nodes;
        let links = this.links;

        const linkIdMap = links.reduce(function(map, link) {
            if (link.isEmpty()) {
                return map;
            }
            if (map[link.id]) {
                link = link.clone();
                link.merge(map[link.id]);
            }
            map[link.id] = link;
            return map;
        }, {});
        this.links = links = Object.values(linkIdMap);

        const nodeIdMap = nodes.reduce((map, node) => {
            const id = node.id;
            if (map[id]) {
                throw new Error('已经存在相同的节点id');
            }
            map[id] = node;
            const nodeLinks = links.filter(function(link) {
                return link.sourceId === id || link.targetId === id;
            });
            node.links = nodeLinks;
            node.children = nodeLinks.map(link => {
                return link.getAnother(node.id);
            });
            return map;
        }, {});

        nodes.forEach(function(node) {
            return node.children = node.children.map(cid => {
                return nodeIdMap[cid];
            });
        });

        this.nodeIndexes = nodeIdMap;
        this.linkIndexes = linkIdMap;
    }

    /**
     * 从图数据中查找某个节点
     * @param  {[type]} nodeOrId [description]
     * @return {[type]}          [description]
     */
    getNode(nodeOrId) {
        if (nodeOrId === null || nodeOrId === undefined) {
            return;
        }
        return (typeof nodeOrId === 'string' || typeof nodeOrId === 'number') ? this.nodeIndexes[nodeOrId] : this.nodeIndexes[nodeOrId.id];
    }

    getNodes(nodeIds) {
        return nodeIds.map(id => this.getNode(id));
    }

    /**
     * 判断某个节点是否在图内
     * @param {NetNode|string} nodeOrId 节点或节点id
     */
    hasNode(nodeOrId) {
        return !!this.getNode(nodeOrId);
    }

    /**
     * 获得两个节点间连线实例
     * @param {NetNode|NetLink} node1 节点1
     * @param {NetNode} node2 节点2
     */
    getLink(node1, node2) {
        if (node1 instanceof NetLink) {
            return this.linkIndexes[node1.id] || null;
        }
        node1 = this.getNode(node1);
        node2 = this.getNode(node2);
        if (!node1 || !node2) {
            return null;
        }
        return this.linkIndexes[makeLinkId(node1.id, node2.id)] || null;
    }
    /**
     * 判断两个节点间是否有连线
     * @param {NetNode} node1 节点1
     * @param {NetNode} node2 节点2
     */
    hasLink(node1, node2) {
        return !!this.getLink(node1, node2);
    }

    /**
     * 添加一个新节点到网中
     * @param {NetNode} node 新节点
     * @returns {boolean} 是否添加成功,批量添加则返回添加的列表
     */
    addNode(nodes) {
        nodes = arraylize(nodes);
        const addedList = [];
        nodes.forEach(node => {
            if (!(node instanceof NetNode)) {
                throw new Error('请添加NetNode 的实例');
            }
            if (this.getNode(node)) {
                // 已经再网内，就不用再添加了
                return;
            }
            this.nodes.push(node);
            this.nodeIndexes[node.id] = node;
            addedList.push(node);
        });
        addedList.length && this.__clearCache('id');
        return addedList;
    }
    /**
     * removeNode 移除节点
     * @param  {Array[NetNode|String]}  nodeOrId 要移除的节点id或node
     * @return {Node}           被移除的节点
     */
    removeNode(nodeOrId) {
        const nodes = arraylize(nodeOrId);
        let removedList = [];
        nodes.forEach(nodeOrId => {
            const node = this.getNode(nodeOrId);
            if (node) {
                const id = node.id;
                this.removeLink([...node.links]);
                removeItem(this.nodes, node);
                delete this.nodeIndexes[id];
                removedList.push(node);
            }
        });
        removedList.length && this.__clearCache('id');
        return removedList;
    }

    /**
     * 添加Link
     */
    addLink(link) {
        const links = arraylize(link);
        let addedLink = [];
        let changed = false;
        links.forEach(link => {
            if (!(link instanceof NetLink)) {
                throw new Error('请添加NetLink 的实例');
            }
            let source = this.getNode(link.sourceId);
            let target = this.getNode(link.targetId);
            if (!source || !target) {
                console.warn('不能为不存在的node增加链接');
                return;
            }

            // 节点间已经有相关链接，则合并其链接数据
            const existLink = source.getLink(target.id);
            if (existLink) {
                const rs = existLink.merge(link);
                rs.length && addedLink.push(link);
                return;
            }

            source.links.push(link);
            source.children.push(target);

            target.links.push(link);
            target.children.push(source);

            this.links.push(link);
            this.linkIndexes[link.id] = link;
            addedLink.push(link);
            changed = true;
        });
        changed && this.__clearCache('id');
        return addedLink;
    }
    /**
     * 移除链接
     * @param  {Link} link Link对象
     */
    removeLink(link) {
        const links = arraylize(link);
        let changed = false;
        const removedLinks = [];
        links.forEach(link => {
            let source = this.getNode(link.sourceId);
            let target = this.getNode(link.targetId);
            if (!source || !target) {
                return null;
            }
            // 保证link对象来自本net，而不是克隆的
            const thisNetlink = this.getLink(link.sourceId, link.targetId);
            thisNetlink.seperate(link);
            if (thisNetlink.isEmpty()) {
                removeItem(source.children, target);
                removeItem(source.links, thisNetlink);

                removeItem(target.children, source);
                removeItem(target.links, thisNetlink);

                removeItem(this.links, thisNetlink);
                delete this.linkIndexes[thisNetlink.id];
                changed = true;
            }
            removedLinks.push(link);
        });
        changed && this.__clearCache('id');
        return removedLinks;
    }

    /**
     * 将另一张网合并到本王
     * @param {Net} anotherNet 另一张网
     * @returns {Object Net Data} 返回增加的节点和边;
     */
    merge(anotherNet) {
        const rs = {
            nodes: this.addNode(anotherNet.nodes.map(n => n.clone())),
            links: this.addLink(anotherNet.links.map(n => n.clone()))
        };
        return rs;
    }

    /**
     * 移除另一个网的数据
     * @param {*} anotherNet
     * @returns {Object Net Data} 返回被移除了的节点和边;
     */
    removeNet(anotherNet) {
        const rs = {
            nodes: this.removeNode(anotherNet.nodes.map(n => n.clone())),
            links: this.removeLink(anotherNet.links.map(n => n.clone()))
        };
        return rs;
    }

    /**
     * 克隆本net，所有的node link 都与之前独立
     * @return {Net} 新的Net对象
     */
    clone() {
        const nodes = this.nodes.map(node => {
            return node.clone();
        });
        const links = this.links.map(link => {
            return link.clone();
        });
        const net = new Net(nodes, links);
        return net;
    }

    /**
     * 是否是空网，即没有nodes
     * @return {Boolean}
     */
    isEmpty() {
        return !this.nodes.length;
    }


    get id() {
        return this.get('id', () => {
            const ids = this.nodes.concat(this.links).map(x => x.id).sort((a, b) => a > b);
            return ids.join('-');
        });
    }

    __clearCache(key) {
        if (key !== undefined && key !== null) {
            const value = this.__cache[key];
            delete this.__cache[key];
            return value;
        }
        const value = this.__cache;
        this.__cache = {};
        return value;
    }

    get(key, getter) {
        const cache = this.__cache;
        return (cache[key] !== undefined && cache[key] !== null) ? cache[key] : cache[key] = getter.call(this);
    }

    /**
     * @param  {Array[Net]} net 多个nets
     * @return {Net}      全新的网与net1 net2 都独立
     */
    static merge(nets) {
        nets = nets.filter(net => !net.isEmpty()).map(net => net.clone());
        const nodeMap = {};

        // 合并点集合
        nets.forEach(net => {
            Object.assign(nodeMap, net.nodeIndexes);
        });

        // 合并链接集合
        const links = nets.reduce((arr, net) => arr.concat(net.links), []);
        const nodes = Object.values(nodeMap);
        const net = new Net(nodes, links);
        return net;
    }
}
