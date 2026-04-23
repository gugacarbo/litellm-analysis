import 'dotenv/config';
import { createApiServer } from './api-server.js';
import { createDataSource } from './data-source/index.js';

const dataSource = createDataSource();
const app = createApiServer(dataSource);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
