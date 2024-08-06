# Monaco Editor

[![Versions](https://img.shields.io/npm/v/monaco-editor)](https://www.npmjs.com/package/monaco-editor)
[![Versions](https://img.shields.io/npm/v/monaco-editor/next)](https://www.npmjs.com/package/monaco-editor)
[![Feature Requests](https://img.shields.io/github/issues/microsoft/monaco-editor/feature-request.svg)](https://github.com/microsoft/monaco-editor/issues?q=is%3Aopen+is%3Aissue+label%3Afeature-request+sort%3Areactions-%2B1-desc)
[![Bugs](https://img.shields.io/github/issues/microsoft/monaco-editor/bug.svg)](https://github.com/microsoft/monaco-editor/issues?utf8=✓&q=is%3Aissue+is%3Aopen+label%3Abug)

The Monaco Editor is the fully featured code editor from [VS Code](https://github.com/microsoft/vscode). Check out the [VS Code docs](https://code.visualstudio.com/docs/editor/editingevolved) to see some of the supported features.

![image](https://user-images.githubusercontent.com/5047891/94183711-290c0780-fea3-11ea-90e3-c88ff9d21bd6.png)

## Try it out
// bwsy: 一些入门示例请在 playground 中查看
Try out the editor and see various examples [in our interactive playground](https://microsoft.github.io/monaco-editor/playground.html).

The playground is the best way to learn about how to use the editor, which features is supports, to try out different versions and to create minimal reproducible examples for bug reports.

## Installing

```
> npm install monaco-editor
```

// bwsy: 在 monaco 编辑器的包中，包含这几种格式的产物，对应不同格式场景的需要
You will get:

- inside `/esm`: ESM version of the editor (compatible with e.g. webpack)
- inside `/dev`: AMD bundled, not minified
- inside `/min`: AMD bundled, and minified
- inside `/min-maps`: source maps for `min`
- `monaco.d.ts`: this specifies the API of the editor (this is what is actually versioned, everything else is considered private and might break with any release).

It is recommended to develop against the `dev` version, and in production to use the `min` version.

## Concepts

// bwsy: 了解下面的几个前置概念，有利于你使用 monaco 编辑器 （Models， URIs， Editors， Providers）
Monaco editor is best known for being the text editor that powers VS Code. However, it's a bit more nuanced. Some basic understanding about the underlying concepts is needed to use Monaco editor effectively.

### Models
// bwsy: 模型是 monaco 编辑器的核心，当你对内容进行管理操作时，会与模型进行交互，通常模型除了表示一个存在于系统中的文件外，还定义了文件的内容，历史记录，语言等
Models are at the heart of Monaco editor. It's what you interact with when managing content. A model represents a file that has been opened. This could represent a file that exists on a file system, but it doesn't have to. For example, the model holds the text content, determines the language of the content, and tracks the edit history of the content.

### URIs
// bwsy: 模型有一个唯一的表示 URI吗，当您在 Monaco 编辑器中表示内容时，
您应该考虑维护一个与用户正在编辑的文件匹配的虚拟文件系统。
例如，您可以使用“file：”作为基本路径。如果在没有 URI 的情况下创建模型，则其 URI 将为 'inmemory：model1'。随着创建更多模型，该数字也会增加。
Each model is identified by a URI. This is why it's not possible for two models to have the same URI. Ideally when you represent content in Monaco editor, you should think of a virtual file system that matches the files your users are editing. For example, you could use `file:///` as a base path. If a model is created without a URI, its URI will be `inmemory://model/1`. The number increases as more models are created.

### Editors

// bwsy: 编辑器是面向用户的模型视图。
// 这就是附加到 DOM 的内容以及您的用户在视觉上看到的内容。
// 典型的编辑器操作包括显示模型、管理视图状态或执行操作或命令。
An editor is a user facing view of the model. This is what gets attached to the DOM and what your users see visually. Typical editor operations are displaying a model, managing the view state, or executing actions or commands.

### Providers
// bwsy:提供者提供智能编辑器功能。
// 例如，这包括完成和悬停信息。例如自动补全 调用的就是 providers 相关概念的 api -- registerInlineCompletionsProvider
// 它与语言服务器协议特性不同，但通常映射为语言服务器协议特性。
// 提供者在模型上工作。一些智能功能依赖于文件URI。
// 例如，让TypeScript解析导入，或者让JSON智能感知来决定哪个JSON模式应用到哪个模型。因此，选择合适的模型uri非常重要
Providers provide smart editor features. For example, this includes completion and hover information. It is not the same as, but often maps to [language server protocol](https://microsoft.github.io/language-server-protocol) features.

Providers work on models. Some smart features depends on the file URI. For example, for TypeScript to resolve imports, or for JSON IntelliSense to determine which JSON schema to apply to which model. So it's important to choose proper model URIs.

### Disposables

// bwsy: 取消废弃，在 monaco 编辑器中，绝大部分的 api 都会返回一个 dispose 方法，用于卸载某些功能和特性，例如当我面创建一个自定义的自动补全时
// 使用 registerInlineCompletionsProvider 来创建一个自动补全 provider，他返回一个 dispose 方法，以便你在合适的时机来销毁这个 provider
Many Monaco related objects often implement the `.dispose()` method. This method is intended to perform cleanups when a resource is no longer needed. For example, calling `model.dispose()` will unregister it, freeing up the URI for a new model. Editors should be disposed to free up resources and remove their model listeners.

## Documentation

//  bwsy: 完整的集成学校样例
- Learn how to integrate the editor with these [complete samples](./samples/).
  //  bwsy: amd 的集成样例
  - [Integrate the AMD version](./docs/integrate-amd.md).
  //  bwsy: esm 的集成样例
  - [Integrate the ESM version](./docs/integrate-esm.md)
  //  bwsy: 学校如何使用 api 请参阅 playground
- Learn how to use the editor API and try out your own customizations in the [playground](https://microsoft.github.io/monaco-editor/playground.html).
  //  bwsy: 完整的 api 接口定义
- Explore the [API docs](https://microsoft.github.io/monaco-editor/docs.html) or read them straight from [`monaco.d.ts`](https://github.com/microsoft/monaco-editor/blob/gh-pages/node_modules/monaco-editor/monaco.d.ts).
 //  bwsy: 集成指南
- Read [this guide](https://github.com/microsoft/monaco-editor/wiki/Accessibility-Guide-for-Integrators) to ensure the editor is accessible to all your users!
  //  bwsy: 创建 Monarch tokenizer 来实现一个新的编程语言支持
- Create a Monarch tokenizer for a new programming language [in the Monarch playground](https://microsoft.github.io/monaco-editor/monarch.html).
- Ask questions on [StackOverflow](https://stackoverflow.com/questions/tagged/monaco-editor)! Search open and closed issues, there are a lot of tips in there!

## Issues

Create [issues](https://github.com/microsoft/monaco-editor/issues) in this repository for anything related to the Monaco Editor. Please search for existing issues to avoid duplicates.

## FAQ

❓ **What is the relationship between VS Code and the Monaco Editor?**

The Monaco Editor is generated straight from VS Code's sources with some shims around services the code needs to make it run in a web browser outside of its home.

❓ **What is the relationship between VS Code's version and the Monaco Editor's version?**

None. The Monaco Editor is a library and it reflects directly the source code.

❓ **I've written an extension for VS Code, will it work on the Monaco Editor in a browser?**

No.

> Note: If the extension is fully based on the [LSP](https://microsoft.github.io/language-server-protocol/) and if the language server is authored in JavaScript, then it would be possible.

❓ **Why all these web workers and why should I care?**

Language services create web workers to compute heavy stuff outside of the UI thread. They cost hardly anything in terms of resource overhead and you shouldn't worry too much about them, as long as you get them to work (see above the cross-domain case).

❓ **What is this `loader.js`? Can I use `require.js`?**

// bwsy：loader 是 amd 格式所使用的
It is an AMD loader that we use in VS Code. Yes.

❓ **I see the warning "Could not create web worker". What should I do?**

HTML5 does not allow pages loaded on `file://` to create web workers. Please load the editor with a web server on `http://` or `https://` schemes.

❓ **Is the editor supported in mobile browsers or mobile web app frameworks?**

No.

❓ **Why doesn't the editor support TextMate grammars?**

- Please see https://github.com/bolinfest/monaco-tm which puts together `monaco-editor`, `vscode-oniguruma` and `vscode-textmate` to get TM grammar support in the editor.

## Contributing / Local Development

We are welcoming contributions from the community!
Please see [CONTRIBUTING](./CONTRIBUTING.md) for details how you can contribute effectively, how you can run the editor from sources and how you can debug and fix issues.

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## License

Licensed under the [MIT](https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt) License.
