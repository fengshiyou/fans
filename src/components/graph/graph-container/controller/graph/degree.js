import Net from './Net';
const DEGREE_CACHE = {};
export const NO_DEGREE = -1;

class DegreeInfo {
    static NO_DEGREE = NO_DEGREE
    static DEGREE_CACHE = DEGREE_CACHE

    constructor(netId, centerId) {
        Object.assign(this, {
            id: degreeInfoId(netId, centerId),
            netId: netId,
            centerId: centerId,
            degreeGroups: [],
            degreeMap: {},
            maxDegree: 0
        });
    }
    /**
    * 当前网是否有游离点
    * @return {Boolean} [true有游离点，false无游离点]
    */
    haveFreeNodes() {
        return Object.values(this.degreeMap).includes(NO_DEGREE);
    }
    /**
     * 获取游离点
     * @return {Array[Node]} [节点数组]
     */
    getFreeNodes() {
        const degreeMap = this.degreeMap;
        return Object.keys(degreeMap).filter(id => degreeMap[id] === NO_DEGREE);
    }


    getTreeChildren(net, nodeOrId) {
        if (net.id !== this.netId) {
            throw new Error('本维度信息与网不相符');
        }
        const node = net.getNode(nodeOrId);
        if (!node) {
            return [];
        }
        const degreeMap = this.degreeMap;
        const nodeDegree = degreeMap[node.id];
        return node.children.filter(child => degreeMap[child.id] > nodeDegree);
    }

    /**
     * 获取专属children，即子孙节点中不会与别的节点形成环
     * @param  {Object|String} nodeOrId 节点id或节点ndoe
     * @return {Array[Node]}          children数组
     */
    getExclusiveChildren(net, nodeOrId) {
        const node = net.getNode(nodeOrId);
        if (!node) {
            return [];
        }
        const nodeTreeChildren = this.getTreeChildren(net, nodeOrId).map(n => n.id);
        if (node.id !== this.centerId) {
            net = net.clone();
            net.removeNode(node);
            const info = getDegreeInfo(net, this.centerId);
            return info.getFreeNodes().filter(node => nodeTreeChildren.includes(node.id)).map(node => this.getNode(node));
        }
        return [...node.children];
    }
}

let TOTAL_RUN = 0;
let CACHE_HIT = 0;
export function getDegreeInfo(net, center) {
    TOTAL_RUN += 1;
    if (net.isEmpty()) {
        return null;
    }
    center = net.getNode(center);
    if (!center) {
        throw new Error('specify a net center or the center do not belongs to net');
    }
    const degreeInfo = new DegreeInfo(net.id, center.id);
    // 小于5个节点数的，直接计算不用缓存
    if (DEGREE_CACHE[degreeInfo.id]) {
        CACHE_HIT += 1;
        console.log(`运行总次数:${TOTAL_RUN},命中次数:${CACHE_HIT},命中率:${100 * CACHE_HIT / TOTAL_RUN}%`);
        return DEGREE_CACHE[degreeInfo.id];
    }
    console.log(`运行总次数:${TOTAL_RUN},命中次数:${CACHE_HIT},命中率:${100 * CACHE_HIT / TOTAL_RUN}%`);
    return DEGREE_CACHE[degreeInfo.id] = countDegreeInfo(net, center, degreeInfo);
}

function degreeInfoId(netId, centerId) {
    return [netId, centerId].join('___');
}


function countDegreeInfo(net, center, degreeInfo) {

    const { degreeMap, degreeGroups } = degreeInfo;
    net.nodes.forEach(node => {
        degreeMap[node.id] = NO_DEGREE;
    });

    degreeGroups.push([center.id]);
    degreeMap[center.id] = 0;

    let maxDegree = 0;

    setChildrenDegree(center);
    degreeInfo.maxDegree = maxDegree;
    return degreeInfo;

    function setChildrenDegree(node) {
        const nodeDegree = degreeMap[node.id];
        const childDegree = nodeDegree + 1;
        node.children.forEach(function(child) {
            let childDegreeExist = degreeMap[child.id];
            if (childDegreeExist === NO_DEGREE || childDegreeExist > childDegree) {
                degreeMap[child.id] = childDegreeExist = childDegree;
                let degreeGroup = degreeGroups[childDegree];
                if (!degreeGroup) {
                    degreeGroup = degreeGroups[childDegree] = [child.id];
                } else {
                    degreeGroup.push(child.id);
                }
                if (childDegree > maxDegree) {
                    maxDegree = childDegree;
                }
                setChildrenDegree(child);
            }
        });
    }
}
