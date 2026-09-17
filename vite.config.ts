import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  for (const [name, value] of Object.entries(env)) {
    let role = ''
    try { role = JSON.parse(Buffer.from(value.split('.')[1] || '', 'base64url').toString()).role } catch { /* Not a JWT */ }
    if (value.startsWith('sb_secret_') || role === 'service_role' || /SECRET|SERVICE_ROLE|PASSWORD|TOKEN/.test(name)) throw new Error(`Private credentials must not be exposed through ${name}.`)
  }
  return { plugins: [react()], base: './', server: { host: '127.0.0.1', port: 5173, strictPort: true } }
})
