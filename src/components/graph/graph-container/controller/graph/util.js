import Net from './Net';
import { getDegreeInfo } from './degree';

export function removeItem(arr, item) {
    arr.splice(arr.findIndex(v => v === item), 1);
}

export function makeLinkId(sourceId, targetId) {
    const DIVISION = ' --> ';
    return sortLinkNode(sourceId, targetId).join(DIVISION);
}

export function sortLinkNode(sourceId, targetId) {
    return sourceId > targetId ? [targetId, sourceId] : [sourceId, targetId];
}

export function arraylize(any) {
    return Array.isArray(any) ? any : [any];
}

/**
 * 根据nodes links 创建多个net
 */
export function createNets(nodes, links) {
    let net = new Net(nodes, links);
    return singlelize(net);
}

export function seperate(net, dgInfo) {
    if (net.id !== dgInfo.netId) {
        throw new Error('网与维度信息不匹配');
    }
    const nodes = net.getNodes(dgInfo.getFreeNodes());
    const nodesCopy = nodes.map(n => n.clone());
    const linksCopy = Array.prototype.concat.apply([], nodes.map(n => n.links.map(l => l.clone())));
    net.removeNode(nodes);
    return new Net(nodesCopy, linksCopy);
}

export function singlelize(net) {
    if (net.isEmpty()) {
        return [];
    }
    const singleNodes = net.aloneNodes.map(n => n.clone());
    net.removeNode(singleNodes);
    const nets = singleNodes.map(n => new Net([n]));
    while (!net.isEmpty()) {
        nets.push(net);
        const dgInfo = getDegreeInfo(net, net.nodes[0]);
        net = seperate(net, dgInfo);
    }
    return nets;
}