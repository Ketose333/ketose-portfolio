import { useState } from 'react'
import { portfolioProjectServices, portfolioServiceList, portfolioUrls } from '@portfolio/services'
import { AppFrame, ButtonSurface, SectionIntro, SectionPanel } from '@portfolio/ui-shell'

const projectDetails = {
  wizletBudget: {
    role: '실시간 협업 가계부',
    summary: 'React/Vite 프론트와 Spring Boot 백엔드로 예산과 지출 기록을 연결했습니다.',
    points: ['React + Vite', 'Spring Boot', 'WebSocket'],
  },
  nulsight: {
    role: '웹 TCG 클라이언트',
    summary: '로비, 덱 편집, 덱허브, 듀얼 화면을 하나의 웹 TCG 프로토타입으로 묶었습니다.',
    points: ['Lobby', 'Deck Builder', 'Duel Surface'],
  },
    role: '브라우저 슈팅 게임',
    summary: 'PixiJS 캔버스 게임 위에 React HUD와 오버레이를 얹었습니다.',
    points: ['20 Stages', 'Canvas + Overlay', 'Game HUD'],
  },
} as const

const projectCards = portfolioProjectServices.map((service) => ({
  id: service.id,
  title: service.name,
  href: service.url,
  repositoryHref: service.repositoryUrl,
  metric: service.timelineLabel,
  ...projectDetails[service.id],
}))

const capabilityDemos = [
  {
    id: 'motion',
    label: '전환',
    title: '선택 상태',
    body: 'hover, focus, 선택 상태를 CSS 토큰으로 분리하고 reduced-motion에서는 전환을 줄였습니다.',
    points: ['Hover', 'Focus', 'Reduced Motion'],
  },
  {
    id: 'overlay',
    label: '오버레이',
    title: '게임 오버레이',
    body: '캔버스는 게임에 맡기고, HUD와 모달은 DOM 표면으로 분리했습니다.',
    points: ['HUD', 'Modal Surface'],
  },
  {
    id: 'shared',
    label: '공용 UI',
    title: '공유 패키지',
    body: 'theme, ui-shell, services를 공용 패키지로 두고 앱별 규칙은 각 앱에 남겼습니다.',
    points: ['Theme Tokens', 'ui-shell', 'Service Registry'],
  },
] as const

const stackGroups = [
  {
    title: 'Frontend',
    items: ['React', 'TypeScript', 'Vite', 'CSS'],
  },
  {
    title: 'Game UI',
    items: ['PixiJS', 'DOM Overlay', 'Keyboard Flow', 'Responsive Layout'],
  },
  {
    title: 'Repo/Deploy',
    items: ['Shared Shell', 'Standalone App', 'Service Registry'],
  },
] as const

type ProjectCard = (typeof projectCards)[number]
type CapabilityDemo = (typeof capabilityDemos)[number]

