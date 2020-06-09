import pandora from 'pandora';
import { sortClassifyInner } from '../util';
const Vector = pandora.Vector;
/**
 * 将节点按圆环布局
 * event: tick
 * event: end
 */
export function layoutNet(rootNode, keeper, settings) {
    settings = {
        center: [0, 0],
        radius: 100,  // 布局的半径
        interval: 30, // 点的间隙
        halfAngleZone: Math.PI / 3,
        gutter: 50,
        initAngleRange: [0, 2 * Math.PI],
        childrenGetter() {},
        ...settings
    };

    const { center, halfAngleZone } = settings;

    const sameTimeToken = Math.random();

    const centerPoint = new Vector(center);

    const rootSymbol = keeper.getSymbol(rootNode.id);
    rootSymbol.x = centerPoint.x;
    rootSymbol.y = centerPoint.y;

    let tickList = [rootSymbol];
    const longRadius = layoutChildren(rootNode, settings.radius);
    return {
        tickList,
        longRadius: longRadius || 0
    };

    function layoutChildren(parentNode, radius) {
        const parentSymbol = keeper.getSymbol(parentNode.id);

        const children = sortClassifyInner(keeper.getSymbolList(settings.childrenGetter(parentNode)));
        const childAngle = parentNode === rootNode ? undefined : Vector.sub(new Vector(parentSymbol), centerPoint).getDeg();
        const longRadius = layoutCircle([...children], {
            ...settings,
            radius,
            center: [parentSymbol.x, parentSymbol.y],
            angleRange: childAngle === undefined ? settings.initAngleRange : [childAngle - halfAngleZone, childAngle + halfAngleZone]
        }, sameTimeToken);
        tickList = tickList.concat(children);
        children.forEach(function(n) {
            layoutChildren(n, longRadius);
        });
        return longRadius;
    }
}

function layoutCircle(symbols, options = {}, sameTimeToken) {
    const {
        center = [0, 0],
        radius = 100,  // 布局的半径
        interval = 30, // 点的间隙
        angleRange = [0, 2 * Math.PI],
        gutter = 50,
        maxInterval = 0
    } = options;
    if (!symbols.length) {
        return;
    }
    symbols = [].concat(symbols);
    const [startAngle, endAngle] = angleRange;
    const allAngle = endAngle - startAngle;
    const perimeter = allAngle * radius;
    const totalAmount = Math.min(Math.ceil(perimeter / interval), symbols.length);
    // const middle = (startAngle + endAngle) / 2;
    const presentSymbols = symbols.splice(0, totalAmount);

    const anglePerNode = maxInterval ? Math.min(allAngle / totalAmount, 2 * maxInterval / radius) : allAngle / totalAmount;
    const centerPoint = new Vector(center);
    presentSymbols.forEach(function(s, n) {
        // 可以设置将节点固定，从而不参与位置计算
        if (s.fixed || s.__layouttoken__ === sameTimeToken) {
            return;
        }
        s.__layouttoken__ = sameTimeToken;

        /* const uinit = (n % 2) ? -anglePerNode : anglePerNode;
        const angle = middle + Math.floor((n + 1) / 2) * uinit; */
        let angle = startAngle + n * anglePerNode;
        s.x = centerPoint.x + Math.cos(angle) * radius;
        s.y = centerPoint.y + Math.sin(angle) * radius;
    });

    return !symbols.length ? radius : layoutCircle(symbols, {
        ...options,
        radius: radius + gutter
    }, sameTimeToken);
}