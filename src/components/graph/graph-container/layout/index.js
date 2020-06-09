
import { layoutNet } from './CircleLayout';
import { layoutTree } from './TreeLayout';
import { rectLayout } from './RectLayout';
import { cascadLaytout } from './CascadLayout';
import { getDegreeInfo } from '../controller/graph/degree';
import ForceLayout from './ForceLayout';
import { sortClassifyInner } from '../util';

/**
 * 这里的布局流程由于时间的原因，没有做过良好的规划，所以比较混乱。
 * 当前布局的方式是，先将网拆分成多个部分：孤立节点、二元节点类型的网、三个节点以上的网
 * 分别布局以后，再对每个网进行一个偏移。
 *
 * 下面的那个 treeLayout 也是这个规则
 *  maxRadius: 节点的最大半径
 */
export function panguCircleLayout(chart, graph, keeper, maxRadius) {
    destroyForceLayout(chart);

    const layoutsFuncs = [layoutAlones, layoutTowNodesNet, graphLayoutCircle];
    const layouts = Array.prototype.concat.apply([], layoutsFuncs.map(layout => layout(chart, graph, keeper, maxRadius)));
    offsetLayouts(layouts);
    layouts.forEach(l => chart.tick(l));
}

// cascad布局
export function panguCascadLayout(chart, graph, keeper, maxRadius) {
    destroyForceLayout(chart);
    const layoutsFuncs = [graphLayoutCascad, layoutAlones, layoutTowNodesNet];
    const layouts = Array.prototype.concat.apply([], layoutsFuncs.map(layout => layout(chart, graph, keeper, maxRadius)));
    offsetLayouts(layouts, keeper.chart.get('_direction'));
    layouts.forEach(l => chart.tick(l));
}

// 树形布局
export function panguTreeLayout(chart, graph, keeper, maxRadius) {
    destroyForceLayout(chart);

    const layoutsFuncs = [layoutAlones, layoutTowNodesNet, graphLayoutTree];
    const layouts = Array.prototype.concat.apply([], layoutsFuncs.map(layout => layout(chart, graph, keeper, maxRadius)));
    offsetLayouts(layouts);
    layouts.forEach(l => chart.tick(l));
}

// 力学布局
export function panguForceLayout(chart, graph, keeper, maxRadius) {
    let forceLayout = chart.get('__forcelayout');
    if (!forceLayout) {
        forceLayout = new ForceLayout(chart, {
            radius: maxRadius
            // center: false
        });
        chart.set('__forcelayout', forceLayout);
    }
    const clearFix = true;
    forceLayout.reload(clearFix);
}
/** 因为forceLayout 持续的线程迭代计算，需要强制销毁一下 */

export function destroyForceLayout(chart) {
    let layout = chart.get('__forcelayout');
    if (layout) {
        layout.destroy();
        chart.set('__forcelayout', null);
    }
}

/**
 * 3度以上的网进行圆形（扇形）布局，并返回所有网各自的节点symbol
 */
function graphLayoutCircle(chart, graph, keeper, maxRadius) {
    const layouts = [];
    const nets = graph.getNetsByNodesAmount(3, Infinity);
    const candidateCenters = chart.get('candidateCenters');
    const centers = nets.map(net => {
        const center = net.nodes.find(n => candidateCenters.includes(n.id)) || net.nodes[0];
        return center;
    });
    const userSetting = chart.get('userSetting');
    let { smallHidden, showNodeName } = userSetting.baseConfig;
    nets.forEach((n, index) => {
        const center = centers[index];
        const dgInfo = getDegreeInfo(n, center);
        const rs = layoutNet(center, keeper, {
            radius: 200 + maxRadius * 2,
            interval: (smallHidden || !showNodeName) ? maxRadius * 2 : 60 + maxRadius * 2,
            gutter: 60 + maxRadius * 2,
            center: [0, 0],
            initAngleRange: [Math.PI, 3 * Math.PI],
            childrenGetter(node) {
                return dgInfo.getTreeChildren(n, node).map(n => n.id);
            }
        });
        layouts.push(rs.tickList);
    });
    return layouts;
}

/**
 * 3度以上的网进行垂直树形布局，并返回所有网各自的节点symbol
 */
function graphLayoutTree(chart, graph, keeper, maxRadius) {
    const layouts = [];
    const candidateCenters = chart.get('candidateCenters');
    const nets = graph.getNetsByNodesAmount(3, Infinity);
    const centers = nets.map(net => {
        const center = net.nodes.find(n => candidateCenters.includes(n.id)) || net.nodes[0];
        return center;
    });
    const userSetting = chart.get('userSetting');
    let { smallHidden, showNodeName } = userSetting.baseConfig;
    nets.forEach((net, index) => {
        const center = centers[index];
        center.children = sortClassifyInner(center.children, true);
        const dgInfo = getDegreeInfo(net, center);
        const treeRoot = layoutTree(center, function (node) {
            return dgInfo.getTreeChildren(net, node);
        }, { nodeSize: [(smallHidden || !showNodeName) ? maxRadius * 2 : 60 + maxRadius * 2, 140 + maxRadius * 2] });
        const tickList = [];
        treeRoot.eachBefore(n => {
            const symbol = keeper.get(n.data.id);
            symbol.x = n.x;
            symbol.y = n.y;
            tickList.push(symbol);
        });
        layouts.push(tickList);
    });
    return layouts;
}

