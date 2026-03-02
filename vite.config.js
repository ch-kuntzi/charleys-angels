import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Local API plugin — writes dashboard data back to tasks.json (dev only)
function localSyncPlugin() {
  return {
    name: 'local-sync',
    configureServer(server) {
      // Sync tasks.json
      server.middlewares.use('/api/sync', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              // Preserve _lastModified at top level so the browser can compare timestamps on next poll
              const toWrite = {
                boardData: data.boardData,
                categories: data.categories,
                activity: data.activity,
                _lastModified: data._lastModified || Date.now(),
              };
              const filePath = path.resolve(__dirname, 'public/data/tasks.json');
              fs.writeFileSync(filePath, JSON.stringify(toWrite, null, 2) + '\n');

              // Auto-commit and push
              const { execSync } = require('child_process');
              try {
                execSync(`git -C "${__dirname}" add public/data/tasks.json`, { stdio: 'pipe' });
                execSync(`git -C "${__dirname}" commit -m "[dashboard] Web update from Chris"`, { stdio: 'pipe' });
                execSync(`git -C "${__dirname}" push`, { stdio: 'pipe' });
              } catch (e) {
                // Git might fail if nothing changed — that's fine
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405);
          res.end('POST only');
        }
      });

      // File upload endpoint
      server.middlewares.use('/api/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end('POST only');
          return;
        }

        const chunks = [];
        let totalSize = 0;

        req.on('data', chunk => {
          totalSize += chunk.length;
          if (totalSize > MAX_FILE_SIZE) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File exceeds 5MB limit' }));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });

        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const { taskId, fileName, data: fileData } = body;

            if (!taskId || !fileName || !fileData) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing taskId, fileName, or data' }));
              return;
            }

            // Create uploads directory for this task
            const uploadsDir = path.resolve(__dirname, 'public/uploads', taskId);
            fs.mkdirSync(uploadsDir, { recursive: true });

            // Decode base64 and save file
            const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = path.join(uploadsDir, safeName);
            fs.writeFileSync(filePath, buffer);

            // Build the URL path (relative to public/)
            const urlPath = `/charleys-angels/uploads/${taskId}/${safeName}`;
            const localPath = filePath;

            // Git add the uploaded file
            const { execSync } = require('child_process');
            try {
              execSync(`git -C "${__dirname}" add "public/uploads/${taskId}/${safeName}"`, { stdio: 'pipe' });
              execSync(`git -C "${__dirname}" commit -m "[dashboard] Attachment: ${safeName}"`, { stdio: 'pipe' });
              execSync(`git -C "${__dirname}" push`, { stdio: 'pipe' });
            } catch (e) {
              // Git commit might fail — that's ok
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, url: urlPath, localPath, fileName: safeName }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localSyncPlugin()],
  base: '/charleys-angels/',
})
