import { useBgmTrack } from '../app/audio/useBgmTrack'
import { useIsMobileBlocked } from '../app/hooks/useIsMobileBlocked'
import { useBootConfigStore } from '../app/store/useBootConfigStore'
import { Link } from 'react-router-dom'
import { gameplayTerminology } from '../content/terminology'
import { Panel } from '../components/ui/Panel'

const playGuideSection = {
  title: gameplayTerminology.guideLabels.playTitle,
  body: [
    `좌우 이동으로 ${gameplayTerminology.playerLabel}를 움직입니다. 시작과 샷은 ${gameplayTerminology.controls.shotKeyLabel}, 휘두르기와 슬라이드는 ${gameplayTerminology.controls.focusKeyLabel}, 폭탄은 ${gameplayTerminology.controls.bombKeyLabel}, 일시정지는 ${gameplayTerminology.controls.pauseKeyLabel}, 재시작은 ${gameplayTerminology.controls.restartKeyLabel}로 처리합니다.`,
    `직접 사격보다 ${gameplayTerminology.orbLabel}의 반사와 방향 관리가 핵심이며, 바닥과 벽, 범퍼에 반사되지만 몸으로 그냥 받으면 피격됩니다.`,
    `휘두르기와 슬라이드 뒤에는 짧은 연계 창이 열리고, 그때 다시 입력하면 특수 반사로 이어집니다. 폭탄은 탄을 지우고 기본 스테이지 또는 보스에게 직접 압박을 줍니다.`,
  ],
}

export function GuidePage() {
  const bgmEnabled = useBootConfigStore((state) => state.bgmEnabled)
  const isMobileBlocked = useIsMobileBlocked()
  useBgmTrack('title', bgmEnabled)

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="play-shell p-4">
        <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <Panel eyebrow={gameplayTerminology.guideLabels.eyebrow}>
            <div className="space-y-3 text-sm leading-6 text-app-muted">
              <Link
                to="/"
                className="title-menu__item block px-4 py-3 text-center text-sm tracking-[0.2em] uppercase"
              >
                {gameplayTerminology.menuLabels.backToTitle}
              </Link>
            </div>
          </Panel>

          <div className="grid gap-4">
            {isMobileBlocked ? (
              <Panel
                eyebrow={gameplayTerminology.guideLabels.eyebrow}
                title={gameplayTerminology.platformLabels.mobileBlockedTitle}
              >
                <p className="text-sm leading-7 text-app-muted">
                  {gameplayTerminology.platformLabels.mobileBlockedBody}
                </p>
              </Panel>
            ) : null}
            <Panel
              eyebrow={gameplayTerminology.guideLabels.eyebrow}
              title={playGuideSection.title}
            >
              <div className="grid max-w-[72ch] gap-4 text-sm leading-7 text-app-muted">
                {playGuideSection.body.map((paragraph) => (
                  <p key={paragraph} className="m-0 text-pretty break-keep">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </div>
  )
}
