# 运行环境

## 使用 yarn 作为包管理工具

```bash
npm install yarn -g
```

## Node.js 版本

不强制限定，尽量保持较新版本

## node-sass 问题

如果 node-sass 安装遇到问题可尝试更改 node-sass 源，然后重新安装

```bash
# 增加源设置
yarn config set sass_binary_site http://cdn.npm.taobao.org/dist/node-sass

# 删除设置
yarn config delete sass_binary_site
```

# 代码风格

### Eslint 语法检查工具

使用 `yarn run lint` 检查当前项目存在的语法问题

使用 `yarn run lint-fix` 修复当前项目存在的语法问题

### Prettier 代码格式化工具

可对 js,jsx,css,json 文件进行格式美化

使用 `yarn run fromat` 对当前项目执行代码格式化操作

### Prettier-eslint

结合 eslint，prettier 先对代码进行代码格式化操作，然后进行语法检查并求修改错误。

使用 `yarn run fix-all` 对当前项目执行 prettier-eslint 操作

## 编辑器设置

### vscode

安装 eslint, prettier 插件并设置

```json
{
    "prettier.eslintIntegration": true,
    "editor.formatOnSave": true
}
```

### webstorm

-   安装 eslint plugin 插件，在需要格式化时使用快捷键操作
-   File watch

    配置路径在 Tools -> File Watchers, 可以新增两个，一个 File type 为 React JSX ，另一个是 Javascript

    -   Name: 随意
    -   File Type: React JSX 或者 Javascript
    -   Scope: Project Files
    -   Program: $ProjectFileDir$/node_modules/.bin/prettier-eslint
    -   Arguments: --write $FilePathRelativeToProjectRoot$
    -   Output paths to refresh: $FilePathRelativeToProjectRoot$
    -   Working directory: $ProjectFileDir$
    -   取消选中 Auto-save edited files to trigger the watcher

## 使用 ant-design

在 .babelrc plugins 增加如下插件

```
{
    plugins: [
        ["import", { "libraryName": "antd", style: true }]
        ...other
    ]
}
```

## querystring 处理

使用 [qs](https://github.com/ljharb/qs) 库来处理

```js
// parse
var obj = qs.parse("a=c&c=2"); // ​​​​​{ a: 'c', c: '2' }​​​​​
var obj = qs.parse("?a=c", { ignoreQueryPrefix: true }); // ​​​​​{ a: 'c' }​​​​​
// react-router
var obj = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

// stringify
var obj = qs.stringify({ name: "bbd", id: "1" }, { addQueryPrefix: true }); // ​​​​​?name=bbd​​​​​&id=1
```

## 项目相关

## CSS

如果需要写非模块化样式请用 文件名.global.scss 命名，所有 .global.scs 文件不会被 css module 处理

## JavaScript

请使用  Prettier 格式化  工具保证代码风格统一并开启 ESLint 语法检查，提交代码前请确认代码已无 ESLint 报错
