import pandora from 'pandora';
const Vector = pandora.Vector;
/**
 * 将节点按圆环布局
 * event: tick
 * event: end
 */
export function cascadLaytout(rootNode, keeper, settings) {
    settings = {
        center: [0, 0],
        hDistance: 200,  // 水平间距
        vDistance: 80, // 垂直间距
        sameDegree: 100, // 同度被拆分后的间距
        childrenGetter() {},
        ...settings
    };

    const { center, degreeMap, vDistance, hDistance, sameDegree } = settings;
    const direction = keeper.chart.get('_direction');
    const degreeSplit = splitDegree(degreeMap, vDistance, direction, hDistance, sameDegree);
    let parentPosition = findPosition(rootNode.id, degreeSplit);
    const sameTimeToken = Math.random();
    const centerPoint = new Vector(center);

    const rootSymbol = keeper.getSymbol(rootNode.id);
    rootSymbol.x = direction === 'horizontal' ? parentPosition.x : centerPoint.x;
    rootSymbol.y = direction === 'vertical' ? parentPosition.x : centerPoint.y;

    let tickList = [rootSymbol];
    const longDistance = layoutChildren(rootNode, settings.hDistance, degreeSplit, direction);
    return {
        tickList,
        longDistance: longDistance || 0
    };

    function layoutChildren(parentNode, hDistance, degreeSplit, direction) {
        const parentSymbol = keeper.getSymbol(parentNode.id);

        const children = keeper.getSymbolList(settings.childrenGetter(parentNode));
        const longDistance = layoutCascad([...children], {
            ...settings,
            hDistance,
            center: [parentSymbol.x, parentSymbol.y],
        }, sameTimeToken, degreeSplit, direction);
        tickList = tickList.concat(children);
        children.forEach(function(n) {
            layoutChildren(n, longDistance, degreeSplit, direction);
        });
        return longDistance;
    }
}

function layoutCascad(symbols, options = {}, sameTimeToken, degreeSplit, direction) {
    const {
        center = [0, 0],
        hDistance,  // 水平间距
        vDistance // 垂直间距
    } = options;
    if (!symbols.length) {
        return;
    }
    symbols = [].concat(symbols);
    const centerPoint = new Vector(center);
    symbols.forEach(function(s, n) {
        // 可以设置将节点固定，从而不参与位置计算
        if (s.fixed || s.__layouttoken__ === sameTimeToken) {
            return;
        }
        s.__layouttoken__ = sameTimeToken;
        // s.x = centerPoint.x + hDistance * degreeMap[s.id];
        // 确保位置不重叠18662861459584
        let position = findPosition(s.id, degreeSplit);

        if (direction === 'horizontal') {
            // s.x = hDistance * poistion.arrIndex;
            s.x = position.x;
            s.y = -vDistance * (position.arrLength - 1) / 2 + position.index * vDistance;

        } else {
            s.x = -vDistance * (position.arrLength - 1) / 2 + position.index * vDistance;
            s.y = position.x;
        }
    });
    return hDistance;
}

/**
 * 把度数转为数组
 *  获取屏幕宽度-继续拆分数组
 *  vDistance: 垂直间距
 *  hDistance: 不同度数直接的距离
 *  sameDistance： 相同度数被拆分之后两者之间的距离
 * */