export function HomePage() {
  const [activeProject, setActiveProject] = useState<ProjectCard>(projectCards[0])
  const [activeDemo, setActiveDemo] = useState<CapabilityDemo>(capabilityDemos[0])

  return (
    <AppFrame as="main" innerClassName="page">
      <section className="hero" id="top">
        <div className="hero__copy">
          <p className="kicker">작업 인덱스</p>
          <h1>바로 열 수 있는 작업</h1>
          <p className="lead lead--hero">
            웹으로 배포한 작업을 개발 순서대로 정리했습니다.
          </p>
          <div className="hero-actions">
            {projectCards.map((project, index) => (
              <ButtonSurface
                as="a"
                className={`button${index === 0 ? '' : ' button--ghost'}`}
                href={project.href}
                key={project.id}
                variant={index === 0 ? 'solid' : 'ghost'}
              >
                {project.title} 열기
              </ButtonSurface>
            ))}
          </div>
          <div className="hero-projects" aria-label="대표 작업">
            {projectCards.map((project) => (
              <a className={`hero-project hero-project--${project.id}`} href={project.href} key={project.id}>
                <span className="hero-project__status">{project.metric}</span>
                <strong>{project.title}</strong>
                <span>{project.role}</span>
                <p>{project.summary}</p>
                <span className="hero-project__cta">열기</span>
              </a>
            ))}
          </div>
        </div>

        <SectionPanel as="aside" className="access-panel" aria-label="포트폴리오 접근 링크">
          <div className="access-panel__top">
            <span>접근</span>
            <a href={portfolioUrls.github}>GitHub</a>
          </div>
          <dl className="service-list">
            {portfolioServiceList.map((service) => (
              <div className="service-list__row" key={service.id}>
                <dt>{service.name}</dt>
                <dd>
                  <a href={service.url}>{service.host}</a>
                </dd>
              </div>
            ))}
          </dl>
        </SectionPanel>
      </section>

      <section className="section" id="projects">
        <SectionIntro
          className="section__header"
          eyebrow="작업"
          title="작업별 확인 지점"
          titleAs="h2"
          titleClassName="ui-title-ko"
          eyebrowClassName="kicker"
          descriptionClassName="ui-copy-ko"
          description={<p className="lead">각 프로젝트에서 직접 확인할 화면과 레포를 먼저 둡니다.</p>}
        />
        <div className="project-lab">
          <div className="project-tabs" aria-label="프로젝트 선택">
            {projectCards.map((project) => (
              <button
                aria-pressed={activeProject.id === project.id}
                className="project-tab"
                key={project.id}
                onClick={() => setActiveProject(project)}
                type="button"
              >
                <span>{project.title}</span>
                <strong>{project.role}</strong>
              </button>
            ))}
          </div>

          <SectionPanel as="article" className={`project-preview project-preview--${activeProject.id}`}>
            <div className="project-preview__body">
              <p className="project-preview__eyebrow">{activeProject.metric}</p>
              <h3>{activeProject.title}</h3>
              <p>{activeProject.summary}</p>
              <ul className="chip-list">
                {activeProject.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <ButtonSurface as="a" className="button button--ghost" href={activeProject.href} variant="ghost">
                프로젝트 열기
              </ButtonSurface>
              {activeProject.repositoryHref ? (
                <ButtonSurface as="a" className="button button--ghost" href={activeProject.repositoryHref} variant="ghost">
                  레포 보기
                </ButtonSurface>
              ) : null}
            </div>
            <div className="project-preview__visual" aria-label={`${activeProject.title} 확인 항목`}>
              {activeProject.points.map((point, index) => (
                <span className="preview-row" key={point}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{point}</strong>
                </span>
              ))}
            </div>
          </SectionPanel>
        </div>
      </section>

      <section className="section" id="demo">
        <SectionIntro
          className="section__header"
          eyebrow="구현"
          title="웹에서 보여줄 수 있는 것"
          titleAs="h2"
          titleClassName="ui-title-ko"
          eyebrowClassName="kicker"
          descriptionClassName="ui-copy-ko"
          description={<p className="lead">화면에서 확인 가능한 구현 단위만 남겼습니다.</p>}
        />
        <div className="demo-grid">
          <div className="demo-tabs" aria-label="웹 기능 선택">
            {capabilityDemos.map((demo) => (
              <button
                aria-pressed={activeDemo.id === demo.id}
                className="demo-tab"
                key={demo.id}
                onClick={() => setActiveDemo(demo)}
                type="button"
              >
                {demo.label}
              </button>
            ))}
          </div>
          <SectionPanel as="article" className={`demo-stage demo-stage--${activeDemo.id}`}>
            <div className="demo-stage__copy">
              <p className="demo-stage__label">{activeDemo.label}</p>
              <h3>{activeDemo.title}</h3>
              <p>{activeDemo.body}</p>
              <ul className="chip-list">
                {activeDemo.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="demo-stage__signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </SectionPanel>
        </div>
      </section>

      <section className="section section--system" id="system">
        <SectionIntro
          className="section__header"
          eyebrow="구조"
          title="공유 구조"
          titleAs="h2"
          titleClassName="ui-title-ko"
          eyebrowClassName="kicker"
          descriptionClassName="ui-copy-ko"
          description={<p className="lead">공통 토큰과 셸은 상위에 두고, 게임 규칙과 화면 로직은 앱 안에 남겼습니다.</p>}
        />
        <div className="stack-grid">
          {stackGroups.map((group) => (
            <article className="stack-group" key={group.title}>
              <h3>{group.title}</h3>
              <ul className="chip-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
