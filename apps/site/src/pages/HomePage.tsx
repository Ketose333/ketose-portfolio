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

const heroLinks = [
  { label: 'Amesato', value: portfolioUrls.amesatoLabel, href: portfolioUrls.amesato },
  { label: 'Nulsight', value: portfolioUrls.nulsightLabel, href: portfolioUrls.nulsight },
  { label: 'GitHub', value: 'Ketose333/ketose-portfolio', href: portfolioUrls.github },
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
    title: 'Amesato',
    summary: '20스테이지 캠페인 슈팅. HUD와 플레이 리듬을 함께 조정 중.',
    details: ['20-stage campaign', 'HUD tuned for play'],
    note: '슈팅 게임',
    href: portfolioUrls.amesato,
  },
  {
    title: 'Nulsight',
    summary: 'TCG 표면과 outgame(덱·로비)을 한 셸 위에 묶는 중.',
    details: ['TCG surface', 'deck + lobby flow'],
    note: 'TCG 웹게임',
    href: portfolioUrls.nulsight,
  },
] as const

const methodRows = [
  {
    title: '공용 구조, 분리된 분위기',
    body: '같은 틀을 쓰되 프로젝트의 분위기는 나눕니다.',
  },
  {
    title: '얇게 공유, 표면은 따로',
    body: '셸과 프레임부터 공유하고 앱 고유 표면은 남겨 둡니다.',
  },
  {
    title: '복붙보다 책임 위치',
    body: '공용화는 코드를 줄이기보다 책임을 어디에 둘지 결정하는 일에 가깝습니다.',
  },
  {
    title: '레이아웃부터',
    body: 'UI는 줄바꿈·여백·정보 위계, 그리고 실제 사용 흐름 순으로 봅니다.',
  },
] as const

export function HomePage() {
  return (
    <AppFrame as="main" innerClassName="page" maxWidth="1180px" gutter="48px">
      <section className="hero" id="top">
        <SectionIntro
          className="hero__intro"
          title="게임 두 개와 그 사이를 짭니다."
          titleAs="h1"
          description={
            <p className="lead lead--hero">
              <strong>Amesato</strong>와 <strong>Nulsight</strong>, 그리고 둘이 같이 쓰는 셸·프레임·서비스 레이어.
            </p>
          }
        />

        <div className="hero-actions">
          <ButtonSurface as="a" className="button" href={portfolioUrls.amesato} variant="solid">
            Amesato 플레이
          </ButtonSurface>
          <ButtonSurface as="a" className="button button--ghost" href={portfolioUrls.nulsight} variant="ghost">
            Nulsight 플레이
          </ButtonSurface>
        </div>

        <dl className="signal-list" aria-label="작업 성격">
          {capabilityRows.map((row) => (
            <div className="signal-list__row" key={row.label}>
              <dt className="signal-list__label">{row.label}</dt>
              <dd className="signal-list__value">{row.value}</dd>
            </div>
          ))}
        </dl>

        <dl className="hero-links" aria-label="바로가기">
          {heroLinks.map((link) => (
            <div className="hero-links__row" key={link.label}>
              <dt className="hero-links__label">{link.label}</dt>
              <dd className="hero-links__value">
                <a href={link.href}>{link.value}</a>
              </dd>
            </div>
          ))}
        </dl>
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
            <PanelSurface as="article" className="project-panel" key={card.title}>
              <h3 className="project-panel__title">{card.title}</h3>
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
        <section className="section section--unboxed" id="system">
          <SectionIntro
            className="section__header"
            eyebrow="구조"
            title="같이 관리하는 층"
            titleAs="h2"
            eyebrowClassName="kicker"
          />
          <div className="stack-grid">
            {stackGroups.map((group) => (
              <article className="stack-group" key={group.title}>
                <h3 className="stack-group__title">{group.title}</h3>
                <p className="stack-group__summary">{group.summary}</p>
                <ul className="chip-list">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--unboxed" id="method">
          <SectionIntro
            className="section__header"
            eyebrow="원칙"
            title="작업 방식"
            titleAs="h2"
            eyebrowClassName="kicker"
          />
          <ol className="method-list">
            {methodRows.map((row, index) => (
              <li className="method-row" key={row.title}>
                <span className="method-row__num">{index + 1}</span>
                <div className="method-row__body">
                  <strong>{row.title}</strong>
                  <p>{row.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </AppFrame>
  )
}
