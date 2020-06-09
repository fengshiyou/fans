import config from "../config";
/**
 * 一个所有数据的符号仓库，只要创建了，在内存中就不会被删除。
 *
 */
export default class SymbolKeeper {
    constructor(chart) {
        this.chart = chart;
        this._symbols = {};
    }
    /**
     * 将可以被可视化渲染的数据，添加到symbol库中，并创建可视化对象
     * @param  {Array[Object]} data 可视化数据,请保持唯一数据的id唯一性，得自己想办法通过数据的特性去构造，也可以使用sha方法对数据签名生成id（不过不方便debug)
     * @return {String|Function}  数据id 的key值 或者 生成key 的方法
     */
    enter(data, idKey = "id") {
        const enter = {};
        const _symbols = this._symbols;
        const exist = {};
        const debug = config.debug;
        data.forEach(d => {
            const id = getId(d, idKey);
            if (!id) {
                throw new Error("there is not a valid id");
            }
            const symbol = _symbols[id];
            if (!symbol) {
                enter[id] = d;
            } else {
                exist[id] = d;
            }
        });
        if (data.length !== Object.keys(enter).length + Object.keys(exist).length) {
            console.warn("传入的数据中有重复数据");
            console.log(data);
        }
        return createEnter(this, enter, exist);
    }
    /**
     * 根据之前的绘制id列表和现在的绘制id列表，diff算出进入的元素，出去的元素，本来就在里面的元素
     * @param  {Array[String]} prevIds [之前的id]
     * @param  {Array[String]} nextIds [现在要渲染的id]
     * @return {Object}         {
     *         toAdd: Array[Renderable] 需要添加到画布的元素
     *         toRemove: Array[Renderable] 需要从画布移除的元素
     *         inworld: Array[Renderable] 本来就在中的元素
     * }
     */
    diff(prevIds, nextIds) {
        const prevIdMap = {};
        const toAdd = [];
        const inWorld = [];

        prevIds.forEach(id => {
            prevIdMap[id] = true;
        });

        nextIds.forEach(id => {
            if (prevIdMap[id]) {
                inWorld.push(id);
                delete prevIdMap[id];
            } else {
                toAdd.push(id);
            }
        });

        const toRemove = Object.keys(prevIdMap);

        return {
            toAdd: this.getSymbolList(toAdd),
            toRemove: this.getSymbolList(toRemove),
            inWorld: this.getSymbolList(inWorld)
        };
    }

    getSymbolList(idList) {
        return idList.map(id => {
            let renderItem = this._symbols[id];
            if (!renderItem) {
                throw new Error(`Renderable:${id} do not exist, please check if created or not a valid id`);
            }
            return renderItem;
        });
    }

    getSymbol(id) {
        return this._symbols[id];
    }
    // alias to getSymbol
    get(id) {
        return this.getSymbol(id);
    }
}

function getId(data, idKey) {
    return typeof idKey === "function" ? idKey(data) : data[idKey];
}

function createEnter(keeper, enter, exist) {
    const _symbols = keeper._symbols;
    const dataExist = Object.values(exist);
    const ids = Object.keys(enter);
    const dataEnter = ids.map(key => enter[key]);
    return function(creator) {
        const enterSymbols = creator(dataEnter, dataExist);
        if (enterSymbols.length !== dataEnter.length) {
            throw new Error("Renderable amount do not match.");
        }
        ids.forEach(function(id, index) {
            enterSymbols[index].keeper = keeper;
            _symbols[id] = enterSymbols[index];
        });
    };
}
