const areaDegFunction = {
    "0": 0,
    "x+": 0,
    "x-": Math.PI,
    "y+": Math.PI / 2,
    "y-": (3 * Math.PI) / 2,
    "1": function(v) {
        const length = v.getLength();
        return Math.asin(v.y / length);
    },
    "2": function(v) {
        const length = v.getLength();
        return Math.acos(v.x / length);
    },
    "3": function(v) {
        return v.negate().getDeg() + Math.PI;
    },
    "4": function(v) {
        const length = v.getLength();
        return Math.asin(v.y / length);
    }
};

export default class Vector {
    /**
     * 创建一个向量，默认是零向量
     * @param  {Number,Array[Number, Number]} x [x坐标，或者数组[x,y]]
     * @param  {Number} y [description]
     * @return {[Vector]}   [向量实例]
     */
    constructor(x = 0, y = 0) {
        if (Array.isArray(x)) {
            [x = 0, y = 0] = x;
        } else if (typeof x === "object") {
            y = x.y || 0;
            x = x.x || 0;
        }
        this.x = x;
        this.y = y;
    }
    /**
     * 反向量
     * @param  {Boolean} mutate 是否改变自身，默认不改变，返回新实例
     * @return {[Vector]}         [向量实例]
     */
    negate(mutate = false) {
        if (mutate) {
            this.x = -this.x;
            this.y = -this.y;
            return this;
        }
        return new Vector(-this.x, -this.y);
    }

    negateX(mutate = false) {
        if (mutate) {
            this.x = -this.x;
            return this;
        }
        return new Vector(-this.x, this.y);
    }

    negateY(mutate = false) {
        if (mutate) {
            this.y = -this.y;
            return this;
        }
        return new Vector(this.x, -this.y);
    }

    /**
     * 转换为数组
     * @return {[Array[Number, Number]]} [新实例]
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * 获取本向量所在的象限，默认是相对于原点
     * @return {string}    所在详细的描述字符串
     */
    getArea() {
        const { x, y } = this;
        if (x === 0 && y === 0) {
            return "0";
        }

        if (y === 0) {
            return x >= 0 ? "x+" : "x-";
        }
        if (x === 0) {
            return y > 0 ? "y+" : "y-";
        }

        return x > 0 ? (y > 0 ? "1" : "4") : y > 0 ? "2" : "3";
    }

    /**
     * 计算本向量的相对原点角度
     * @return {[Number]}    [角度值]
     */
    getDeg() {
        const area = this.getArea();
        const degFunc = areaDegFunction[area];
        return typeof degFunc === "function" ? degFunc(this) : degFunc;
    }

    getAngle() {
        return (180 * this.getDeg()) / Math.PI;
    }

    // 缩放向量
    scale(zoom) {
        return new Vector(this.x * zoom, this.y * zoom);
    }

    setLength(leng) {
        const length = this.getLength();
        return this.scale(leng / length);
    }

    // 获取模长
    getLength() {
        const { x, y } = this;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 将向量增长某模长，正数变长，负数变短.
     * @param  {[type]} leng [长度]
     * @return {[Vector]}     [新向量]
     */
    lengthen(leng) {
        const length = this.getLength();
        const afterLen = length + leng;
        return this.scale(afterLen / length);
    }

    /**
     * 减去一个向量
     * @param  {[type]} p [description]
     * @return {[type]}   [description]
     */

    static sub(p1, p2) {
        return new Vector(p1.x - p2.x, p1.y - p2.y);
    }

    static add(p1, p2) {
        return Vector.sub(p1, p2.negate());
    }

    // 获取p2 相对 p1 的象限
    static getArea(p1, p2) {
        return Vector.sub(p2, p1).getArea();
    }

    /**
     * 获取p2向量与p1向量的夹角
     * @param  {[type]} p1 [description]
     * @param  {[type]} p2 [description]
     * @return {[type]}    [description]
     */
    static getAngle(p1, p2) {
        return p2.getAngle() - p1.getAngle();
    }

    // static mul(p1, p2) {

    // }

    // static div(p1, p2) {

    // }

    // static Zero = new Vector()

    static create(x, y) {
        return new Vector(x, y);
    }
}
