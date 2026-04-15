import { portfolioUrls } from '@portfolio/services'
import { AppFrame, ButtonSurface, PanelSurface, SectionIntro } from '@portfolio/ui-shell'

const capabilityRows = [
  {
    label: '초점',
    value: '게임 UI와 제품 셸',
  },
  {
    label: '기술',
    value: 'React, TypeScript, Vite, PixiJS',
  },
] as const

const stackGroups = [
  {
    title: 'Surface',
    summary: '브라우저에서 읽히는 화면과 정보 구조',
    items: ['React', 'TypeScript', 'Vite'],
  },
  {
    title: 'Runtime',
    summary: '게임 실행과 HUD, 오버레이, 배포까지',
    items: ['PixiJS', 'DOM overlay', 'Monorepo'],
  },
] as const

const projectCards = [
  {
    label: '슈팅',
    title: 'Amesato',
    summary: '브라우저 슈팅 게임. 플레이 감각과 화면 리듬을 다듬고 있습니다.',
    details: ['20-stage campaign', 'HUD tuned for play'],
    note: '슈팅 게임',
    href: portfolioUrls.amesato,
  },
  {
    label: '카드게임',
    title: 'Nulsight',
    summary: '브라우저 카드게임 프로젝트. 듀얼 화면과 outgame 구조를 함께 정리하고 있습니다.',
    details: ['TCG surface', 'deck + lobby flow'],
    note: 'TCG 웹게임',
    href: portfolioUrls.nulsight,
  },
] as const

export function HomePage() {
  return (
    <AppFrame as="main" innerClassName="page" maxWidth="1180px" gutter="48px">
      <section className="hero-stage" id="top">
        <div className="hero-stage__main">
          <SectionIntro
            className="hero-stage__intro"
            eyebrow="포트폴리오"
            title="한 레포 안에서 게임 화면과 제품 구조를 다듬습니다."
            titleAs="h1"
            description={
              <p className="lead lead--hero">
                <strong>Amesato</strong>, <strong>Nulsight</strong>, 공용 레이어를 함께 관리합니다.
              </p>
            }
            eyebrowClassName="kicker"
          />

          <div className="hero-actions">
            <ButtonSurface as="a" className="button" href={portfolioUrls.amesato} variant="solid">
              Amesato 플레이
            </ButtonSurface>
            <ButtonSurface as="a" className="button button--ghost" href={portfolioUrls.nulsight} variant="ghost">
              Nulsight 플레이
            </ButtonSurface>
          </div>

          <div className="signal-grid" aria-label="작업 성격">
            {capabilityRows.map((row) => (
              <article className="signal-card" key={row.label}>
                <p className="signal-card__label">{row.label}</p>
                <strong className="signal-card__value">{row.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <aside className="hero-stage__rail">
          <PanelSurface as="section" className="rail-panel rail-panel--dense">
            <p className="panel__label">바로가기</p>
            <dl className="facts">
              <div>
                <dt>Amesato</dt>
                <dd>
                  <a href={portfolioUrls.amesato}>{portfolioUrls.amesatoLabel}</a>
                </dd>
              </div>
              <div>
                <dt>Nulsight</dt>
                <dd>
                  <a href={portfolioUrls.nulsight}>{portfolioUrls.nulsightLabel}</a>
                </dd>
              </div>
              <div>
                <dt>GitHub</dt>
                <dd>
                  <a href={portfolioUrls.github}>Ketose333/ketose-portfolio</a>
                </dd>
              </div>
            </dl>
          </PanelSurface>
        </aside>
      </section>

      <section className="section" id="projects">
        <SectionIntro
          className="section__header"
          eyebrow="작업"
          title="지금 보는 두 작업"
          titleAs="h2"
          eyebrowClassName="kicker"
        />
        <div className="project-showcase">
          {projectCards.map((card) => (
            <PanelSurface as="article" className="project-panel" padding="lg" tone="strong" key={card.title}>
              <div className="project-panel__head">
                <p className="panel__label">{card.label}</p>
                <h3>{card.title}</h3>
              </div>
              <p className="project-panel__summary">{card.summary}</p>
              <ul className="detail-list">
                {card.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              <div className="project-panel__foot">
                <p className="project-panel__note">{card.note}</p>
                <ButtonSurface as="a" className="button button--ghost" href={card.href} variant="ghost">
                  열기
                </ButtonSurface>
              </div>
            </PanelSurface>
          ))}
        </div>
      </section>

      <section className="section section--split">
        <section className="section" id="system">
          <SectionIntro
            className="section__header"
            eyebrow="구조"
            title="같이 관리하는 층"
            titleAs="h2"
            eyebrowClassName="kicker"
          />
          <div className="stack-grid">
            {stackGroups.map((group) => (
              <PanelSurface as="article" className="panel panel--structured" key={group.title}>
                <h3>{group.title}</h3>
                <p className="panel__summary">{group.summary}</p>
                <ul className="chip-list">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </PanelSurface>
            ))}
          </div>
        </section>

        <section className="section" id="method">
          <SectionIntro
            className="section__header"
            eyebrow="원칙"
            title="작업 방식"
            titleAs="h2"
            eyebrowClassName="kicker"
          />
          <PanelSurface as="div" className="method-card">
            <div className="method-row">
              <span>1</span>
              <div>
                <strong>공용 구조, 분리된 분위기</strong>
                <p>같은 틀을 쓰되 프로젝트의 분위기는 나눕니다.</p>
              </div>
            </div>
            <div className="method-row">
              <span>2</span>
              <div>
                <strong>얇게 공유</strong>
                <p>셸과 프레임부터 공유하고 앱 고유 표면은 남겨 둡니다.</p>
              </div>
            </div>
          </PanelSurface>
        </section>
      </section>
    </AppFrame>
  )
}
