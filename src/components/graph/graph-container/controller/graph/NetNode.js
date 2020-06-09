export default class NetNode {
    constructor(id, model) {
        this.id = id;
        this.links = [];
        this.children = [];
        // 附加选项，最开始的设计里面没有这属性，为了简化树形布局的类别归类而加
        this.model = model;
    }

    clone() {
        return new NetNode(this.id, this.model);
    }

    /**
     * 传入一个id，获取一个链接，一般用于获取给定的另外一个节点id的链接.
     * @param  {NodeLink} netItem [description]
     * @return {NetLink}
     */
    getLink(id) {
        if (typeof id === 'object') {
            id = id.id;
        }
        if (id === this.id) {
            return this.links.find(link => link.sourceId === id && link.targetId === id);
        }
        return this.links.find(link => link.sourceId === id || link.targetId === id);
    }

    getLinksId() {
        return this.links.reduce((arr, link) => arr.concat(link.links.map(l => l.id)), []);
    }

    getChildrenInDegree(deg) {
        return Object.values(this.getChildrenMapInDegree(deg));
    }

    getChildrenMapInDegree(deg) {
        if (deg < 0) {
            return {};
        }
        const self = {
            [this.id]: this
        };

        if (deg === 0) {
            return self;
        }
        return this.children.reduce(function(obj, child) {
            Object.assign(obj, child.getChildrenMapInDegree(deg - 1));
            return obj;
        }, self);
    }

    get isAlone() {
        if (this.children.length) {
            if (this.children.length > 1) {
                return false;
            }
            return this.children[0] === this;
        }
        return true;
    }
}
