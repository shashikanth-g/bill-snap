import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only Vite plugin to serve /api/analyze without needing Vercel CLI
function analyzeApiPlugin(mode) {
  return {
    name: 'analyze-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''
        if (url !== '/api/analyze') {
          return next()
        }

        // Dynamically reload environment variables in case .env.local was added/updated
        const env = loadEnv(mode, process.cwd(), '')
        Object.assign(process.env, env)

        // Add Express/Vercel-like response helpers for handler compatibility
        res.status = function (code) {
          res.statusCode = code
          return res
        }

        res.json = function (obj) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }

        // Buffer and parse incoming JSON payload
        let rawBody = ''
        req.on('data', (chunk) => {
          rawBody += chunk
        })

        req.on('end', async () => {
          try {
            req.body = rawBody ? JSON.parse(rawBody) : {}
          } catch {
            return res.status(400).json({
              ok: false,
              code: 'bad_request',
              message: 'Invalid JSON request body.',
            })
          }

          try {
            const { default: handler } = await import('./api/analyze.js')
            await handler(req, res)
          } catch (err) {
            console.error('[Dev API Server Error]', err?.code || 'server_error')
            if (!res.writableEnded) {
              res.status(500).json({
                ok: false,
                code: 'server_error',
                message: 'Internal server error while processing bill.',
              })
            }
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Initial load of env files
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [react(), analyzeApiPlugin(mode)],
  }
})
