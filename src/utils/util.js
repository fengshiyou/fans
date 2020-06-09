/*
 * Project: bbd-frontend-boilerplate
 * File Created: 2018-12-13 11:34:10 am
 * File Path: /src/utils/util.js
 * Author: Kee (zhouke@b-bigdata.com)
 */
import React from "react";
import Loadable from "react-loadable";

// TODO: 对样式进行优化
function LoadingComponent(props) {
    if (props.error) {
        // When the loader has errored
        return (
            <div>
                加载失败，请重试 <button onClick={props.retry}>重试</button>
            </div>
        );
    } else if (props.timedOut) {
        // When the loader has taken longer than the timeout
        return (
            <div>
                加载失败，请重试 <button onClick={props.retry}>重试</button>
            </div>
        );
    } else if (props.pastDelay) {
        // When the loader has taken longer than the delay
        return <div>加载中...</div>;
    } else {
        // When the loader has just started
        return null;
    }
}

export function AsyncPage(loader, opts) {
    return Loadable(
        Object.assign(
            {
                loader: loader,
                loading: LoadingComponent,
                delay: 200,
                timeout: 1000
            },
            opts
        )
    );
}

export function isIE() {
    const myNav = navigator.userAgent.toLowerCase();
    const idx = myNav.indexOf("msie");
    if (idx > 0) {
        return parseInt(myNav.split("msie")[1]);
    } else if (navigator.userAgent.match(/Trident\/7\./)) {
        return 11;
    }
    return false;
}

// 获取indexDB的数据
export function getIDBdata(db, storeName, value) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, 'readwrite');
        let store = transaction.objectStore(storeName);
        let request = store.get(value);
        request.onsuccess = (e) => resolve({ e, store });
        request.onerror = (e) => reject(e);
    });
}
