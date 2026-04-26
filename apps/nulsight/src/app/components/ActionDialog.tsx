import { useEffect, useRef, useState } from 'react'
import { ButtonSurface } from '@portfolio/ui-shell'

type ActionDialogProps = {
  open: boolean
  kicker?: string
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string | null
  onConfirm: (value?: string) => void
  onCancel: () => void
  inputLabel?: string
  inputPlaceholder?: string
  defaultValue?: string
  maxLength?: number
  backdropClassName?: string
  dialogClassName?: string
}

export function ActionDialog({
  open,
  kicker = 'ACTION',
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  inputLabel,
  inputPlaceholder,
  defaultValue = '',
  maxLength,
  backdropClassName = 'nulsight-dialog-backdrop',
  dialogClassName = 'nulsight-dialog',
}: ActionDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setValue(defaultValue)
  }, [defaultValue, open])

  useEffect(() => {
    if (!open || !inputRef.current) {
      return
    }
    inputRef.current.focus()
    inputRef.current.select()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    document.body.classList.add('nulsight-game-overlay-open')
    return () => {
      document.body.classList.remove('nulsight-game-overlay-open')
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className={backdropClassName} onClick={onCancel} role="presentation">
      <section
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nulsight-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nulsight-panel__head">
          <p className="nulsight-kicker">{kicker}</p>
          <h2 className="nulsight-section-title" id="nulsight-dialog-title">
            {title}
          </h2>
        </div>

        {description ? <p className="nulsight-status">{description}</p> : null}

        {inputLabel ? (
          <label className="nulsight-label">
            <span>{inputLabel}</span>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={inputPlaceholder}
              maxLength={maxLength}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onConfirm(value.trim())
                }
              }}
            />
          </label>
        ) : null}

        <div className="nulsight-actions nulsight-actions--compact">
          {cancelLabel ? (
            <ButtonSurface className="nulsight-button" type="button" onClick={onCancel}>
              {cancelLabel}
            </ButtonSurface>
          ) : null}
          <ButtonSurface
            className="nulsight-button nulsight-button--primary"
            type="button"
            onClick={() => onConfirm(inputLabel ? value.trim() : undefined)}
            variant="solid"
          >
            {confirmLabel}
          </ButtonSurface>
        </div>
      </section>
    </div>
  )
}
