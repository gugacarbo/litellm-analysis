import { DatabaseDataSource } from "./database.js";
export function createDataSource() {
  return new DatabaseDataSource();
}
export { DatabaseDataSource };
