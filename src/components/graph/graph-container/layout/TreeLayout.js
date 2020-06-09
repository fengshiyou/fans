import { tree, hierarchy } from './d3-hierarchy';

export function layoutTree(rootNode, childrenGetter, options) {
    const treeRoot = hierarchy(rootNode, childrenGetter);
    const layout = tree();
    setOption(layout, options);
    layout(treeRoot);
    return treeRoot;
}

function setOption(tree, options) {
    ['size', 'separation', 'nodeSize'].forEach(opt => {
        if (options.hasOwnProperty(opt)) {
            tree[opt](options[opt]);
        }
    });
}