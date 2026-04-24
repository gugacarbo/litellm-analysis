import 'dotenv/config';
import { createDataSource } from '@lite-llm/analytics/data-source';
import { createApiServer } from './api-server.js';

const dataSource = createDataSource();
const app = createApiServer(dataSource);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
