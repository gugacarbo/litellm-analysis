import 'dotenv/config';
import { createApiServer } from './api-server.js';
import { createDataSource } from '@lite-llm/analytics-data-source';

const dataSource = createDataSource();
const app = createApiServer(dataSource);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
