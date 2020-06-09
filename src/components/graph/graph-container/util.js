import { Net, NetNode, NetLink } from './controller/graph';
import zLvels from './zLevels';

/**
 * 将业务nodes转换为NetNodes
 * @param {[Object]} nodes 服务器的nodes数据
 * @param {[Object]} links 业务的links数据
 */
export function transform(nodes, links) {
    const netLinks = NetLink.mergeLink(links, 'startId', 'endId');
    return {
        nodes: nodes.map(n => new NetNode(n.id, n)),
        links: netLinks
    };
}
/**
 * 从业务数据就创建一个net
 */
export function createNet(nodes, links) {
    const data = transform(nodes, links);
    return new Net(data.nodes, data.links);
}

/**
 * 从shape上获取symbolid
 * @param {Element} shape Zrender Element
 */
export function getSymbolId(shape) {
    if (!shape || (!shape.parent && !shape._symbolId)) {
        return;
    }
    if (shape._symbolId) {
        return shape._symbolId;
    }
    return getSymbolId(shape.parent);
}
/**
 * 设置该元素的Zlevel。
 * @param {*} shape
 */
export function setZlevel(shape, zlevel) {
    shape._prevLevel = shape._zLevel || zLvels.NORMAL;
    if (shape.type === 'group') {
        shape.eachChild(function(child) {
            setZlevel(child, zlevel);
        });
        return;
    }
    shape._zLevel = zlevel;
    shape.attr({
        zlevel: zlevel
    });
}

/**
 * 把元素按类别分类。
 * @param {*} nodes
 * resNodes里面已经按类别分类，需要的话可以制定类别顺序，后期优化
 */
export function sortClassify(nodes) {
    if (!nodes.length) {
        return nodes;
    }
    let exist = [];
    let resNodes = [];
    let lastNodes = [];
    nodes.forEach(node => {
        if (exist.indexOf(node.label) === -1) {
            let obj = {};
            obj.label = node.label;
            obj.nodes = [node];
            resNodes.push(obj);
            exist.push(node.label);
        } else {
            let existIndex = resNodes.findIndex(nd => nd.label === node.label);
            resNodes[existIndex].nodes.push(node);
        }
    });
    resNodes.forEach(ob => {
        lastNodes = lastNodes.concat(ob.nodes);
    });
    return lastNodes;
}

/**
* 把元素按类别分类。
 *  按理说整个函数是多余的  不想研究别人的代码  先这样吧
* @param {*} nodes
 * resNodes里面已经按类别分类，需要的话可以制定类别顺序，后期优化
 * deep: 深度递归
 * deepFinished: 防止形成环
*/
let deepFinished = [];
export function sortClassifyInner(nodes, deep) {
    if (!nodes.length) {
        return nodes;
    }
    let exist = [];
    let resNodes = [];
    let lastNodes = [];
    nodes.forEach(node => {
        if (exist.indexOf(node.model.label) === -1) {
            let obj = {};
            obj.label = node.model.label;
            obj.nodes = [node];
            resNodes.push(obj);
            exist.push(node.model.label);
        } else {
            let existIndex = resNodes.findIndex(nd => nd.label === node.model.label);
            resNodes[existIndex].nodes.push(node);
        }
        if (deep) {
            if (node.children.length > 1 && deepFinished.indexOf(node.id) === -1) {
                deepFinished.push(node.id);
                node.children = sortClassifyInner(node.children, deep);
            }
        }
    });
    resNodes.forEach(ob => {
        lastNodes = lastNodes.concat(ob.nodes);
    });

    return lastNodes;
}
/**
 * canvas导出图片
 * fileName: 文件名
 * content: 文件内容
 * */
export function downLoadFile(fileName, content) {
    let aLink = document.createElement('a');
    let blob = base64Img2Blob(content);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    aLink.click();
    aLink = null;
}

function base64Img2Blob(code) {
    let parts = code.split(';base64,');
    let contentType = parts[0].split(':')[1];
    let raw = window.atob(parts[1]);
    let rawLength = raw.length;
    let uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; i++) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

/**
 * 深度对比
 * */
export function compareObj() {
    let options;
    let name;
    let src;
    let copy;
    let copyIsArray;
    let clone;
    let target = arguments[0] || {};
    let i = 1;
    let length = arguments.length;
    let deep = false;

    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[i] || {};
        i++;
    }
    if (typeof target !== 'object' && !isFunction(target)) {
        target = {};
    }
    if (i === length) {
        target = this;
        i--;
    }
    for (; i < length; i++) {
        if ((options = arguments[i]) != null) {
            for (name in options) {
                src = target[name];
                copy = options[name];

                if (target === copy) {
                    continue;
                }

                if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && Array.isArray(src) ? src : [];
                    } else {
                        clone = src && isPlainObject(src) ? src : {};
                    }
                    target[name] = compareObj(deep, clone, copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    return target;
}

function isFunction(obj) {
    return typeof obj === 'function' && typeof obj.nodeType !== 'number';
}

function getProto(obj) {}

function isPlainObject(obj) {
    let proto;
    let Ctor;
    let hasOwn = {}.hasOwnProperty;
    let fnToString = hasOwn.toString;
    let ObjectFunctionString = fnToString.call(Object);

    if (!obj || toString.call(obj) !== '[object Object]') {
        return false;
    }
    proto = getProto(obj);
    if (!proto) {
        return true;
    }
    Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;

    return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
}

/**
 * 合并边
 * */
export function mergeSide(links) {
    if (!links) {
        return [];
    }
    let _links = JSON.parse(JSON.stringify(links));

    _links.forEach(item => {
        item.merge = false;
    });
    for (let i = 0; i < _links.length; i++) {
        if (_links[i].merge) {
            continue;
        }
        let typesArr = []; // 使用数组的引用数据类型
        _links[i].mergeIndex = 0; // 同方向连线的序号
        typesArr.push(_links[i].type);
        _links[i].types = typesArr; // 同方向连线的type, 用于计算text的位置
        let sameIndex = 1;
        for (let j = i + 1; j < _links.length; j++) {
            if (_links[j].merge) {
                continue;
            }
            // 统计同方向的
            if (_links[i].startId === _links[j].startId && _links[i].endId === _links[j].endId) {
                _links[j].merge = true;
                _links[j].mergeIndex = sameIndex;
                typesArr.push(_links[j].type);
                _links[j].types = typesArr;
                sameIndex++;
            }
        }
    }
    return _links;
}