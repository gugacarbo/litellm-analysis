-- Rename model_proxy_providers table to model_proxy_providers
ALTER TABLE "model_proxy_providers" RENAME TO "model_proxy_providers";

-- Rename provider_name column to provider_name in model_proxy_models
ALTER TABLE "model_proxy_models" RENAME COLUMN "provider_name" TO "provider_name";
