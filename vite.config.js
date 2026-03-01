import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Local API plugin — writes dashboard data back to tasks.json (dev only)
function localSyncPlugin() {
  return {
    name: 'local-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'public/data/tasks.json');
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

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
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localSyncPlugin()],
  base: '/charleys-angels/',
})
