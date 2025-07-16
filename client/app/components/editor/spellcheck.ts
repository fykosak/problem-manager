import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from '@codemirror/view';
import Typo from 'typo-js';

import { langEnum } from '@server/db/schema';

import './spellcheck.css';

const spellErrorMark = Decoration.mark({ class: 'cm-spell-error' });

const dictionaries = {
	cs: new Typo('cs_CZ', null, null, {
		dictionaryPath: '/dictionaries',
	}),
	en: new Typo('en_US', null, null, {
		dictionaryPath: '/dictionaries',
	}),
};

// Spellchecker ViewPlugin implemented as a normal class
class SpellcheckViewPlugin {
	decorations: DecorationSet;
	dictionary: Typo;

	constructor(
		public view: EditorView,
		lang: (typeof langEnum.enumValues)[number]
	) {
		this.dictionary = dictionaries[lang];
		this.decorations = this.computeDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.computeDecorations(update.view);
		}
	}

	computeDecorations(view: EditorView): DecorationSet {
		console.log('compute decorations');
		const builder = new RangeSetBuilder<Decoration>();
		const tree = syntaxTree(view.state);

		const punctuation = `!"#$%&()*+,-./:;<=>?@[\\\\\\]^_\`{|}~`;
		const splitRegex = new RegExp(`[^\\s${punctuation}]+`, 'g');

		for (const { from, to } of view.visibleRanges) {
			tree.iterate({
				from,
				to,
				enter: (node) => {
					if (node.name === 'Text') {
						const text = view.state.doc.sliceString(
							node.from,
							node.to
						);
						let match;
						while ((match = splitRegex.exec(text)) !== null) {
							const word = match[0];
							const start = node.from + match.index;
							const end = start + word.length;

							if (!this.dictionary.check(word)) {
								builder.add(start, end, spellErrorMark);
							}
						}
					}
				},
			});
		}

		return builder.finish();
	}
}

// Export the plugin and extension

export function getSpellcheckExtension(
	lang: (typeof langEnum.enumValues)[number]
) {
	return ViewPlugin.fromClass(
		class extends SpellcheckViewPlugin {
			constructor(view: EditorView) {
				super(view, lang);
			}
		},
		{
			decorations: (plugin) => plugin.decorations,
		}
	);
}
