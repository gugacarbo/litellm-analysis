import { fetchApi } from "./core";
export async function getAllModels() {
  return fetchApi("/models");
}
export async function createModel(model) {
  return fetchApi("/models", {
    method: "POST",
    body: JSON.stringify(model),
  });
}
export async function updateModel(modelName, litellmParams, newName) {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "PUT",
    body: JSON.stringify({
      litellmParams,
      ...(newName ? { modelName: newName } : {}),
    }),
  });
}
export async function deleteModel(modelName) {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "DELETE",
  });
}
export async function deleteModelLogs(modelName) {
  return fetchApi(`/models/logs/${encodeURIComponent(modelName)}`, {
    method: "DELETE",
  });
}
export async function mergeModels(sourceModel, targetModel) {
  return fetchApi("/models/merge", {
    method: "POST",
    body: JSON.stringify({ sourceModel, targetModel }),
  });
}
