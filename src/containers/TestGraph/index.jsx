import React, { Component } from "react";
/**
 * 引入分两种方式：
 * 1、使用sessionStorage存储data数据，引入GraphSession.jsx
 * 2、数据量较大时，sessionStorage存储不下可以使用indexDB，引入GraphIndexDB.jsx
 */
import Graph from "../../components/graph/GraphIndexDB";

export default class Test extends Component {
    constructor() {
        super();
        this.data = {};
        this.state = {
            loadingGraph: false
        };
        /**
         *使用indexDB时需要初始化数据库的名称，版本号，及表名称，如果使用sessionStorage可以将其去掉
         * @type {{name: string, version: number, db: null, tableName: string}}
         */
        window.myDB = {
            name: "pangu",
            version: 3,
            db: null,
            tableName: "map"
        };
    }

    UNSAFE_componentWillMount() {
        /**
         * 当存储方式为indexDB才需要建立数据库，如果是sessionStorage方式可以将此方法删掉
         */
        this.openDB(window.myDB.name, window.myDB.version);
    }

    componentDidMount() {
        this.drawGraph();
    }

    drawGraph = () => {
        if (window.graph) {
            /**
             * searchId为当前图谱的中心点id，
             * 环形布局：环形的中心点
             * 树形布局：树形的根节点
             * 力学布局：布局中心点
             * 平行层叠布局：层叠布局的起点
             */
            sessionStorage.setItem("searchId", JSON.stringify([1]));
            window.graph.data({
                nodes: [{ id: 1, label: "Person" }, { id: 2, label: "Phone" }],
                links: [{ id: "a", type: "Allcall", startId: 1, endId: 2 }]
            });
        } else {
            setTimeout(() => {
                this.drawGraph();
            }, 200);
        }
    };

    openDB = (name, version) => {
        let v = version || 1;
        let request = window.indexedDB.open(name, v);
        request.onerror = function(e) {
            console.log(e.currentTarget.error.message);
        };
        request.onsuccess = e => {
            window.myDB.db = e.target.result;
            let getIndexedDBData = (db, storeName, value) => {
                let transaction = db.transaction(storeName, "readwrite");
                let store = transaction.objectStore(storeName);
                let request = store.get(value);
                request.onsuccess = e => {
                    let data = e.target.result;
                    if (!data) {
                        let addData = (db, storeName, data) => {
                            let transaction = db.transaction(storeName, "readwrite");
                            let store = transaction.objectStore(storeName);
                            store.add(data);
                        };
                        addData(window.myDB.db, window.myDB.tableName, {
                            id: "searchData",
                            payload: { nodes: [], links: [] }
                        });
                    }
                    this.setState({
                        loadingGraph: true
                    });
                };
            };
            /**
             * searchData为渲染到图上的数据：
             * 1、sessionStorage方式：sessionStorage的key值，每一个key对应一个图谱的数据
             * 2、indexDB方式：数据库存储的key，每一个key对应一个图谱的数据
             * 3、多个图谱时需要存储多个key
             * 4、key要与图谱组件里面导出的图谱设置一致，默认是searchData
             * 5、图谱组件里一个jsx文件表示一个图谱实例，有多个jsx就有多个图谱，可同时渲染和操作多个图谱
             */
            getIndexedDBData(window.myDB.db, window.myDB.tableName, "searchData");
        };
        request.onupgradeneeded = function(e) {
            let db = e.target.result;
            if (!db.objectStoreNames.contains(window.myDB.tableName)) {
                db.createObjectStore(window.myDB.tableName, { keyPath: "id" });
            }
            console.log("DB version changed to " + version);
        };
    };

    render() {
        /**
         * 两种方式时元素渲染方式：
         * 1、第一种为sessionStorage存储模式，因为sessionStorage存储是即时存储，所以可以直接使用
         * 2、第二种为indexDB存储模式，因为需要一个存储时间，所以需要在数据库建好之后再加载图谱
         */
        // return <div style={{ width: "100vw", height: "100vh" }}>{<Graph />}</div>;
        return <div style={{ width: "100vw", height: "100vh" }}>{this.state.loadingGraph ? <Graph /> : null}</div>;
    }
}
