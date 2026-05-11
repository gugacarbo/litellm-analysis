const { zodToJsonSchema } = require("zod-to-json-schema");
const { z } = require("zod");

const testSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
});

const result = zodToJsonSchema(testSchema, "Test");
console.log(JSON.stringify(result, null, 2));
