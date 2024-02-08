module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh", "simple-import-sort"],
  rules: {
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          // react放在首行
          ["^react", "^@?\\w"],
          // 内部导入
          ["^(@|components)(/.*|$)"],
          // 父级导入. 把 `..` 放在最后.
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
          // 同级导入. 把同一个文件夹.放在最后
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          // 样式导入.
          ["^.+\\.?(css)$"],
          // 带有副作用导入，比如import 'a.css'这种.
          ["^\\u0000"],
        ],
      },
    ],
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "no-debugger": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
