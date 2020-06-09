const path = require("path");
const typescriptEslintRecommended = require("@typescript-eslint/eslint-plugin").configs.recommended;

module.exports = {
    root: true,
    env: {
        es6: true,
        browser: true
    },
    parser: "babel-eslint",
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                sourceType: "module"
            },
            plugins: ["@typescript-eslint", "react", "prettier", "standard", "react-hooks"],
            parserOptions: {
                project: "./tsconfig.json"
            },
            extends: [
                "plugin:@typescript-eslint/recommended",
                "plugin:react/recommended",
                "prettier",
                "prettier/@typescript-eslint",
                "prettier/react",
                "prettier/standard",
                "standard",
                "standard-react"
            ],
            rules: Object.assign(typescriptEslintRecommended.rules, {
                "@typescript-eslint/interface-name-prefix": "off",
                "@typescript-eslint/explicit-member-accessibility": "off",
                semi: ["error", "always"], // 语句强制分号结尾
                "space-before-function-paren": "off",
                "react/jsx-indent": "off",
                quotes: "off"
            })
        }
    ],
    extends: [
        "plugin:react/recommended",
        "standard",
        "standard-react",
        "prettier",
        "prettier/react",
        "prettier/standard",
        "plugin:import/recommended"
    ],
    plugins: ["react", "prettier", "standard", "react-hooks"],
    settings: {
        "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
        react: {
            version: require("react").version
        },
        "import/resolver": {
            webpack: { config: path.resolve("./webpack", "webpack.dev.config.js") }
        }
    },
    rules: {
        "prettier/prettier": "error",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "no-unused-vars": ["warn", { vars: "all", args: "all" }], // 未使用的变量提示
        semi: ["error", "always"], // 语句强制分号结尾
        camelcase: "off", // 可以使用非驼峰式命名 例如 get_list
        "react/prop-types": "off", // 不对 React PropTypes 验证
        "react/jsx-handler-names": "off"
    },
    globals: {
        global: true
    }
};
