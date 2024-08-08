# bwsy monaco 编辑器源码详解目录

## basic-languages

### ✅ src/basic-languages/html/html.contribution.ts

### ✅ src/basic-languages/html/html.ts

### ✅ src/basic-languages/\_.contribution.ts

### ✅ src/basic-languages/monaco.contribution.ts

## language

### src/language/common/lspLanguageFeatures.ts

### src/language/html/html.worker.ts

### src/language/html/htmlMode.ts

### src/language/html/htmlWorker.ts

### src/language/html/monaco.contribution.ts

### src/language/html/workerManager.ts

## webpack-plugin

## 工程化打包，弄清楚包之间如何引用的

## monaco 编辑器的非核心工程代码是如何被使用的 ？

1. 先本地打包观察 out 文件夹产物内容
2. 以 esm 为例发现，monaco 编辑器的入口是 vs/editor/editor.main
3. monaco 编辑器的非核心工程代码包括 如下内容

```text
// 包括支持的基础语言集
basic-language 包括支持的基础语言集
// 导出了 monaco 核心代码
filters
// 定义了一些语言集 worker
language 定义了一些语言集 worker

以 html 为例language的语言集 worker 至少包含包含如下文件
- src/language/html/workerManager.ts
- src/language/html/htmlWorker.ts
- src/language/html/htmlMode.ts
- src/language/html/html.worker.ts
- src/language/html/monaco.contribution.ts

有些语言还用到了 lspLanguageFeatures
- src/language/common/lspLanguageFeatures.ts
```

通过观察打包后产物之间的引用关系发现以下结论，以 esm 为例

- filters 中导出的 monaco 核心代码在其他文件中被引用后，构建产物会变成 vs/editor/editor.api.js
- basic-languages 在打包后由 vs/editor/editor.main 引入
- languages/xxx/monaco.contribution 在打包后由 vs/editor/editor.main 引入
- vs/editor/editor.main 还引入了 edcore.main
- language 中

* workerManager 和 lspLanguageFeatures 被打入到了 xxxMode.js
* XXXWorker 被打入到了 xxx.worker.js

- language 中 xxxMode.js 在 /language/xxx/monaco.contribution 中的 getMode 方法被动态导入
- language 中 xxx.worker.js 被用户从 getWorker 方法中导入或被编译插件编译导入

```javascript
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// @ts-ignore
self.MonacoEnvironment = {
	getWorker(_: any, label: string) {
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return new htmlWorker();
		}

		return new editorWorker();
	}
};
```

那么引用关系为
/language/xxx/monaco.contribution -> xxxMode(workerManager, lspLanguageFeatures)
由 monaco 核心调用 getWorker -> xxx.worker.js(XXXWorker)
