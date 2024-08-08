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
// 当匹配到字符 - 时，先匹配 /-->/, 状态机会尽可能匹配长的字符串，因此当字符串后续是字符 - 和 > 则会匹配规则 A(最终 pop 回到初始状态)
// 反之 若是字符串 -x，则不会匹配 规则 A，那么 - 字符会继续去匹配规则，即匹配到 规则 C
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
			// rules 匹配自闭合的标签，举例 <foo:bar />，
			// 注意它匹配的自闭合标签是无属性的，<foo:bar id/> 是不匹配的
			// (<) 匹配自闭合标签的开始部分，<
			// ((?:[\w\-]+:)?[\w\-]+) 匹配标签名 foo:bar
			// (\s*) 匹配任何标签名和自闭合斜杠之间的空白
			// (\/>) 匹配自闭合标签的结束部分，包括斜杠 / 和右尖括号 >
			// action 为 delimiter, tag，'', delimiter
			[/(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/, ['delimiter', 'tag', '', 'delimiter']],
			// rules 匹配 script 标签
			// 这里要匹配完整的 <script 同时又设置不同的 action 所以 使用的是 (<)(script)，将其捕获
			// 捕获组 [ '<script', '<', 'script', index: 0, input: '<script>', groups: undefined ]
			// 而如果使用 /<script/ 则没有捕获组
			// [ '<script', index: 0, input: '<script>', groups: undefined ]
			// 所以最终 < 的 action 是 delimiter，而 script 的 action 是 tag 同时 状态机切换到 script 状态
			[/(<)(script)/, ['delimiter', { token: 'tag', next: '@script' }]],
			// rules 匹配 script 标签
			// 所以最终 < 的 action 是 delimiter，而 style 的 action 是 tag 同时 状态机切换到 style 状态
			[/(<)(style)/, ['delimiter', { token: 'tag', next: '@style' }]],
			// rules 匹配非自闭合的标签的开始标签开始符，举例 <foo:bar
			// action 为 delimiter, tag，并切换到 otherTag 状态
			[/(<)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
			// rules 匹配非自闭合的标签的结束标签开始符，举例 </foo:bar
			// action 为 delimiter, tag，并切换到 otherTag 状态
			[/(<\/)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
			// rules 用来识别标签开始的符号 <
			[/</, 'delimiter'],
			// rules 匹配任何不包含 < 的一个或多个字符，
			// 经过前面的规则过滤，能走到这条规则上的基本上就是 标签内的文本节点了
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
			// rules 匹配一个可能包含 / 的 > 符号
			// 对于非自闭和标签和有属性的自闭合标签，实际上就是处理开始标签或结束标签的结束符
			// action 为 delimiter，并弹出回到初始状态
			[/\/?>/, 'delimiter', '@pop'],
			// rules 匹配双引号 " 包裹的字符串内容，捕获的内容不包括引号本身
			// action 为 attribute.value
			// 例如 type="text/javascript" 中的 text/javascript。
			[/"([^"]*)"/, 'attribute.value'],
			// rules 匹配单引号 ' 包裹的字符串内容，捕获的内容不包括引号本身
			// action 为 attribute.value
			// 例如 type='text/javascript' 中的 text/javascript。
			[/'([^']*)'/, 'attribute.value'],
			// rules 匹配一个或多个字母、数字、下划线 _ 或连字符 -
			// action 为 attribute.name
			// 例如 src
			[/[\w\-]+/, 'attribute.name'],
			// rules 匹配 =
			// action 为 delimiter
			[/=/, 'delimiter'],
			[/[ \t\r\n]+/] // whitespace
		],

		// -- BEGIN <script> tags handling

		// After <script
		script: [
			// rules type 字符串
			// action 为 attribute.name, 并切换到 @scriptAfterType状态
			[/type/, 'attribute.name', '@scriptAfterType'],
			// rules 匹配双引号 " 包裹的字符串内容，捕获的内容不包括引号本身
			// action 为 attribute.value
			// 例如 type="text/javascript" 中的 text/javascript。
			[/"([^"]*)"/, 'attribute.value'],
			// rules 匹配单引号 ' 包裹的字符串内容，捕获的内容不包括引号本身
			// action 为 attribute.value
			// 例如 type='text/javascript' 中的 text/javascript。
			[/'([^']*)'/, 'attribute.value'],
			// rules 匹配一个或多个字母、数字、下划线 _ 或连字符 -
			// 这里不包括 type，因为在第一条规则中已经匹配了
			// action 为 attribute.name
			// 例如 src
			[/[\w\-]+/, 'attribute.name'],
			// rules 匹配 =
			// 这里不包括 type=，因为在第一条规则中已经匹配了
			// action 为 delimiter
			[/=/, 'delimiter'],
			// rules 匹配 > , 这里表示 script 开始标签的结束符 >
			// action 为 delimiter, 并切换到 scriptEmbedded 状态
			// nextEmbedded 向编辑器表示，这个令牌后面跟着由langId指定的另一种语言的代码，例如javascript
			// 这里的意思是，<script > 后的内容是 js 代码，是另一种语言
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded',
					nextEmbedded: 'text/javascript'
				}
			],
			// rules 配消费空格和转义符
			[/[ \t\r\n]+/], // whitespace
			// rules 捕获 </script>, 也捕获有 script 后的任意字符
			// 分别对 < , script ** , > 设置 action 为 delimiter， tag， delimiter，
			// 并在 > 时 pop 回到初始状态
			[/(<\/)(script\s*)(>)/, ['delimiter', 'tag', { token: 'delimiter', next: '@pop' }]]
		],

		// After <script ... type
		scriptAfterType: [
			// rules 匹配 =
			// action 为 delimiter, 并切换到 @scriptAfterTypeEquals 状态
			[/=/, 'delimiter', '@scriptAfterTypeEquals'],
			// 同 script tokenizer
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded',
					nextEmbedded: 'text/javascript'
				}
			], // cover invalid e.g. <script type>

			// 同 script tokenizer
			[/[ \t\r\n]+/], // whitespace
			// @rematch 标识不消费字符串，回到 script 状态去处理
			[/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
		],

		// After <script ... type =
		scriptAfterTypeEquals: [
			[
				/"module"/,
				// rules: 匹配双引号 module
				// action 为 attribute.value
				// switchTo 在不改变堆栈的情况下切换到状态 scriptWithCustomType
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.text/javascript'
				}
			],
			[
				/'module'/,
				// rules: 匹配单引号 module
				// action 为 attribute.value
				// switchTo 在不改变堆栈的情况下切换到状态 scriptWithCustomType
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.text/javascript'
				}
			],
			[
				/"([^"]*)"/,
				// rules: 匹配双引号包裹的任意内容，并捕获内容到 $1
				// (Monarch 规范， @scriptWithCustomType.$1 变成 @scriptWithCustomType.xxxx， 即引号内容)
				// action 为 attribute.value
				// switchTo 在不改变堆栈的情况下切换到状态 scriptWithCustomType
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.$1'
				}
			],
			[
				/'([^']*)'/,
				// rules: 匹配单引号包裹的任意内容，并捕获内容到 $1
				// (Monarch 规范， @scriptWithCustomType.$1 变成 @scriptWithCustomType.xxxx， 即引号内容)
				// action 为 attribute.value
				// switchTo 在不改变堆栈的情况下切换到状态 scriptWithCustomType
				{
					token: 'attribute.value',
					switchTo: '@scriptWithCustomType.$1'
				}
			],
			// 同 script tokenizer
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded',
					nextEmbedded: 'text/javascript'
				}
			], // cover invalid e.g. <script type=>
			// 同 script tokenizer
			[/[ \t\r\n]+/], // whitespace
			// @rematch 标识不消费字符串，回到 script 状态去处理
			[/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
		],

		// After <script ... type = $S2
		scriptWithCustomType: [
			// 遇到 > 即表示 script 开始标签的结束符号，
			// $S2 值是 scriptAfterTypeEquals 状态捕获的 type = 'xxx' 中的值
			// 即如果是 module，scriptAfterTypeEquals 中会转化为 text/javascript
			// 那么字符匹配到 > 时，实际上就切换到 scriptEmbedded 状态并当做 js 处理（nextEmbedded: text/javascript）
			// 如果 $S2 是其他字符比如 text/javascript， 就直接处理
			[
				/>/,
				{
					token: 'delimiter',
					next: '@scriptEmbedded.$S2',
					nextEmbedded: '$S2'
				}
			],
			// rules: 匹配双引号包裹的任意内容，
			// action： 为 attribute.value
			// 此处是继续处理并消费 <script type=$2 ... >
			// 省略号的部分（下同）
			[/"([^"]*)"/, 'attribute.value'],
			// rules: 匹配单引号包裹的任意内容，
			// action： 为 attribute.value
			[/'([^']*)'/, 'attribute.value'],
			// rules: rules 匹配一个或多个字母、数字、下划线 _ 或连字符 -
			// action： 为 attribute.name
			[/[\w\-]+/, 'attribute.name'],
			// rules 匹配 =
			// action 为 delimiter
			[/=/, 'delimiter'],
			// 同 script tokenizer
			[/[ \t\r\n]+/], // whitespace
			// @rematch 标识不消费字符串，回到 script 状态去处理
			[/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
		],
		//
		// 如果js 字符串中包含 </script, 弹出为 script 状态，@rematch 标识不消费 字符串
		// nextEmbedded 标识回到处理 html 的语言上
		// 即在 script 状态再次以 html 处理方式 </script
		// 此时 js 快中后续的 代码都会当做 html 处理，则变成了普通文本没有高亮(感觉是 bug)
		scriptEmbedded: [
			[/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
			// 不处理其他的字符，匹配或不匹配
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
