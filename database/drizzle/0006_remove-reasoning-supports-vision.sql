UPDATE "model_proxy_models"
SET
  "reasoning" = "reasoning" - 'supportsVision',
  "revision" = "revision" + 1,
  "updated_at" = now()
WHERE "reasoning" ? 'supportsVision';
