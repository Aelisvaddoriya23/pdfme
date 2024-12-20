import { z } from 'zod';
import { Template, Font, BasePdf, Plugins } from './types';
export declare const cloneDeep: <T>(value: T) => T;
export declare const getFallbackFontName: (font: Font) => string;
export declare const getDefaultFont: () => Font;
export declare const mm2pt: (mm: number) => number;
export declare const pt2mm: (pt: number) => number;
export declare const pt2px: (pt: number) => number;
export declare const px2mm: (px: number) => number;
export declare const isHexValid: (hex: string) => boolean;
/**
 * Migrate from legacy keyed object format to array format
 * @param template Template
 */
export declare const migrateTemplate: (template: Template) => void;
export declare const getInputFromTemplate: (template: Template) => {
    [key: string]: string;
}[];
export declare const getB64BasePdf: (basePdf: BasePdf) => string | Promise<string>;
export declare const isBlankPdf: (basePdf: BasePdf) => basePdf is {
    width: number;
    height: number;
    padding: [number, number, number, number];
    staticSchema?: z.objectOutputType<{
        name: z.ZodString;
        type: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>;
        width: z.ZodNumber;
        height: z.ZodNumber;
        rotate: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        __bodyRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end?: number | undefined;
        }, {
            start: number;
            end?: number | undefined;
        }>>;
        __isSplit: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
};
export declare const b64toUint8Array: (base64: string) => Uint8Array;
export declare const checkFont: (arg: {
    font: Font;
    template: Template;
}) => void;
export declare const checkPlugins: (arg: {
    plugins: Plugins;
    template: Template;
}) => void;
export declare const checkInputs: (data: unknown) => void;
export declare const checkUIOptions: (data: unknown) => void;
export declare const checkPreviewProps: (data: unknown) => void;
export declare const checkDesignerProps: (data: unknown) => void;
export declare const checkUIProps: (data: unknown) => void;
export declare const checkTemplate: (template: unknown) => void;
export declare const checkGenerateProps: (data: unknown) => void;
