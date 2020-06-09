import React, { Component } from "react";
// import { disptach } from 'util/util';

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
        const searchId = this.getSessionData("searchId", []);
        const graph = new Pangu(this.container, {
            candidateCenters: searchId
        });
        window.graph = graph;
        const data = this.getSessionData("searchData", { nodes: [], links: [] });
        graph.data(data);
        this.graph = graph;
        graph.getBehavior("PanCanvas").fitCenter(false);
        // 使用umi可以打开此方法以全局状态来操作图谱实例,使用redux也可以重写此方法
        // disptach('graph/create', graph);
        graph.on("dataupdated", data => {
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
            try {
                sessionStorage.setItem("searchData", JSON.stringify(data));
            } catch (e) {
                console.log("数据过大，超出的部分将不保存" + e);
            } finally {
                console.log("程序正常执行");
            }
        });
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
