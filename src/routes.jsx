import { hot } from "react-hot-loader/root";
import React from "react";
import { Route, Switch, HashRouter } from "react-router-dom";
import { AsyncPage } from "./utils/util";

// 异步加载
const AsyncHome = AsyncPage(() => import("@/containers/Home"));
const AsyncTsPage = AsyncPage(() => import("@/containers/TsPage"));

const routes = () => (
    <HashRouter>
        <Switch>
            <Route exact path="/" component={AsyncHome} />
            <Route path="/home" component={AsyncTsPage} />
        </Switch>
    </HashRouter>
);

export default hot(routes);
