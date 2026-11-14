import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import net from 'net'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Custom Vite Plugin to automatically detect and launch the FastAPI backend
 * whenever the frontend development server starts.
 */
function autoStartBackendPlugin(backendPort = 8000, backendHost = '127.0.0.1') {
  let backendProcess = null
  let checked = false

  return {
    name: 'auto-start-backend',
    configureServer(server) {
      if (checked) return
      checked = true

      const socket = new net.Socket()
      socket.setTimeout(1200)

      const startBackend = () => {
        socket.destroy()
        console.log('\x1b[33m%s\x1b[0m', `⚡ [AgriSense AI] Backend not detected on port ${backendPort}. Auto-starting FastAPI backend...`)

        const backendDir = path.resolve(__dirname, '../backend')
        const isWin = process.platform === 'win32'
        const venvPythonWin = path.join(backendDir, 'venv', 'Scripts', 'python.exe')
        const venvPythonUnix = path.join(backendDir, 'venv', 'bin', 'python')

        let pythonCmd = 'python'
        if (isWin && fs.existsSync(venvPythonWin)) {
          pythonCmd = venvPythonWin
        } else if (fs.existsSync(venvPythonUnix)) {
          pythonCmd = venvPythonUnix
        }

        try {
          backendProcess = spawn(
            pythonCmd,
            ['-m', 'uvicorn', 'app.main:app', '--host', backendHost, '--port', String(backendPort), '--reload'],
            {
              cwd: backendDir,
              stdio: 'inherit',
              shell: false
            }
          )

          backendProcess.on('error', (err) => {
            console.error('\x1b[31m%s\x1b[0m', `[AgriSense AI] Failed to auto-start backend: ${err.message}`)
          })

          console.log('\x1b[32m%s\x1b[0m', `✔ [AgriSense AI] FastAPI backend started automatically on port ${backendPort} (PID: ${backendProcess.pid})`)
        } catch (err) {
          console.error('\x1b[31m%s\x1b[0m', `[AgriSense AI] Error auto-starting backend: ${err.message}`)
        }
      }

      socket.on('connect', () => {
        console.log('\x1b[32m%s\x1b[0m', `✔ [AgriSense AI] FastAPI backend is already active on http://${backendHost}:${backendPort}`)
        socket.destroy()
      })

      socket.on('timeout', () => {
        startBackend()
      })

      socket.on('error', () => {
        startBackend()
      })

      socket.connect(backendPort, backendHost)

      const cleanup = () => {
        if (backendProcess && !backendProcess.killed && backendProcess.pid) {
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'])
            } else {
              backendProcess.kill('SIGTERM')
            }
          } catch (_) {}
        }
      }

      process.on('exit', cleanup)
      process.on('SIGINT', () => {
        cleanup()
        process.exit()
      })
      process.on('SIGTERM', () => {
        cleanup()
        process.exit()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = parseInt(env.VITE_PORT || '5173', 10)
  const backendPort = parseInt(env.VITE_BACKEND_PORT || '8000', 10)
  const backendHost = env.VITE_BACKEND_HOST || '127.0.0.1'
  const backendTarget = env.VITE_API_BASE_URL || `http://${backendHost}:${backendPort}`

  return {
    plugins: [react(), autoStartBackendPlugin(backendPort, backendHost)],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  }
})

