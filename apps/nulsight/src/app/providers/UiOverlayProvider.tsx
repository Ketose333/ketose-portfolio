import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ActionDialog } from '../components/ActionDialog'

declare global {
  interface Window {
    BP_ALERT?: {
      confirm: (text: string, title?: string, opts?: Record<string, unknown>) => Promise<boolean>
      alert: (text: string, title?: string, opts?: Record<string, unknown>) => Promise<void>
      info: (text: string, title?: string, opts?: Record<string, unknown>) => Promise<void>
      prompt: (text: string, title?: string, opts?: Record<string, unknown>) => Promise<string | null>
    }
    BP_LOADING?: {
      show: (message?: string, opts?: Record<string, unknown>) => void
      hide: () => void
    }
  }
}

type OverlayDialogMode = 'alert' | 'confirm' | 'prompt'

type OverlayDialogState = {
  open: boolean
  mode: OverlayDialogMode
  title: string
  text: string
  inputValue: string
  inputPlaceholder: string
  resolve: (value: boolean | string | null | void) => void
}

type LoadingState = {
  visible: boolean
  message: string
}

const DEFAULT_DIALOG_STATE: OverlayDialogState = {
  open: false,
  mode: 'alert',
  title: '알림',
  text: '',
  inputValue: '',
  inputPlaceholder: '',
  resolve: () => {},
}

function lockViewport(active: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (active) {
    root.setAttribute('data-nulsight-provider-overlay-lock', '1')
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return
  }
  root.removeAttribute('data-nulsight-provider-overlay-lock')
  root.style.overflow = ''
  document.body.style.overflow = ''
}

export function UiOverlayProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<OverlayDialogState>(DEFAULT_DIALOG_STATE)
  const [loading, setLoading] = useState<LoadingState>({ visible: false, message: '불러오는 중' })
  const previousAlertRef = useRef<Window['BP_ALERT'] | undefined>(undefined)
  const previousLoadingRef = useRef<Window['BP_LOADING'] | undefined>(undefined)

  useEffect(() => {
    previousAlertRef.current = window.BP_ALERT
    previousLoadingRef.current = window.BP_LOADING

    window.BP_ALERT = {
      confirm: (text, title = '확인') =>
        new Promise<boolean>((resolve) => {
          setDialog({
            open: true,
            mode: 'confirm',
            title,
            text,
            inputValue: '',
            inputPlaceholder: '',
            resolve: (value) => resolve(Boolean(value)),
          })
        }),
      alert: (text, title = '알림') =>
        new Promise<void>((resolve) => {
          setDialog({
            open: true,
            mode: 'alert',
            title,
            text,
            inputValue: '',
            inputPlaceholder: '',
            resolve: () => resolve(),
          })
        }),
      info: (text, title = '알림') =>
        new Promise<void>((resolve) => {
          setDialog({
            open: true,
            mode: 'alert',
            title,
            text,
            inputValue: '',
            inputPlaceholder: '',
            resolve: () => resolve(),
          })
        }),
      prompt: (text, title = '입력', opts = {}) =>
        new Promise<string | null>((resolve) => {
          setDialog({
            open: true,
            mode: 'prompt',
            title,
            text,
            inputValue: String(opts.inputValue || ''),
            inputPlaceholder: String(opts.inputPlaceholder || ''),
            resolve: (value) => resolve(typeof value === 'string' ? value : null),
          })
        }),
    }

    window.BP_LOADING = {
      show: (message = '불러오는 중') => {
        setLoading({ visible: true, message: String(message || '불러오는 중') })
      },
      hide: () => {
        setLoading((current) => (current.visible ? { ...current, visible: false } : current))
      },
    }

    return () => {
      if (previousAlertRef.current) window.BP_ALERT = previousAlertRef.current
      else delete window.BP_ALERT
      if (previousLoadingRef.current) window.BP_LOADING = previousLoadingRef.current
      else delete window.BP_LOADING
    }
  }, [])

  useEffect(() => {
    lockViewport(dialog.open || loading.visible)
    return () => {
      lockViewport(false)
    }
  }, [dialog.open, loading.visible])

  function closeDialog(result?: boolean | string | null) {
    const resolve = dialog.resolve
    setDialog(DEFAULT_DIALOG_STATE)
    resolve(result)
  }

  return (
    <>
      {children}

      <ActionDialog
        open={dialog.open}
        kicker={dialog.mode === 'prompt' ? '입력' : '알림'}
        title={dialog.title}
        description={dialog.text}
        confirmLabel={dialog.mode === 'alert' ? '확인' : dialog.mode === 'confirm' ? '확인' : '입력'}
        cancelLabel={dialog.mode === 'alert' ? null : '취소'}
        onConfirm={(value) => closeDialog(dialog.mode === 'prompt' ? value ?? '' : true)}
        onCancel={() => closeDialog(dialog.mode === 'alert' ? undefined : null)}
        inputLabel={dialog.mode === 'prompt' ? '입력' : undefined}
        inputPlaceholder={dialog.mode === 'prompt' ? dialog.inputPlaceholder : undefined}
        defaultValue={dialog.mode === 'prompt' ? dialog.inputValue : ''}
        backdropClassName="nulsight-dialog-backdrop nulsight-dialog-backdrop--system"
        dialogClassName="nulsight-dialog nulsight-dialog--system"
      />

      <div
        className={`nulsight-loading-backdrop${loading.visible ? '' : ' hidden'}`}
        aria-hidden={loading.visible ? 'false' : 'true'}
      >
        <section className="nulsight-loading-panel" aria-live="polite" role="status">
          <div className="bp-loading__spinner" aria-hidden="true" />
          <div className="nulsight-loading-panel__text">{loading.message}</div>
        </section>
      </div>
    </>
  )
}
