/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { languages, editor } from '../fillers/monaco-editor-core';

interface ILang extends languages.ILanguageExtensionPoint {
	loader: () => Promise<ILangImpl>;
}

interface ILangImpl {
	conf: languages.LanguageConfiguration;
	language: languages.IMonarchLanguage;
}

// 已经注册的语言集配置
const languageDefinitions: { [languageId: string]: ILang } = {};
// 已经创建的语言集加载器
const lazyLanguageLoaders: { [languageId: string]: LazyLanguageLoader } = {};

/**
 * 懒加载语言集加载器对象
 */
class LazyLanguageLoader {
	/**
	 * 创建或获取语言集加载器对象
	 * @param languageId
	 */
	public static getOrCreate(languageId: string): LazyLanguageLoader {
		// 根据传入的语言集 id 从全局的语言集加载器中获取加载器
		// 如果没有则创建并赋值记录
		if (!lazyLanguageLoaders[languageId]) {
			lazyLanguageLoaders[languageId] = new LazyLanguageLoader(languageId);
		}
		return lazyLanguageLoaders[languageId];
	}

	/**
	 * 语言集 id
	 * @private
	 */
	private readonly _languageId: string;
	private _loadingTriggered: boolean;
	private _lazyLoadPromise: Promise<ILangImpl>;
	private _lazyLoadPromiseResolve!: (value: ILangImpl) => void;
	private _lazyLoadPromiseReject!: (err: any) => void;

	constructor(languageId: string) {
		// 记录语言集 id
		this._languageId = languageId;
		this._loadingTriggered = false;
		// 创建一个用于加载的 promise 对象，并记录器 resolve 方法和 reject方法
		this._lazyLoadPromise = new Promise((resolve, reject) => {
			this._lazyLoadPromiseResolve = resolve;
			this._lazyLoadPromiseReject = reject;
		});
	}

	/**
	 * 执行加载器方法
	 */
	public load(): Promise<ILangImpl> {
		// 如果不在载入中，则更新 _loadingTriggered， 标记正在载入
		if (!this._loadingTriggered) {
			this._loadingTriggered = true;
			// 根据语言集id 从全局的语言集配置中，调用对应的加载器方法
			// 其 加载器方法 应该返回一个 promise 方法
			languageDefinitions[this._languageId].loader().then(
				// 当加载完语言集后，执行 _lazyLoadPromiseResolve 方法
				(mod) => this._lazyLoadPromiseResolve(mod),
				// 当加语言集出错，执行 _lazyLoadPromiseReject 方法
				(err) => this._lazyLoadPromiseReject(err)
			);
		}
		// 返回 _lazyLoadPromise
		return this._lazyLoadPromise;
	}
}

/**
 * 加载语言集
 * TODO: 好像是测试用的辅助函数
 * @param languageId
 */
export async function loadLanguage(languageId: string): Promise<void> {
	await LazyLanguageLoader.getOrCreate(languageId).load();

	// trigger tokenizer creation by instantiating a model
	const model = editor.createModel('', languageId);
	model.dispose();
}

/**
 * 向 monaco 核心注册语言方法
 * @param def
 */
export function registerLanguage(def: ILang): void {
	const languageId = def.id;
	// 记录注册的语言集配置参数
	languageDefinitions[languageId] = def;
	// 调用 monaco 核心的语言集注册方法
	languages.register(def);

	// 根据语言集 id 获取语言加载器
	const lazyLanguageLoader = LazyLanguageLoader.getOrCreate(languageId);
	// 调用 monaco 核心的 registerTokensProviderFactory 方法
	// 注册创建一个语言集 tokenizer 提供者（provider），可以理解为
	// 创建了一个词法分析工程，通过语言集的 tokenizer 来进行词法分析
	// 第一个参数是语言集 id
	// 第二个参数是工厂函数配置，其中 create 是创建钩子
	// 它会与使用 setTokensProvider 或 setMonarchTokensProvider 设置的词法分析器互斥。
	// 这意味着如果某种语言已经使用 setTokensProvider 或 setMonarchTokensProvider 设置了词法分析器，
	// 再使用 registerTokensProviderFactory 注册新词法分析器时，前者会被覆盖。
	languages.registerTokensProviderFactory(languageId, {
		create: async (): Promise<languages.IMonarchLanguage> => {
			// 调用语言集加载器，获得语言集
			const mod = await lazyLanguageLoader.load();
			// 返回语言集的 tokenizer，用于语法高亮
			return mod.language;
		}
	});

	// 注册语言发生事件，
	// 它会在编辑器初始化、文本模型变化、语言变化时触发
	// 第一个参数是语言集 id
	// 第二个参数是回调事假方法
	languages.onLanguageEncountered(languageId, async () => {
		// 调用语言集加载器，获得语言集
		const mod = await lazyLanguageLoader.load();
		// 设置语言配置，语言配置是编辑器和语言之间的一些约定
		// 比如定义了文本缩进大小，自动插入、关键字登，
		// 为自动补全，换行缩进登功能提供配置基础
		languages.setLanguageConfiguration(languageId, mod.conf);
	});
}
