DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'model_proxy_models'
      AND column_name = 'revision'
  ) THEN
    EXECUTE format(
      'UPDATE %I.model_proxy_models
       SET reasoning = reasoning - ''supportsVision'',
           revision = revision + 1,
           updated_at = now()
       WHERE reasoning ? ''supportsVision''',
      current_schema()
    );
  ELSE
    EXECUTE format(
      'UPDATE %I.model_proxy_models
       SET reasoning = reasoning - ''supportsVision'',
           updated_at = now()
       WHERE reasoning ? ''supportsVision''',
      current_schema()
    );
  END IF;
END $$;
