/**
 * Extracts the name attribute from a form field helper.
 * Useful for getting field names when using remote action field helpers.
 */
export const getTextFieldName = (field: {
  as: (type: "text") => { name: string };
}): string => field.as("text").name;
