import React, { Component } from "react";
import style from "./style.scss";
import * as R from "ramda";
import { Button } from "antd";
const Pluck = () => {
    const arrA = [
        [1, 2, 3],
        [4, 4, 4]
    ];
    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.pluck(0, arrA))}`;
    const arrB = [
        { a: 1, b: 2, c: 3 },
        { a: 2, b: 4, c: "d" }
    ];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.pluck("c", arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : pluck(0,arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 : pluck("c", arr)</div>
            <div>{得数据B}</div>
        </div>
    );
};
const Project = () => {
    const arrA = [
        ["a", "s", "d"],
        ["x", "c", "v"]
    ];
    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.project([0, 1], arrA))}`;
    const arrB = [
        { a: 1, b: 2, c: 3 },
        { a: 2, b: 4, c: "d" }
    ];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.project(["c", "b"], arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : project([0,1],arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 : project(["c","b"], arr)</div>
            <div>{得数据B}</div>
        </div>
    );
};
const Containes = () => {
    const arrA = ["a", "s", "d"];

    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.contains("a")(arrA))}`;
    const arrB = [{ a: 1, b: 2, c: 3 }];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.contains({ a: 1, b: 2, c: 3 }, arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : R.contains("a")(arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 : {`R.contains({ a: 1, b: 2, c: 3 }, arr)`}</div>
            <div>{得数据B}</div>
        </div>
    );
};
const All = () => {
    const arrA = ["at", "as", "ad"];

    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${R.all(R.contains("a"), arrA)}`;
    const arrB = [{ a: false }, { b: true }, { c: true }];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${R.all(i => R.values(i)[0], arrB)}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : R.all(R.contains("a"), arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>
                方法名 :{" "}
                {`{R.all(i => {
        console.log(R.values(i));
        return R.values(i)[0];
    }, arrB)`}
            </div>
            <div>{得数据B}</div>
        </div>
    );
};
/**
 * 分隔线
 */
const TakeWhile = () => {
    const arrA = ["at", "ats", "ad", "tad"];

    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.takeWhile(R.contains("t"), arrA))}`;
    const arrB = [{ a: "1" }, { b: "2" }, { c: "3" }];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.takeWhile(R.equals({ a: "1" }), arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : R.takeWhile(R.contains("t"), arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 :{`R.takeWhile(R.equals({ a: "1" }), arr))`}</div>
            <div>{得数据B}</div>
        </div>
    );
};
const DropWhile = () => {
    const arrA = ["at", "ats", "ad", "tad"];

    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.dropWhile(R.contains("t"), arrA))}`;
    const arrB = [{ a: "1" }, { b: "2" }, { c: "3" }];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.dropWhile(R.equals({ a: "1" }), arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : R.dropWhile(R.contains("t"), arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 :{`R.dropWhile(R.equals({ a: "1" }), arr))`}</div>
            <div>{得数据B}</div>
        </div>
    );
};
const Without = () => {
    const arrA = ["at", "ats", "ad", "tad"];
    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.without(["at"])(arrA))}`;
    const arrB = [{ a: "1" }, { b: "2" }, { c: "3" }];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.without({ a: "1" })(arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : R.without(["at"])(arr))</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 :{`R.without({ a: "1" })(arr)`}</div>
            <div>{得数据B}</div>
        </div>
    );
};
const CountBy = () => {
    const arrA = ["at", "ats", "ad", "tad"];
    const 原数据A = `原数据 : ${JSON.stringify(arrA)}`;
    const 得数据A = `得数据 : ${JSON.stringify(R.countBy(R.contains("t"), arrA))}`;
    const arrB = [{ a: "1" }, { b: "2" }, { c: "3" }];
    const 原数据B = `原数据 : ${JSON.stringify(arrB)}`;
    const 得数据B = `得数据 : ${JSON.stringify(R.countBy(R.equals({ a: "1" }), arrB))}`;
    return (
        <div>
            <div>{原数据A}</div>
            <div>方法名 : R.dropWhile(R.contains("t"), arr)</div>
            <div>{得数据A}</div>
            <hr />
            <div>{原数据B}</div>
            <div>方法名 :{`R.dropWhile(R.equals({ a: "1" }), arr))`}</div>
            <div>{得数据B}</div>
        </div>
    );
};
class Home extends Component {
    /**
     * 取出数组成员属性,组成新数组
     */
    pluck = () => {
        const a = [
            [1, 2, 3],
            [4, 4, 4]
        ];
        const pluckA = R.pluck(0)(a);
        console.log(a, "pluckA", pluckA);
    };

    render() {
        return (
            <div className={style.container}>
                <Pluck />
                <Project />
                <Containes />
                <All />
                <TakeWhile />
                <DropWhile />
                <Without />
                <CountBy />
            </div>
        );
    }
}

export default Home;
