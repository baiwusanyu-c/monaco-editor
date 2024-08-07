/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { languages } from '../../fillers/monaco-editor-core';

const EMPTY_ELEMENTS: string[] = [
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'menuitem',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
];

export const conf: languages.LanguageConfiguration = {
	wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,

	comments: {
		blockComment: ['<!--', '-->']
	},

	brackets: [
		['<!--', '-->'],
		['<', '>'],
		['{', '}'],
		['(', ')']
	],

	autoClosingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"' },
		{ open: "'", close: "'" }
	],

	surroundingPairs: [
		{ open: '"', close: '"' },
		{ open: "'", close: "'" },
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '<', close: '>' }
	],

	onEnterRules: [
		{
			beforeText: new RegExp(
				`<(?!(?:${EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`,
				'i'
			),
			afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
			action: {
				indentAction: languages.IndentAction.IndentOutdent
			}
		},
		{
			beforeText: new RegExp(
				`<(?!(?:${EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`,
				'i'
			),
			action: { indentAction: languages.IndentAction.Indent }
		}
	],

	folding: {
		markers: {
			start: new RegExp('^\\s*<!--\\s*#region\\b.*-->'),
			end: new RegExp('^\\s*<!--\\s*#endregion\\b.*-->')
		}
	}
};

// bwsy: monaco 编辑其使用 language 中的正则来匹配字符串，实际上也是优先状态机实现的
// 整个 tokenizer 就是在描述有限状态机的规则
// 我们以注释字符串 <!-- comment --> 为例，假设 root 中只有 [/<!--/, 'comment', '@comment']
// 字符串会根据具体的正则，单个字符或多个字符进入状态机进行匹配消费
// root 中表示为初始状态，此时规则 /<!--/，那么会匹配字符串 <!-- 并消费并将状态机调整进入到 comment 状态
// 此时我们看看 comment 状态中的状态流转规则
// 			A [/-->/, 'comment', '@pop'],
// 			B [/[^-]+/, 'comment.content'],
// 			C [/./, 'comment.content']
// 那么接下来的字符会按照顺序使用者三个规则进行匹配,
// 第一个空格字符，匹配 B 规则，此时状态机 标记状态为 comment.content，由于我们没有 comment.content
// 的相关状态规则，即在 comment 状态中我们遍历处理 comment 状态和 comment.content
// 标记消费后，继续进行匹配，接下来的 c, o, m, m, e, n, t 和 第二个空格都会匹配规则 B，依旧是 comment.content 状态。
// 当匹配到字符 - 时，在贪婪匹配的机制下，后续字符 -, > 也会进入状态机去匹配，最终 --> 匹配 规则 A
// 如果调换顺序
// 			B [/[^-]+/, 'comment.content'],
// 			C [/./, 'comment.content']
// 		  A [/-->/, 'comment', '@pop'],
// 当匹配到字符 - 时，它会被规则 C 匹配，此时就匹配不到 A 了，那么就不会退出 comment.content 状态

