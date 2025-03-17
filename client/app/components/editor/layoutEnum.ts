export enum Layout {
	// --------------
	// | text | pdf |
	// |      |     |
	// --------------
	TEXT_PDF = 'text_pdf',
	// --------------
	// | text | pdf |
	// |------|     |
	// | text |     |
	// --------------
	TEXT_TEXT_PDF = 'text_text_pdf',
	// --------------
	// | text | text |
	// |      |     |
	// --------------
	TEXT_TEXT = 'text_text',
}

export function getLayoutLabel(layout: Layout): string {
	switch (layout) {
		case Layout.TEXT_PDF:
			return 'Text and PDF';
		case Layout.TEXT_TEXT_PDF:
			return '2 texts vertically and PDF';
		case Layout.TEXT_TEXT:
			return '2 texts side by side';
	}
}
