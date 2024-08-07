# Contributing / Dev Setup

## Source Code Structure

// bwsy: monaco 编辑器 来自于 vscode 的编辑器核心(monaco-editor-core)，在此基础上做了一些特性增强和基础的语言支持
It is important to understand that the Monaco Editor _Core_ is built directly from the [VS Code source code](https://github.com/microsoft/vscode).
The Monaco Editor then enhances the Monaco Editor Core with some basic language features.

This diagram describes the relationships between the repositories and the npm packages:

![](./docs/code-structure.dio.svg)

// bwsy: 默认情况下 `monaco-editor-core` 直接从 npm 安装，
你不需要去从 `vscode` 中 构建 `monaco-editor-core` 即可在 `monaco` 编辑器上去操作各种语言特性，本仓库会每晚从 `vscode` 主分支中构建最新的`monaco-editor-core`，
而对于稳定版本，则会从 pkg 中识别出来并构建出 `monaco-editor-core`.
By default, `monaco-editor-core` is installed from npm (through the initial `npm install`), so you can work on Monaco Editor language features without having to build the core editor / VS Code.
The nightly builds build a fresh version of `monaco-editor-core` from the `main` branch of VS Code.
For a stable release, the commit specified in `vscodeRef` in [package.json](./package.json) specifies the commit of VS Code that is used to build `monaco-editor-core`.


## Contributing a new tokenizer / a new language
// bwsy: 我们默认支持一些重要的语言，每一个语言的支持由下面几个文件
Please understand that we only bundle languages with the monaco editor that have a significant relevance (for example, those that have an article in Wikipedia).

// bwsy: 内含 registerLanguage 的调用，来向 monaco 注册一个语言
- create `$/src/basic-languages/{myLang}/{myLang}.contribution.ts`
  // bwsy: 语言集的定义，遵循 monarch 规范
- create `$/src/basic-languages/{myLang}/{myLang}.ts`
  // bwsy: 语言集测试文件
- create `$/src/basic-languages/{myLang}/{myLang}.test.ts`
  // bwsy: monaco.contribution.ts 中引入
- edit `$/src/basic-languages/monaco.contribution.ts` and register your new language
  // bwsy: sample.{myLang}.txt 添加语言集样例
- create `$/website/index/samples/sample.{myLang}.txt`

```js
import './{myLang}/{myLang}.contribution';
```

## Debugging / Developing The Core Editor

// bwsy: 调试 monaco 核心，你需要在 vscode 源码仓库中进行
To debug core editor issues.

This can be done directly from the VS Code repository and does not involve the monaco editor repository.

- Clone the [VS Code repository](https://github.com/microsoft/vscode): `git clone https://github.com/microsoft/vscode`
- Open the repository in VS Code: `code vscode`
- Run `yarn install`
- Select and run the launch configuration "Monaco Editor Playground" (this might take a while, as it compiles the sources):

  ![](./docs/launch%20config.png)

- Now you can set breakpoints and change the source code

  ![](./docs/debugging-core.gif)

- Optionally, you can build `monaco-editor-core` and link it to the monaco editor repository:

  ```bash
  # builds out-monaco-editor-core
  > yarn gulp editor-distro

  > cd out-monaco-editor-core
  > npm link
  > cd ../path/to/monaco-editor

  # symlinks the monaco-editor-core package to the out-monaco-editor-core folder we just built
  > npm link monaco-editor-core
  ```

## Debugging / Developing Language Support

// bwsy: 调试monaco语言支持，你可以在 monaco 编辑器仓库中进行
To debug bundled languages, such as JSON, HTML or TypeScript/JavaScript.

- Clone the [monaco editor repository](https://github.com/microsoft/monaco-editor): `git clone https://github.com/microsoft/monaco-editor`
- Open the repository in VS Code: `code monaco-editor`
- Run `npm install`
- Select and run the launch configuration "Monaco Editor Playground" (this might take a while, as it compiles the sources):

  ![](./docs/launch%20config.png)

- Now you can set breakpoints and change the source code

  ![](./docs/debugging-languages.gif)

- Optionally, you can build `monaco-editor` and link it if you want to test your changes in a real application:

  ```bash
  # builds out/monaco-editor
  > npm run build-monaco-editor

  > cd out/monaco-editor
  > npm link

  > cd ../path/to/my-app
  > npm link monaco-editor
  ```

## Running the editor tests
bwsy: 运行单元测试
```bash
> npm run build-monaco-editor
> npm run test
> npm run compile --prefix webpack-plugin

> npm run package-for-smoketest-webpack
> npm run package-for-smoketest-esbuild
> npm run package-for-smoketest-vite
> npm run package-for-smoketest-parcel --prefix test/smoke/parcel
> npm run smoketest-debug
```

## Running the website locally
bwsy: 本地运行 monaco 编辑器网站
```bash
> npm install
> npm run build-monaco-editor

> cd website
> yarn install
> yarn typedoc
> yarn dev
```

Now webpack logs the path to the website.

## Out Folders

This diagram describes the output folders of the build process:

![](./docs/out-folders.dio.svg)

## Maintaining

Checkout [MAINTAINING.md](./MAINTAINING.md) for common maintaining tasks (for maintainers only).

## bwsy: 目录结构 
build 构建脚本
docs 一些简单的使用文档
samples 一些简单的使用样例
scripts 一些 ci 相关脚本
src 主要的源码
test 测试代码，包含单元测试，冒烟测试等
webpack-plugin 对应的是 monaco-editor-webpack-plugin 的源码
website monaco编辑器的官方站点源码
