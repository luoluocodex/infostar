/**
 * routes/SettingsPage.tsx · 设置 / 存档导出导入
 * 无登录、无云同步：进度只在本机，可导出成一个小文件备份（主方案 §6.5）。
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { zh } from '@/i18n/zh'
import { useProgress } from '@/store/progress'
import { useSettings } from '@/store/settings'
import { AppHeader } from '@/components/common/primitives'
import { Icon } from '@/components/common/Icon'

const APP_VERSION = '0.1.0'

export function SettingsPage() {
  const navigate = useNavigate()
  const { ready, init, nickname, setNickname, exportArchive, importArchive, resetAll, storageKind, totalStars, maxStars } =
    useProgress()
  const haptics = useSettings((s) => s.haptics)
  const setHaptics = useSettings((s) => s.setHaptics)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [name, setName] = useState(nickname)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!ready) void init()
    useSettings.getState().init()
  }, [ready, init])

  useEffect(() => {
    setName(nickname)
  }, [nickname])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  const handleExport = async () => {
    const json = await exportArchive()
    if (!json) {
      setToast(zh.settings.exportEmpty)
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    const file = new File([json], `${zh.settings.exportFilePrefix}-${stamp}.json`, {
      type: 'application/json',
    })

    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean
      share?: (data: { files: File[]; title?: string }) => Promise<void>
    }
    // 手机上优先用系统分享（可以直接发给自己/家长）
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: zh.settings.shareTitle })
        setToast(zh.settings.shareDone)
        return
      } catch {
        /* 用户取消则退回下载 */
      }
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    setToast(zh.settings.fileDone)
  }

  const handleImport = async (f: File) => {
    const text = await f.text()
    const ok = await importArchive(text)
    setToast(ok ? zh.settings.importDone : zh.settings.importFail)
  }

  return (
    <div className="app-shell pt-[max(8px,env(safe-area-inset-top))]">
      <AppHeader title={zh.settings.title} subtitle={zh.settings.subtitle} onBack={() => navigate('/')} />

      <section className="card mb-4 p-4">
        <label className="mb-1.5 block text-[14px] font-bold" htmlFor="nickname">
          {zh.settings.nickname}
        </label>
        <div className="flex gap-2">
          <input
            id="nickname"
            value={name}
            maxLength={12}
            onChange={(e) => setName(e.target.value)}
            placeholder={zh.settings.nicknamePlaceholder}
            className="min-w-0 flex-1 rounded-[var(--r-md)] border-2 px-3 text-[16px]"
            style={{ borderColor: 'var(--c-line-strong)', background: 'var(--c-surface)', minHeight: 48 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              void setNickname(name.trim())
              setToast(zh.settings.saved)
            }}
          >
            {zh.settings.save}
          </button>
        </div>
        <p className="num mt-3 text-[13px] text-ink-soft">
          {zh.map.starsTotal(totalStars(), maxStars())}
        </p>
      </section>

      <section className="card mb-4 p-4">
        <div className="space-y-2.5">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => void handleExport()}
            data-testid="export-archive"
          >
            <Icon name="download" size={17} />
            {zh.settings.export}
          </button>
          <p className="text-[13px] text-ink-soft">{zh.settings.exportHint}</p>

          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => fileRef.current?.click()}
            data-testid="import-archive"
          >
            <Icon name="upload" size={17} />
            {zh.settings.import}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="card mb-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-bold">{zh.settings.hapticsTitle}</div>
            <div className="text-[13px] text-ink-soft">{zh.settings.hapticsHint}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={haptics}
            aria-label={zh.settings.hapticsTitle}
            onClick={() => setHaptics(!haptics)}
            className="tap-target grid shrink-0 place-items-center"
            style={{ width: 68, height: 48 }}
          >
            {/* 开关本体保持小巧，但整块 68×48 都是可点区域 */}
            <span
              className="relative block h-8 w-14 rounded-full transition-colors"
              style={{ background: haptics ? 'var(--c-brand)' : 'var(--c-line-strong)' }}
            >
              <motion.span
                className="absolute top-1 h-6 w-6 rounded-full bg-white"
                style={{ boxShadow: 'var(--sh-card)' }}
                animate={{ left: haptics ? 30 : 4 }}
                transition={{ duration: 0.2 }}
              />
            </span>
          </button>
        </div>
      </section>

      <section className="card mb-4 p-4">
        <button
          type="button"
          className="flex w-full items-center text-left text-[15px] font-bold"
          style={{ color: 'var(--c-danger)', minHeight: 'var(--h-tap)' }}
          onClick={() => setConfirmReset((v) => !v)}
          data-testid="reset-progress"
        >
          {zh.settings.reset}
        </button>
        <p className="mt-1 text-[13px] text-ink-soft">{zh.settings.resetWarn}</p>
        {confirmReset && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn flex-1"
              style={{ background: 'var(--c-danger)', color: '#fff' }}
              onClick={() => {
                void resetAll()
                setConfirmReset(false)
                setToast(zh.settings.resetDone)
              }}
            >
              {zh.settings.resetConfirm}
            </button>
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
              {zh.settings.cancel}
            </button>
          </div>
        )}
      </section>

      <section className="card mb-4 p-4">
        <h2 className="mb-1.5 text-[15px] font-bold">{zh.settings.about}</h2>
        <p className="text-[14px] leading-relaxed text-ink-soft">{zh.settings.aboutText}</p>
        <p className="mt-2 text-[12px] text-ink-faint">
          {zh.settings.storage(storageKind === 'indexeddb' ? zh.settings.storageIndexedDB : zh.settings.storageLocal)}
        </p>
        <p className="num text-[12px] text-ink-faint">{zh.settings.version(APP_VERSION)}</p>
      </section>

      {toast && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2.5 text-[14px] font-bold text-white"
          style={{ background: 'var(--c-ink)', maxWidth: '88vw' }}
          role="status"
        >
          {toast}
        </motion.p>
      )}
    </div>
  )
}
