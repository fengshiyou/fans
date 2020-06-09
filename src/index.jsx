import "normalize.css";
import "assets/style/main.global.scss";
import React from "react";
import { render } from "react-dom";
import { Provider } from "mobx-react";
import * as stores from "./store";

import Routes from "./routes";

render(
    <Provider {...stores}>
        <Routes />
    </Provider>,
    document.getElementById("root")
);
