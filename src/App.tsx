/**
 * App.tsx · 路由表
 */
import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { zh } from '@/i18n/zh'
import { MapPage } from '@/routes/MapPage'
import { LevelPage } from '@/routes/LevelPage'
import { ResultPage } from '@/routes/ResultPage'
import { SettingsPage } from '@/routes/SettingsPage'

function NotFound() {
  return (
    <div className="app-shell grid min-h-[70dvh] place-items-center">
      <div className="card w-full p-6 text-center">
        <h1 className="text-[var(--t-h2)] font-extrabold">{zh.error.notFound}</h1>
        <Link to="/" className="btn btn-primary mt-4 w-full">
          {zh.nav.backToMap}
        </Link>
      </div>
    </div>
  )
}

export function App() {
  const location = useLocation()

  // 换页回到顶部，避免「打开新关卡却停在半页」
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <main>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/level/:levelId" element={<LevelPage />} />
        <Route path="/result/:levelId" element={<ResultPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}
