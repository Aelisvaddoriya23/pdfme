import * as fontkit from 'fontkit';
import { isBlankPdf, mm2pt, } from '@pdfme/common';
import { builtInPlugins } from '@pdfme/schemas';
import { PDFDocument, PDFEmbeddedPage } from '@pdfme/pdf-lib';
import { TOOL_NAME } from './constants.js';
// export const getEmbedPdfPages = async (arg: { template: Template; pdfDoc: PDFDocument }) => {
//   const {
//     template: { schemas, basePdf },
//     pdfDoc,
//   } = arg;
//   let basePages: (PDFEmbeddedPage | PDFPage)[] = [];
//   let embedPdfBoxes: EmbedPdfBox[] = [];
//   if (isBlankPdf(basePdf)) {
//     const { width: _width, height: _height } = basePdf;
//     const width = mm2pt(_width);
//     const height = mm2pt(_height);
//     basePages = schemas.map(() => {
//       const page = PDFPage.create(pdfDoc);
//       page.setSize(width, height);
//       return page;
//     });
//     embedPdfBoxes = schemas.map(() => ({
//       mediaBox: { x: 0, y: 0, width, height },
//       bleedBox: { x: 0, y: 0, width, height },
//       trimBox: { x: 0, y: 0, width, height },
//     }));
//   } else {
//     const willLoadPdf = typeof basePdf === 'string' ? await getB64BasePdf(basePdf) : basePdf;
//     const embedPdf = await PDFDocument.load(willLoadPdf as ArrayBuffer | Uint8Array | string);
//     const embedPdfPages = embedPdf.getPages();
//     embedPdfBoxes = embedPdfPages.map((p) => ({
//       mediaBox: p.getMediaBox(),
//       bleedBox: p.getBleedBox(),
//       trimBox: p.getTrimBox(),
//     }));
//     const boundingBoxes = embedPdfPages.map((p) => {
//       const { x, y, width, height } = p.getMediaBox();
//       return { left: x, bottom: y, right: width, top: height + y };
//     });
//     const transformationMatrices = embedPdfPages.map(
//       () => [1, 0, 0, 1, 0, 0] as TransformationMatrix
//     );
//     basePages = await pdfDoc.embedPages(embedPdfPages, boundingBoxes, transformationMatrices);
//   }
//   return { basePages, embedPdfBoxes };
// };
const pdfjsLib = require('pdfjs-dist');
export const getEmbedPdfPages = async (arg) => {
    const { template: { schemas, basePdf }, pdfDoc, } = arg;
    let basePages = [];
    let embedPdfBoxes = [];
    if (isBlankPdf(basePdf)) {
        const { width: _width, height: _height } = basePdf;
        const width = mm2pt(_width);
        const height = mm2pt(_height);
        basePages = schemas.map(() => pdfDoc.addPage([width, height]));
        embedPdfBoxes = schemas.map(() => ({
            mediaBox: { x: 0, y: 0, width, height },
            bleedBox: { x: 0, y: 0, width, height },
            trimBox: { x: 0, y: 0, width, height },
        }));
    }
    else {
        const loadingTask = pdfjsLib.getDocument({ data: basePdf });
        const embedPdf = await loadingTask.promise;
        const embedPdfPages = [];
        const boundingBoxes = [];
        const transformationMatrices = [];
        for (let i = 1; i <= embedPdf.numPages; i++) {
            const page = await embedPdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            const { width, height } = viewport;
            const x = 0;
            const y = 0;
            embedPdfBoxes.push({
                mediaBox: { x, y, width, height },
                bleedBox: { x, y, width, height },
                trimBox: { x, y, width, height },
            });
            // Collect data for embedding
            const boundingBox = { left: x, bottom: y, right: width, top: height };
            boundingBoxes.push(boundingBox);
            transformationMatrices.push([1, 0, 0, 1, 0, 0]);
            // Add the page to the array
            embedPdfPages.push(page);
        }
        // Embed pages into the PDF document
        basePages = await pdfDoc.embedPages(embedPdfPages, boundingBoxes, transformationMatrices);
    }
    return { basePages, embedPdfBoxes };
};
export const validateRequiredFields = (template, inputs) => {
    template.schemas.forEach((schemaPage) => schemaPage.forEach(schema => {
        if (schema.required && !schema.readOnly && !inputs.some((input) => input[schema.name])) {
            throw new Error(`[@pdfme/generator] input for '${schema.name}' is required to generate this PDF`);
        }
    }));
};
export const preprocessing = async (arg) => {
    const { template, userPlugins } = arg;
    const { schemas } = template;
    const pdfDoc = await PDFDocument.create();
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);
    const pluginValues = (Object.values(userPlugins).length > 0
        ? Object.values(userPlugins)
        : Object.values(builtInPlugins));
    const schemaTypes = schemas.map(schemaPage => schemaPage.map((schema) => schema.type)).reduce((acc, types) => acc.concat(types), []);
    const renderObj = schemaTypes.reduce((acc, type) => {
        const render = pluginValues.find((pv) => pv.propPanel.defaultSchema.type === type);
        if (!render) {
            throw new Error(`[@pdfme/generator] Renderer for type ${type} not found.
Check this document: https://pdfme.com/docs/custom-schemas`);
        }
        return { ...acc, [type]: render.pdf };
    }, {});
    return { pdfDoc, renderObj };
};
export const postProcessing = (props) => {
    const { pdfDoc, options } = props;
    const { author = TOOL_NAME, creationDate = new Date(), creator = TOOL_NAME, keywords = [], lang = 'en', modificationDate = new Date(), producer = TOOL_NAME, subject = '', title = '', } = options;
    pdfDoc.setAuthor(author);
    pdfDoc.setCreationDate(creationDate);
    pdfDoc.setCreator(creator);
    pdfDoc.setKeywords(keywords);
    pdfDoc.setLanguage(lang);
    pdfDoc.setModificationDate(modificationDate);
    pdfDoc.setProducer(producer);
    pdfDoc.setSubject(subject);
    pdfDoc.setTitle(title);
};
export const insertPage = (arg) => {
    const { basePage, embedPdfBox, pdfDoc } = arg;
    const size = basePage instanceof PDFEmbeddedPage ? basePage.size() : basePage.getSize();
    const insertedPage = basePage instanceof PDFEmbeddedPage
        ? pdfDoc.addPage([size.width, size.height])
        : pdfDoc.addPage(basePage);
    if (basePage instanceof PDFEmbeddedPage) {
        insertedPage.drawPage(basePage);
        const { mediaBox, bleedBox, trimBox } = embedPdfBox;
        insertedPage.setMediaBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
        insertedPage.setBleedBox(bleedBox.x, bleedBox.y, bleedBox.width, bleedBox.height);
        insertedPage.setTrimBox(trimBox.x, trimBox.y, trimBox.width, trimBox.height);
    }
    return insertedPage;
};
//# sourceMappingURL=helper.js.map