function splitDegree(degreeMap, vDistance, direction, hDistance, sameDistance) {
    // 61为header高度, 71为右侧导航的宽度， 如果更新请记得更新
    let clientHeight = direction === 'vertical' ? document.body.clientWidth - 71 : document.body.clientHeight - 61;
    // 一列、行存放的最大个数
    let maxNumber = Math.floor(clientHeight / vDistance);
    let resMap = [];
    let maxDegress = 0;

    if (!degreeMap) {
        return;
    }

    // 取最大度数
    for (let key in degreeMap) {
        if (degreeMap[key] > maxDegress) {
            maxDegress = degreeMap[key];
        }
    }

    for (let i = 0; i <= maxDegress; i++) {
        let middleArr = [];
        for (let k in degreeMap) {
            if (degreeMap[k] === i) {
                middleArr.push({ id: k, sameDegree: false });
            }
        }
        // 对长度过长的数组进行二次拆分
        if (middleArr.length > maxNumber) {
            let splitMiddleArr = Math.ceil(middleArr.length / maxNumber);
            for (let j = 0; j < splitMiddleArr; j++) {
                let lastArr = [];
                for (let z = 0; z < maxNumber; z++) {
                    if (maxNumber * j + z > middleArr.length - 1) {
                        break;
                    }
                    if (j !== 0) {
                        middleArr[maxNumber * j + z].sameDegree = true;
                    }
                    lastArr.push(middleArr[maxNumber * j + z]);
                }
                resMap.push(lastArr);
            }
        } else {
            resMap.push(middleArr);
        }
    }

    // 提取首位节点 => 计算位置
    resMap = setPositionNodes(betweenNodes(resMap), hDistance, sameDistance);
    // resMap = positionNodes(resMap, hDistance, sameDistance);

    return resMap;
}

function setPositionNodes(resMap, hDistance, sameDistance) {

    if (!resMap || !resMap.length) {
        return resMap;
    }
    let sameDegreeNumber = 0;

    for (let i = 0; i < resMap.length; i++) {
        if (resMap[i][0].sameDegree) {
            sameDegreeNumber += 1;
        }
        for (let j = 0; j < resMap[i].length; j++) {
            resMap[i][j].x = (i - sameDegreeNumber) * hDistance + sameDegreeNumber * sameDistance;
        }
    }

    return resMap;
}

// 通过探索ID获取两端节点
function betweenNodes(resMap) {
    let ids = JSON.parse(sessionStorage.getItem('findId'));

    if (!ids || !ids.length) {
        return resMap;
    }
    ids = ids.map(item => String(item));
    let startIndex = -1;
    let endIndex = -1;
    let startArr = null;
    let endArr = null;
    let isOnlyStartArr = null;
    let isOnlyEndArr = null;
    resMap.forEach((item, index) => {
        startIndex = item.findIndex(itemInner => itemInner.id === ids[0]);
        if (startIndex !== -1 && index !== 0) {
            if (item.length > 1) {
                startArr = item.splice(startIndex, 1);
            } else {
                isOnlyStartArr = ids[0];
                startArr = item;
            }
        }
        endIndex = item.findIndex(itemInner => itemInner.id === ids[1]);
        if (endIndex !== -1) {
            if (item.length > 1) {
                endArr = item.splice(endIndex, 1);
            } else {
                isOnlyEndArr = ids[1];
                endArr = item;
            }
        }
    });

    if (isOnlyStartArr) {
        let spliceIndex = -1;
        for (let i = 0; i < resMap.length; i++) {
            if (resMap[i][0].id === isOnlyStartArr) {
                spliceIndex = i;
                break;
            }
        }
        resMap.splice(spliceIndex, 1);
    }

    if (startArr) {
        resMap.unshift(startArr);
    }
    if (endArr) {
        resMap.push(endArr);
    }
    if (isOnlyEndArr) {
        let spliceIndex = -1;
        for (let i = 0; i < resMap.length; i++) {
            if (resMap[i][0].id === isOnlyEndArr) {
                spliceIndex = i;
                break;
            }
        }
        resMap.splice(spliceIndex, 1);
    }
    return resMap;
}

// 找出该节点在二维数组里面的位置和索引
function findPosition(nodeId, arrMap) {
    nodeId = String(nodeId);
    let resObj = {
        arrLength: 0,
        index: 0,
        arrIndex: 0,
        x: 0
    };

    if (!nodeId || !arrMap) {
        return resObj;
    }
    for (let i = 0; i < arrMap.length; i++) {
        for (let j = 0; j < arrMap[i].length; j++) {
            if (arrMap[i][j].id === nodeId) {
                resObj.arrIndex = i;
                resObj.arrLength = arrMap[i].length;
                resObj.index = j;
                resObj.x = arrMap[i][j].x;
                return resObj;
            }
        }
    }
    return resObj;
}