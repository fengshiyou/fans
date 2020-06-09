import { makeLinkId, sortLinkNode } from './util';

export default class NetLink {
    /**
     * 构造函数
     * @param  {[type]} sourceId  [description]
     * @param  {[type]} targetId [description]
     * @param  {[type]} id    自身的id，如果需要
     */
    constructor(sourceId, targetId, id) {
        const sortedLink = sortLinkNode(sourceId, targetId);
        this.sourceId = sortedLink[0];
        this.targetId = sortedLink[1];
        this.links = id ? [{ sourceId, targetId, id }] : [];
        this.id = makeLinkId(sourceId, targetId);
        this.__clearCache();
    }

    get sourceToTarget() {
        return this.get('sourceToTarget', () => this.links.filter(link => link.sourceId === this.sourceId));
    }

    get targetToSource() {
        return this.get('targetToSource', () => this.links.filter(link => link.sourceId === this.targetId));
    }

    /**
     * 本链接是否未空链接
     */
    isEmpty() {
        return !this.links.length;
    }

    get(key, getter) {
        const cache = this.__cache;
        return (cache[key] !== undefined && cache[key] !== null) ? cache[key] : cache[key] = getter.call(this);
    }

    getAnother(otherId) {
        if (!this.isInLink(otherId)) {
            return;
        }
        return this.sourceId === otherId ? this.targetId : this.sourceId;
    }

    /**
     * 节点是否在本链接中
     */
    isInLink(id) {
        return id === this.sourceId || id === this.targetId;
    }

    /**
     * 是否含有某个链接
     */
    hasLink(linkId) {
        return !!this.links.find(l => l.id === linkId);
    }

    add(id, sourceId, targetId) {
        if (this.hasLink(id)) {
            return false;
        }
        this.links.push({
            id,
            sourceId,
            targetId
        });
        this.__clearCache();
        return true;
    }

    remove(linkId) {
        const index = this.links.findIndex(link => link.id === linkId);
        if (index > -1) {
            this.links.splice(index, 1);
            return true;
        }
        return false;
    }

    // 合并另一条链接到本链接
    merge(netLink) {
        if (netLink === this) {
            return [];
        }
        if (netLink.id !== this.id || netLink.sourceId !== this.sourceId || this.targetId !== netLink.targetId) {
            throw new Error('netLink id 不能操作');
        }
        const added = [];
        netLink.links.forEach(link => {
            const rs = this.add(link.id, link.sourceId, link.targetId);
            if (rs) {
                added.push(link.id);
            }
        });
        return added;
    }
    // 把另外一条链接中的线从本链接中移除
    seperate(netLink) {
        if (this === netLink) {
            this.links = [];
            this.__clearCache();
            return;
        }
        if (netLink.id !== this.id || netLink.sourceId !== this.sourceId || this.targetId !== netLink.targetId) {
            throw new Error('netLink id不同不能操作');
        }
        netLink.links.forEach(link => {
            this.remove(link.id);
        });
    }

    clone() {
        const netLink = new NetLink(this.sourceId, this.targetId);
        netLink.links = [...this.links];
        return netLink;
    }

    __clearCache() {
        this.__cache = {};
    }

    /**
     * 将数据源的边进行合并
     * @param  {[Object]} links     边数据源
     * @return {[NetLink]}       [合并后的边列表]
     */
    static mergeLink(links, sourceKey = 'startId', targetKey = 'endId') {
        const groupLink = {}; // 先把边按照startId 或 endId 成对进行归类 o 复杂度

        links.forEach(link => {
            const sourceId = link[sourceKey];
            const targetId = link[targetKey];

            const linkGroupId = makeLinkId(sourceId, targetId);
            link._groupId = linkGroupId;
            let group = groupLink[linkGroupId];
            if (!group) {
                group = groupLink[linkGroupId] = new NetLink(sourceId, targetId);
            }
            group.add(link.id, sourceId, targetId);
        });
        const mergedLinks = Object.values(groupLink);
        return mergedLinks;
    }
}