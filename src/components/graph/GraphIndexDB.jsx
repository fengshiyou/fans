import React, { Component } from "react";
// import { disptach } from 'util/util';
import { getIDBdata } from "@/utils/util";

class Graph extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        import("./graph-container").then(this.initGraph);
    }

    componentWillUnmount() {
        this.graph && this.graph.destroy();
        // disptach('graph/dispose');
    }

    initGraph = ({ default: Pangu }) => {
        if (!this.container) {
            return;
        }
        // 数据量较大，sessionStorage存储不下，使用indexeddb进行存储,
        this.getIndexedDBData(window.myDB.db, window.myDB.tableName, "searchData", Pangu);
    };

    getSessionData(key, defaultValue) {
        let data;
        try {
            const dataStr = sessionStorage.getItem(key);
            const parsed = JSON.parse(dataStr);
            data = parsed;
        } catch (err) {}

        if (!data) {
            data = defaultValue;
        }
        return data;
    }

    getIndexedDBData = (db, storeName, value, Pangu) => {
        const searchId = this.getSessionData("searchId", []);
        const graph = new Pangu(this.container, {
            candidateCenters: searchId
        });
        window.graph = graph;
        getIDBdata(db, storeName, value).then(({ e }) => {
            let data = e.target.result.payload;
            graph.data(data);
            this.graph = graph;
            graph.getBehavior("PanCanvas").fitCenter(false);
            // 使用umi可以打开此方法以全局状态来操作图谱实例,使用redux也可以重写此方法
            // disptach('graph/create', graph);
            graph.on("dataupdated", data => {
                let updateDataByKey = (db, storeName, value) => {
                    getIDBdata(db, storeName, value).then(({ e, store }) => {
                        let result = e.target.result;
                        result.payload = data;
                        store.put(result);
                    });
                };
                updateDataByKey(window.myDB.db, window.myDB.tableName, "searchData");
                sessionStorage.setItem("searchId", JSON.stringify(graph.get("candidateCenters")));
                // 在数据发生变化的时候将已高亮的点也进行更新，当高亮的点不存在时，清除此高亮的id
                const sessionIds = sessionStorage.getItem("hightLightIds");
                const currentNodes = data.nodes.map(obj => obj.id);
                const currentLinks = data.links.map(obj => obj.id);
                if (sessionIds) {
                    let newNodesIds = JSON.parse(sessionIds).nodes;
                    let newLinksIds = JSON.parse(sessionIds).links;
                    if (currentNodes.length > 0) {
                        newNodesIds = newNodesIds.filter(id => {
                            return currentNodes.includes(id);
                        });
                    } else {
                        newNodesIds = [];
                    }
                    if (currentLinks.length > 0) {
                        newLinksIds = newLinksIds.filter(id => {
                            return currentLinks.includes(id);
                        });
                    } else {
                        newLinksIds = [];
                    }
                    sessionStorage.setItem("hightLightIds", JSON.stringify({ nodes: newNodesIds, links: newLinksIds }));
                }
            });
        });
    };

    render() {
        return (
            <div
                ref={ele => (this.container = ele)}
                id="canvasImage"
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    background: "#262626"
                }}
            />
        );
    }
}

export default Graph;
