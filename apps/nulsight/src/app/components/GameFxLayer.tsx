import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Application, Graphics } from 'pixi.js'

type GameFxLayerProps = {
  surfaceRef: RefObject<HTMLElement | null>
}

type Box = {
  x: number
  y: number
  width: number
  height: number
  cx: number
  cy: number
}

function measureBox(target: Element, rootRect: DOMRect): Box | null {
  if (!(target instanceof HTMLElement)) {
    return null
  }
  const rect = target.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }
  return {
    x: rect.left - rootRect.left,
    y: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
    cx: rect.left - rootRect.left + rect.width / 2,
    cy: rect.top - rootRect.top + rect.height / 2,
  }
}

function measureMany(root: HTMLElement, selector: string) {
  const rootRect = root.getBoundingClientRect()
  return Array.from(root.querySelectorAll(selector))
    .map((node) => measureBox(node, rootRect))
    .filter((value): value is Box => value !== null)
}

export function GameFxLayer({ surfaceRef }: GameFxLayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const surface = surfaceRef.current
    if (!host || !surface) {
      return
    }

    let disposed = false
    let rafId = 0
    let app: Application | null = null
    let glowLayer: Graphics | null = null
    let lineLayer: Graphics | null = null

    async function mount() {
      const nextApp = new Application()
      await nextApp.init({
        resizeTo: host,
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      })

      if (disposed) {
        nextApp.destroy()
        return
      }

      app = nextApp
      glowLayer = new Graphics()
      lineLayer = new Graphics()
      app.stage.addChild(lineLayer, glowLayer)
      host.appendChild(app.canvas)

      const draw = () => {
        if (disposed || !app || !glowLayer || !lineLayer || !surfaceRef.current) {
          return
        }

        const root = surfaceRef.current
        const now = performance.now() / 1000
        const pulse = 0.45 + (Math.sin(now * 3.6) + 1) * 0.18
        const rootRect = root.getBoundingClientRect()

        app.renderer.resize(rootRect.width, rootRect.height)
        glowLayer.clear()
        lineLayer.clear()

        const selectable = measureMany(root, '.slot.targetable')
        const selectedTargets = measureMany(root, '.slot.target-picked')
        const selectedAttackers = measureMany(root, '.slot.attacker-picked')
        const selectedHand = measureMany(root, '.hand-card.sel')

        for (const box of selectable) {
          glowLayer
            .rect(box.x - 3, box.y - 3, box.width + 6, box.height + 6)
            .stroke({ width: 2, color: 0x83c6ff, alpha: 0.34 + pulse * 0.2 })
          glowLayer
            .rect(box.x + 1, box.y + 1, box.width - 2, box.height - 2)
            .fill({ color: 0x83c6ff, alpha: 0.04 + pulse * 0.03 })
        }

        for (const box of selectedHand) {
          glowLayer
            .rect(box.x - 5, box.y - 7, box.width + 10, box.height + 10)
            .stroke({ width: 3, color: 0xf7f4d9, alpha: 0.78 })
          glowLayer
            .rect(box.x, box.y + box.height - 18, box.width, 18)
            .fill({ color: 0xf7f4d9, alpha: 0.08 })
        }

        for (const box of selectedAttackers) {
          glowLayer
            .rect(box.x - 4, box.y - 4, box.width + 8, box.height + 8)
            .stroke({ width: 3, color: 0xffd67b, alpha: 0.92 })
          glowLayer
            .rect(box.x + 2, box.y + 2, box.width - 4, box.height - 4)
            .stroke({ width: 1, color: 0xfff2b5, alpha: 0.8 })
        }

        for (const box of selectedTargets) {
          glowLayer
            .rect(box.x - 4, box.y - 4, box.width + 8, box.height + 8)
            .stroke({ width: 3, color: 0x9be8ff, alpha: 0.96 })
          glowLayer
            .rect(box.x + 3, box.y + 3, box.width - 6, box.height - 6)
            .stroke({ width: 1, color: 0xffffff, alpha: 0.9 })
        }

        const attacker = selectedAttackers[0]
        const target = selectedTargets[0]
        if (attacker && target) {
          lineLayer
            .moveTo(attacker.cx, attacker.cy)
            .lineTo(target.cx, target.cy)
            .stroke({ width: 3, color: 0xfff1ae, alpha: 0.95 })
          lineLayer.circle(attacker.cx, attacker.cy, 7).fill({ color: 0xffd67b, alpha: 0.88 })
          lineLayer.circle(target.cx, target.cy, 8).stroke({ width: 3, color: 0x9be8ff, alpha: 0.96 })
        } else if (attacker) {
          const directNode = root.querySelector('#oppAttackPanel:not(:disabled)')
          const directBox = directNode ? measureBox(directNode, rootRect) : null
          if (directBox) {
            lineLayer
              .moveTo(attacker.cx, attacker.cy)
              .lineTo(directBox.cx, directBox.cy)
              .stroke({ width: 3, color: 0xfff1ae, alpha: 0.9 })
            lineLayer.circle(attacker.cx, attacker.cy, 7).fill({ color: 0xffd67b, alpha: 0.88 })
            lineLayer.circle(directBox.cx, directBox.cy, 8).stroke({ width: 3, color: 0xffffff, alpha: 0.92 })
          }
        }

        rafId = window.requestAnimationFrame(draw)
      }

      rafId = window.requestAnimationFrame(draw)
    }

    void mount()

    return () => {
      disposed = true
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      if (app) {
        app.destroy()
      }
      host.querySelector('canvas')?.remove()
    }
  }, [surfaceRef])

  return <div ref={hostRef} className="game-fx-layer" aria-hidden="true" />
}
