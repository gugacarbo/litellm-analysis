import { registeredPluginSchemas } from "../src/lib/plugin-schemas";
import { generatePluginSchema } from "../src/lib/schema-generator";

await Promise.all(
  registeredPluginSchemas.map(async (spec) => {
    await generatePluginSchema(spec);
    console.log(`[agent-plugins] generated ${spec.generatedSchemaPath}`);
  }),
);
