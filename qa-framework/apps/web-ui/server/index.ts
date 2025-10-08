import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './routes.js';

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(express.json({ limit: '10mb' }));

app.use('/api', router);

// Static serve UI in production
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDir = path.resolve(__dirname, '../../dist/client');
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 5175;
app.listen(PORT, () => {
  // Do not log secrets; just the URL
  console.log(`web-ui API listening on http://localhost:${PORT}`);
});


