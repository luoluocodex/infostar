/**
 * main.tsx · 入口
 * PWA 采用「渐进增强」：只有在安全上下文（https，或本机 localhost）才注册 Service Worker；
 * 走 HTTP 入口时静默跳过，不报错、不弹警告、不影响任何闯关功能（主方案 §9.3）。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './styles/index.css'

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 离线能力是加分项，注册失败不影响使用 */
    })
  })
}
