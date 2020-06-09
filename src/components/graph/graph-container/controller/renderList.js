
export function getAllGraphRenderList(chart) {
    const graph = chart.get('dataKeeper').get('graph');
    const nodesId = graph.getNodesId();
    const linksId = graph.getLinksId();
    return nodesId.concat(linksId);
}