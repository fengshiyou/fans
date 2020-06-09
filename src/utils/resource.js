import { TOKEN, TOKEN_TYPE } from "@/constants/storage";
import axios from "axios";
import loading from "./loading";
import { isIE } from "./util";
import qs from "qs";
import * as R from "ramda";

const hashHistory = global.hashHistory;

const loadingLayer = loading();

const ieVersion = isIE();

const trimParamsValue = R.map(x => {
    if (x === undefined || x === "") {
        return null;
    }

    if (R.is(String, x)) {
        return R.trim(x);
    }

    return x;
});

const isEmpty = R.either(R.isEmpty, R.isNil);

const transformParams = R.when(args => !isEmpty(args) && !(args instanceof FormData), trimParamsValue);

/*
 *   封装axios get, post, delete, put 方法, 可配置是否有缓冲
 * */
var resource = {
    count: 0,
    timer: null,
    isOpen: true,
    width: 0, // 顶部加载进度条宽度
    post: function(uri, params, isLoading) {
        return this.send(uri, params, "post", isLoading);
    },
    // 删除数据
    delete: function(uri, params, isLoading) {
        return this.send(uri, params, "delete", isLoading);
    },
    // 更新数据
    put: function(uri, params, isLoading) {
        return this.send(uri, params, "put", isLoading);
    },
    // 获取数据
    get: function(uri, params, isLoading) {
        const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");

        if (reg.test(uri)) {
            uri = encodeURI(uri);
        }

        /**
         * 在 IE 浏览器下增加时间戳参数
         */
        if (ieVersion) {
            if (!params) {
                params = {};
                params._t = new Date().getTime();
            } else if (!params._) {
                params._t = new Date().getTime();
            }
        }

        if (uri.indexOf("?") > -1) {
            const query = params ? "&" + qs.stringify(transformParams(params), { skipNulls: true }) : "";
            uri += query;
        } else {
            uri += qs.stringify(transformParams(params), { addQueryPrefix: true, skipNulls: true });
        }

        return this.send(uri, null, "get", isLoading);
    },
    send: function(uri, params, method, isLoading) {
        if (!(isLoading === false) && ++this.count === 1) {
            clearInterval(this.timer);
            if (this.width < 80) {
                this.timer = setInterval(() => {
                    this.width += 1;
                    loadingLayer.style.width = this.width + "%";
                    if (this.width >= 80) {
                        clearInterval(this.timer);
                    }
                }, 30);
            }
        }

        return axios[method](uri, params)
            .then(res => {
                this.isStop(isLoading);
                return res.data;
            })
            .catch(error => {
                this.isStop(isLoading);
                throw error;
            });
    },
    isStop: function(isLoading) {
        if (!(isLoading === false) && --this.count === 0) {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.width += 5;
                loadingLayer.style.width = this.width + "%";
                if (this.width >= 110) {
                    clearInterval(this.timer);
                    this.width = 0;
                    loadingLayer.style.width = 0;
                }
            }, 20);
        }
    }
};

// 请求拦截器
axios.interceptors.request.use(
    function(config) {
        const AuthorizationData = sessionStorage.getItem(TOKEN);
        config.headers.Authorization = AuthorizationData;
        config.headers.From = "web";

        return config;
    },
    function(error) {
        return Promise.reject(error);
    }
);

// 响应拦截器
axios.interceptors.response.use(
    function(response) {
        if (response.data.code !== 200) {
            throw new Error(response.data.message);
        }
        return response;
    },
    function(error) {
        const { response } = error;

        if (resource.timer) {
            resource.isStop(true);
        }

        if (response.status === 401) {
            localStorage.removeItem(TOKEN);
            localStorage.removeItem(TOKEN_TYPE);

            if (process.env.NODE_ENV !== "development") {
                hashHistory.replace("/login");
            }

            error.message = R.pathOr(response.statusText, ["data", "message"], response);

            return Promise.reject(error);
        }

        if (response.status === 403) {
            error.message = R.pathOr(response.statusText, ["data", "message"], response);

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default resource;
