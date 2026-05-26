import { generatePluginSchemasFromManifests } from "./generate-plugin-schemas.mjs";

await generatePluginSchemasFromManifests({ skipUpToDate: true });
console.log("[agent-plugins] plugin schemas ensured");
