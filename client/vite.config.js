import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolveApiConfig } from './src/services/config.js'

export default defineConfig(({ command, mode }) => {
  resolveApiConfig(loadEnv(mode, process.cwd(), 'VITE_'), command === 'build')
  return { plugins: [react(), tailwindcss()], server: { port: 5173 } }
})
