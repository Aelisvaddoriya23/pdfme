"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVariables = exports.substituteVariables = void 0;
const substituteVariables = (text, variablesIn) => {
    if (!text) {
        return "";
    }
    let substitutedText = text;
    if (variablesIn) {
        const variables = (typeof variablesIn === "string") ? JSON.parse(variablesIn) || {} : variablesIn;
        Object.keys(variables).forEach((variableName) => {
            // handle special characters in variable name
            const variableForRegex = variableName.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp('{' + variableForRegex + '}', 'g');
            substitutedText = substitutedText.replace(regex, variables[variableName]);
        });
    }
    // Remove any variables that were not substituted from inputs
    substitutedText = substitutedText.replace(/{[^{}]+}/g, '');
    return substitutedText;
};
exports.substituteVariables = substituteVariables;
const validateVariables = (value, schema) => {
    if (schema.variables.length == 0) {
        return true;
    }
    let values;
    try {
        values = value ? JSON.parse(value) : {};
    }
    catch (e) {
        throw new SyntaxError(`[@pdfme/generator] invalid JSON string '${value}' for variables in field ${schema.name}`);
    }
    for (const variable of schema.variables) {
        if (!values[variable]) {
            if (schema.required) {
                throw new Error(`[@pdfme/generator] variable ${variable} is missing for field ${schema.name}`);
            }
            // If not required, then simply don't render this field if an input is missing
            return false;
        }
    }
    return true;
};
exports.validateVariables = validateVariables;
//# sourceMappingURL=helper.js.map