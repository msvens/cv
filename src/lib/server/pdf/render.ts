import pdfmake from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

/** PDF's built-in Helvetica family: no font files to ship, and it covers å/ä/ö and "—". */
const HELVETICA = {
	normal: 'Helvetica',
	bold: 'Helvetica-Bold',
	italics: 'Helvetica-Oblique',
	bolditalics: 'Helvetica-BoldOblique'
};

pdfmake.addFonts({ Helvetica: HELVETICA });
// The resume embeds no images or remote resources, so deny every URL and every local file.
// pdfmake checks font names against the local-file policy too, so the four built-in Helvetica
// names are the only paths allowed.
const allowedFonts = new Set(Object.values(HELVETICA));
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((path) => allowedFonts.has(path));

export function renderPdf(doc: TDocumentDefinitions): Promise<Buffer> {
	return pdfmake.createPdf(doc).getBuffer();
}