export const language = <languages.IMonarchLanguage>{
	defaultToken: '',
	tokenPostfix: '.html',
	ignoreCase: true,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			// rules 匹配识别 <!DOCTYPE 部分
			// action 为 metatag （是主题中定义的类名）
			// next 为 引用名为 doctype 的 tokenizer
			[/<!DOCTYPE/, 'metatag', '@doctype'],
			// rules 匹配识别 <!-- 部分
			// action 为 comment （是主题中定义的类名）
			// next 为 引用名为 comment 的 tokenizer
			[/<!--/, 'comment', '@comment'],
			[/(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/, ['delimiter', 'tag', '', 'delimiter']],
			[/(<)(script)/, ['delimiter', { token: 'tag', next: '@script' }]],
			[/(<)(style)/, ['delimiter', { token: 'tag', next: '@style' }]],
			[/(<)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
			[/(<\/)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
			[/</, 'delimiter'],
			[/[^<]+/] // text
		],

		doctype: [
			// rules 匹配一个或多个不是 > 的字符。
			// action 为 metatag.content （是主题中定义的类名）
			[/[^>]+/, 'metatag.content'],
			// rules 用来识别标签结束的符号 >
			// action 为 metatag （是主题中定义的类名）
			// next 为 @pop
			[/>/, 'metatag', '@pop']
		],

		// bwsy: 从表现来看， @pop 应该是退回到 root 的 tokenizer
		//
		comment: [
			// rules 匹配识别 --> 部分
			// action 为 comment （是主题中定义的类名）
			// next 为 @pop
			[/-->/, 'comment', '@pop'],
			// rules 匹配一个或多个不是 - 的字符。
			// action 为 comment.content （是主题中定义的类名）
			[/[^-]+/, 'comment.content'],
			// rules 用于匹配任意单个字符，除了换行符
			// action 为 comment.content （是主题中定义的类名）
			[/./, 'comment.content']
		],

		otherTag: [
			[/\/?>/, 'delimiter', '@pop'],
			[/"([^"]*)"/, 'attribute.value'],
			[/'([^']*)'/, 'attribute.value'],
			[/[\w\-]+/, 'attribute.name'],
			[/=/, 'delimiter'],
			[/[ \t\r\n]+/] // whitespace
		],

		// -- BEGIN <script> tags handling

		// After <script
		script: [
			[/type/, 'attribute.name', '@scriptAfterType'],
			[/"([^"]*)"/, 'attribute.value'],
			[/'([^']*)'/, 'attribute.value'],
			[/[\w\-]+/, 'attribute.name'],
			[/=/, 'delimiter'],
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded',
					nextEmbedded: 'text/javascript'
				}
			],
			[/[ \t\r\n]+/], // whitespace
			[/(<\/)(script\s*)(>)/, ['delimiter', 'tag', { token: 'delimiter', next: '@pop' }]]
		],

		// After <script ... type
		scriptAfterType: [
			[/=/, 'delimiter', '@scriptAfterTypeEquals'],
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded',
					nextEmbedded: 'text/javascript'
				}
			], // cover invalid e.g. <script type>
			[/[ \t\r\n]+/], // whitespace
			[/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
		],

		// After <script ... type =
		scriptAfterTypeEquals: [
			[
				/"module"/,
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.text/javascript'
				}
			],
			[
				/'module'/,
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.text/javascript'
				}
			],
			[
				/"([^"]*)"/,
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.$1'
				}
			],
			[
				/'([^']*)'/,
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.$1'
				}
			],
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded',
					nextEmbedded: 'text/javascript'
				}
			], // cover invalid e.g. <script type=>
			[/[ \t\r\n]+/], // whitespace
			[/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
		],

		// After <script ... type = $S2
		scriptWithCustomType: [
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded.$S2',
					nextEmbedded: '$S2'
				}
			],
			[/"([^"]*)"/, 'attribute.value'],
			[/'([^']*)'/, 'attribute.value'],
			[/[\w\-]+/, 'attribute.name'],
			[/=/, 'delimiter'],
			[/[ \t\r\n]+/], // whitespace
			[/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
		],

		scriptEmbedded: [
			[/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
			[/[^<]+/, '']
		],

		// -- END <script> tags handling

		// -- BEGIN <style> tags handling

		// After <style
		style: [
			[/type/, 'attribute.name', '@styleAfterType'],
			[/"([^"]*)"/, 'attribute.value'],
			[/'([^']*)'/, 'attribute.value'],
			[/[\w\-]+/, 'attribute.name'],
			[/=/, 'delimiter'],
			[
				/>/,
				{
					token: 'delimiter',
					next: '@styleEmbedded',
					nextEmbedded: 'text/css'
				}
			],
			[/[ \t\r\n]+/], // whitespace
			[/(<\/)(style\s*)(>)/, ['delimiter', 'tag', { token: 'delimiter', next: '@pop' }]]
		],

		// After <style ... type
		styleAfterType: [
			[/=/, 'delimiter', '@styleAfterTypeEquals'],
			[
				/>/,
				{
					token: 'delimiter',
					next: '@styleEmbedded',
					nextEmbedded: 'text/css'
				}
			], // cover invalid e.g. <style type>
			[/[ \t\r\n]+/], // whitespace
			[/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
		],

		// After <style ... type =
		styleAfterTypeEquals: [
			[
				/"([^"]*)"/,
				{
					token: 'attribute.value',
					switchTo: '@styleWithCustomType.$1'
				}
			],
			[
				/'([^']*)'/,
				{
					token: 'attribute.value',
					switchTo: '@styleWithCustomType.$1'
				}
			],
			[
				/>/,
				{
					token: 'delimiter',
					next: '@styleEmbedded',
					nextEmbedded: 'text/css'
				}
			], // cover invalid e.g. <style type=>
			[/[ \t\r\n]+/], // whitespace
			[/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
		],

		// After <style ... type = $S2
		styleWithCustomType: [
			[
				/>/,
				{
					token: 'delimiter',
					next: '@styleEmbedded.$S2',
					nextEmbedded: '$S2'
				}
			],
			[/"([^"]*)"/, 'attribute.value'],
			[/'([^']*)'/, 'attribute.value'],
			[/[\w\-]+/, 'attribute.name'],
			[/=/, 'delimiter'],
			[/[ \t\r\n]+/], // whitespace
			[/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
		],

		styleEmbedded: [
			[/<\/style/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
			[/[^<]+/, '']
		]

		// -- END <style> tags handling
	}
};

// TESTED WITH:

// <!DOCTYPE html>
// <html>
// <head>
//   <title>Monarch Workbench</title>
//   <meta http-equiv="X-UA-Compatible" content="IE=edge" />
//   <!----
//   -- -- -- a comment -- -- --
//   ---->
//   <style bah="bah">
//     body { font-family: Consolas; } /* nice */
//   </style>
// </head
// >
// a = "asd"
// <body>
//   <br/>
//   <div
//   class
//   =
//   "test"
//   >
//     <script>
//       function() {
//         alert("hi </ script>"); // javascript
//       };
//     </script>
//     <script
// 	bah="asdfg"
// 	type="text/css"
// 	>
//   .bar { text-decoration: underline; }
//     </script>
//   </div>
// </body>
// </html>
