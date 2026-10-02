import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import { initializeSocketServer } from './server/sockets/socketServer';
import apiRoutes from './server/routes/index';
import { CrossQuestionController } from './server/controllers/crossQuestionController';
import { errorHandler } from './server/middleware/errorMiddleware';

const PORT = 3000;
let pyProcess: ChildProcess | null = null;

function startAiServiceSidecar() {
  const pyEntry = path.join(process.cwd(), 'ai_service', 'main.py');
  if (!fs.existsSync(pyEntry)) {
    return;
  }

  try {
    pyProcess = spawn('python3', ['-m', 'uvicorn', 'ai_service.main:app', '--host', '0.0.0.0', '--port', '8001'], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    pyProcess.on('error', (err) => {
      console.warn('[AI Service] Python AI Judge notice:', err.message);
    });

    process.on('exit', () => {
      if (pyProcess && !pyProcess.killed) {
        pyProcess.kill();
      }
    });
  } catch (err: any) {
    console.warn('[AI Service] Notice:', err.message);
  }
}

async function startServer() {
  // Start Python FastAPI AI Judge microservice
  startAiServiceSidecar();

  const app = express();
  const server = http.createServer(app);

  // Parse JSON and form bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database Connection
  await connectDB();

  // Initialize Socket.IO
  const io = initializeSocketServer(server);
  app.set('io', io);

  // Root-level AI Cross-Question Endpoints
  app.post('/generate-question', CrossQuestionController.generateQuestion);
  app.post('/evaluate-cross-answer', CrossQuestionController.evaluateAnswer);

  // Mount API Routes FIRST
  app.use('/api', apiRoutes);

  // Centralized Error Handling for API routes
  app.use(errorHandler);

  // Vite middleware setup for Development or Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Debate Arena] Full-stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