/**
 * 3度以上的网进行cascad布局，并返回所有网各自的节点symbol
 */
function graphLayoutCascad(chart, graph, keeper, maxRadius) {
    const layouts = [];
    const nets = graph.getNetsByNodesAmount(3, Infinity);
    const candidateCenters = chart.get('candidateCenters');
    const centers = nets.map(net => {
        const center = net.nodes.find(n => candidateCenters.includes(n.id)) || net.nodes[0];
        return center;
    });
    const userSetting = chart.get('userSetting');
    let { smallHidden, showNodeName } = userSetting.baseConfig;
    nets.forEach((n, index) => {
        const center = centers[index];
        const dgInfo = getDegreeInfo(n, center);
        const rs = cascadLaytout(center, keeper, {
            childrenGetter(node) {
                return dgInfo.getTreeChildren(n, node).map(n => n.id);
            },
            hDistance: (smallHidden || !showNodeName) ? maxRadius * 2 : 160 + maxRadius * 2,  // 水平间距
            vDistance: (smallHidden || !showNodeName) ? maxRadius * 2 : 40 + maxRadius * 2, // 垂直间距
            sameDegree: 60 + maxRadius * 2, // 同度被拆分后的间距
            ...dgInfo
        });
        layouts.push(rs.tickList);
    });
    return layouts;
}

/**
 * 将各个网分开进行布局.这里的实现比较low，按理说应该使用矩阵变换或者直接使用zr的变换
 * @param {*} layouts 一系列布局，其实就是symbols数组
 */
function offsetLayouts(layouts, direction) {
    if (!layouts.length) {
        return;
    }
    // 统一进行去重操作
    uniqueArrObject(layouts);
    const layoutBundings = layouts.map(getLayoutBouding);
    let width = 0;
    let height = 0;
    const margin = 200;
    layoutBundings.forEach(function (rect, index) {
        const layoutSymbols = layouts[index];
        const rectCenter = rect.center;
        layoutSymbols.forEach(s => {
            // 将布局进行一个 纵向排布偏移
            if (direction && direction === 'vertical') {
                s.y = (s.y - rectCenter[1]) + height + rect.height / 2 + margin * index;
            } else {
                // 将布局进行一个 横向排布偏移
                s.x = (s.x - rectCenter[0]) + width + rect.width / 2 + margin * index;
            }
            // 将布局沿X轴对称
            // s.y = s.y - rect.y / 2;
        });
        width += rect.width;
        height += rect.height;
    });
}
/**
 * 获取点集合的整个bounding
 */
function getLayoutBouding(layout) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    layout.forEach(s => {
        if (s.x < minX) {
            minX = s.x;
        }
        if (s.x > maxX) {
            maxX = s.x;
        }
        if (s.y < minY) {
            minY = s.y;
        }
        if (s.y > maxY) {
            maxY = s.y;
        }
    });
    const width = maxX - minX;
    const height = maxY - minY;
    return {
        x: minX,
        y: minY,
        x1: maxX,
        y1: maxY,
        width,
        height,
        center: [minX + width / 2, minY + height / 2],
    };
}
/**
 * 对孤立节点进行布局，这里是使用矩形布局
 */
function layoutAlones(chart, graph, keeper, maxRadius) {
    const layouts = [];
    const aloneNodes = keeper.getSymbolList(graph.aloneNodes.map(n => n.id));
    if (!aloneNodes.length) {
        return [];
    }
    rectLayout(aloneNodes, {
        originCenter: true,
        stepX: 40 + maxRadius * 2,
        stepY: 60 + maxRadius * 2
    });
    if (aloneNodes.length) {
        layouts.push(aloneNodes);
    }
    return layouts;
}
/**
 * 对二元链接的网进行布局，这里是使用矩形布局，但是保证布局时每行的数量是双数.
 */
function layoutTowNodesNet(chart, graph, keeper, maxRadius) {
    const nets = graph.getNetsByNodesAmount(2);
    if (!nets.length) {
        return [];
    }
    const nodes = Array.prototype.concat.apply([], nets.map(n => n.nodes));
    const symbols = keeper.getSymbolList(nodes.map(n => n.id));
    let cols = Math.ceil(Math.sqrt(symbols.length));
    rectLayout(symbols, {
        cols: cols % 2 ? cols - 1 : cols,
        stepX: 160 + maxRadius * 2,
        stepY: 60 + maxRadius * 2,
        originCenter: true
    });
    return [symbols];
}

/**
 * 数组去重
 * */
function uniqueArrObject(arrObject) {
    arrObject.forEach((item, index) => {
        arrObject[index] = item.reduce((prev, cur) => {
            let exist = prev.findIndex(innerItem => innerItem.id === cur.id);
            if (exist !== -1) {
                return prev;
            } else {
                return [...prev, cur];
            }
        }, []);
    });
}