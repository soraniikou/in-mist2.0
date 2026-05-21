import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  console.error('[in-mist] #root 要素が見つかりません')
} else {
  window.addEventListener('error', (e) => {
    console.error('[in-mist] 未捕捉エラー:', e.error ?? e.message)
  })
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[in-mist] 未処理の Promise 拒否:', e.reason)
  })

  try {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (err) {
    console.error('[in-mist] マウント失敗:', err)
    rootEl.innerHTML =
      '<p style="color:#7dd3fc;padding:2rem;font-family:serif">起動できませんでした。</p>'
  }
}
