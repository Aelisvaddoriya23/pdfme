import * as pdfLib from '@pdfme/pdf-lib';
import type { GenerateProps } from '@pdfme/common';
import {
  checkGenerateProps,
  getDynamicTemplate,
  isBlankPdf,
  replacePlaceholders,
} from '@pdfme/common';
import { getDynamicHeightsForTable } from '@pdfme/schemas/utils';
import {
  insertPage,
  preprocessing,
  postProcessing,
  getEmbedPdfPages,
  validateRequiredFields,
} from './helper.js';
const fs = require("fs");


const generate = async (props: GenerateProps) => {
  checkGenerateProps(props);
  const { inputs, template, options = {}, plugins: userPlugins = {} } = props;
  const basePdf = template.basePdf;

  if (inputs.length === 0) {
    throw new Error(
      '[@pdfme/generator] inputs should not be empty, pass at least an empty object in the array'
    );
  }

  validateRequiredFields(template, inputs);

  const { pdfDoc, renderObj } = await preprocessing({ template, userPlugins });

  const _cache = new Map();

  for (let i = 0; i < inputs.length; i += 1) {
    const input = inputs[i];

    const dynamicTemplate = await getDynamicTemplate({
      template,
      input,
      options,
      _cache,
      getDynamicHeights: (value, args) => {
        switch (args.schema.type) {
          case 'table':
            return getDynamicHeightsForTable(value, args);
          default:
            return Promise.resolve([args.schema.height]);
        }
      },
    });
    const { basePages, embedPdfBoxes } = await getEmbedPdfPages({
      template: dynamicTemplate,
      pdfDoc,
    });
    const schemaNames = [
      ...new Set(dynamicTemplate.schemas.map((page) => page.map((schema) => schema.name))),
    ];

    for (let j = 0; j < basePages.length; j += 1) {
      const basePage = basePages[j];
      const embedPdfBox = embedPdfBoxes[j];
      const page = insertPage({ basePage, embedPdfBox, pdfDoc });

      if (isBlankPdf(basePdf) && basePdf.staticSchema) {
        for (let k = 0; k < basePdf.staticSchema.length; k += 1) {
          const staticSchema = basePdf.staticSchema[k];
          const render = renderObj[staticSchema.type];
          if (!render) {
            continue;
          }
          const value = replacePlaceholders({
            content: staticSchema.content || '',
            variables: { ...input, totalPages: basePages.length, currentPage: j + 1 },
            schemas: dynamicTemplate.schemas,
          });

          await render({
            value,
            schema: staticSchema,
            basePdf,
            pdfLib,
            pdfDoc,
            page,
            options,
            _cache,
          });
        }
      }
      // fs.writeFileSync(
      //   `/Users/icanstudiozmac1/Documents/whatsapp-api/whatsapp-api/assets/baseDemo2.txt`,
      //   pdfDoc.saveAsBase64()
      // );
      for (let l = 0; l < schemaNames.length; l += 1) {
        const name = schemaNames[l];
        const schemaPage = dynamicTemplate.schemas[j] || [];
        const schema = schemaPage.find((s) => Array.isArray(name) ? name.includes(s.name) : s.name === name);
        if (!schema) {
          continue;
        }

        const render = renderObj[schema.type];
        if (!render) {
          continue;
        }
        const value = schema.readOnly
        ? replacePlaceholders({
            content: schema.content || '',
            variables: { ...input, totalPages: basePages.length, currentPage: j + 1 },
            schemas: dynamicTemplate.schemas,
          })
        : Array.isArray(name)
        ? name.map((n) => input[n] || '').join(', ') // Combine values for all names in the array
        : input[name] || ''; // Use the value of the single name key
        await render({ value, schema, basePdf, pdfLib, pdfDoc, page, options, _cache });
      }
    }
  }
  // fs.writeFileSync(
  //     `/Users/icanstudiozmac1/Documents/whatsapp-api/whatsapp-api/assets/baseDemo3.txt`,
  //     pdfDoc.saveAsBase64()
  //   );
  postProcessing({ pdfDoc, options });

  return pdfDoc.save();
};

export default generate;
