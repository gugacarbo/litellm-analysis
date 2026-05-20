export type { ManagedAliasReconcileResult } from "./alias/cleanup";
export {
  getExistingAliasesForAgent,
  reconcileManagedAliases,
  replaceAliasesForAgent,
} from "./alias/cleanup";
export { escapeRegExp, generateAliasCleanupPattern } from "./utils/regex";
