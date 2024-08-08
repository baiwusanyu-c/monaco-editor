/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerLanguage } from '../_.contribution';

declare var AMD: any;
declare var require: any;

registerLanguage({
	// 语言 id
	id: 'html',
	// 语言对应的文件后缀，
	extensions: ['.html', '.htm', '.shtml', '.xhtml', '.mdoc', '.jsp', '.asp', '.aspx', '.jshtm'],
	// 语言别名
	aliases: ['HTML', 'htm', 'html', 'xhtml'],
	// 指定与该语言关联的 MIME 类型列表。MIME 类型是一种标准化的标识符，用于表示文档类型和格式。
	mimetypes: ['text/html', 'text/x-jshtm', 'text/template', 'text/ng-template'],
	// 加载器函数，从远端加载语言集（包含 tokenizer 、configuration ）
	loader: () => {
		if (AMD) {
			return new Promise((resolve, reject) => {
				require(['vs/basic-languages/html/html'], resolve, reject);
			});
		} else {
			return import('./html');
		}
	}
});
