import { useState } from 'react'
import { portfolioProjectServices, portfolioServiceList, portfolioUrls } from '@portfolio/services'
import { AppFrame, ButtonSurface, SectionIntro, SectionPanel } from '@portfolio/ui-shell'

const projectDetails = {
  wizletBudget: {
    role: 'API 연동 협업 가계부',
    summary: 'React/Vite 화면에서 Spring Boot API와 예산, 지출 데이터 흐름을 연결했습니다.',
    points: ['REST API', 'Data Flow', 'WebSocket'],
  },
  nulsight: {
    role: '상태 기반 인터랙티브 UI',
    summary: '로비, 덱 편집, 덱허브, 진행 화면의 선택 상태와 화면 흐름을 React/Vite로 묶었습니다.',
    points: ['State Flow', 'Deck Builder', 'UI Flow'],
  },
    role: 'Canvas/DOM UI 분리',
    summary: 'PixiJS 렌더링 영역과 React HUD/오버레이를 분리해 입력 흐름과 화면 계층을 정리했습니다.',
    points: ['Canvas + DOM', 'React HUD', 'Responsive UI'],
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
    title: '오버레이 계층',
    body: '렌더링 영역과 DOM 표면을 분리해 HUD와 모달 상태를 독립적으로 다뤘습니다.',
    points: ['HUD', 'Modal Surface'],
  },
  {
    id: 'shared',
    label: '공용 UI',
    title: '공유 패키지',
    body: 'theme, ui-shell, services를 공용 패키지로 두고 앱별 화면 규칙은 각 앱에 남겼습니다.',
    points: ['Theme Tokens', 'ui-shell', 'Service Registry'],
  },
] as const

const stackGroups = [
  {
    title: 'Frontend',
    items: ['React', 'TypeScript', 'Vite', 'CSS'],
  },
  {
    title: 'Interactive UI',
    items: ['Canvas Layer', 'DOM Overlay', 'Keyboard Flow', 'Responsive Layout'],
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
    <AppFrame as="main" innerClassName="page home-page" maxWidth="1428px" gutter="96px">
      <section className="hero" id="top">
        <div className="hero__copy">
          <h1>검토 가능한 프론트엔드 작업</h1>
          <p className="lead lead--hero">
            프로젝트별 구현 범위, 라이브 링크, 레포를 빠르게 확인할 수 있게 정리했습니다.
          </p>
          <div className="hero-actions">
            {projectCards.map((project, index) => (
              <ButtonSurface
                as="a"
                className={`button${index === 0 ? '' : ' button--ghost'}`}
                href={project.href}
                key={project.id}
                rel="noopener noreferrer"
                target="_blank"
                variant={index === 0 ? 'solid' : 'ghost'}
              >
                {project.title} 열기
              </ButtonSurface>
            ))}
          </div>
          <div className="hero-projects" aria-label="대표 작업">
            {projectCards.map((project) => (
              <a
                className={`hero-project hero-project--${project.id}`}
                href={project.href}
                key={project.id}
                rel="noopener noreferrer"
                target="_blank"
              >
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
            <span>링크</span>
            <a href={portfolioUrls.github} rel="noopener noreferrer" target="_blank">GitHub</a>
          </div>
          <dl className="service-list">
            {portfolioServiceList.map((service) => (
              <div className="service-list__row" key={service.id}>
                <dt>{service.name}</dt>
                <dd>
                  <a href={service.url} rel="noopener noreferrer" target="_blank">{service.host}</a>
                </dd>
              </div>
            ))}
          </dl>
        </SectionPanel>
      </section>

      <section className="section" id="projects">
        <SectionIntro
          className="section__header"
          title="작업물"
          titleAs="h2"
          titleClassName="ui-title-ko"
          descriptionClassName="ui-copy-ko"
          description={<p className="lead">채용 검토에서 먼저 확인할 수 있는 작업 범위와 링크입니다.</p>}
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
              <ButtonSurface
                as="a"
                className="button button--ghost"
                href={activeProject.href}
                rel="noopener noreferrer"
                target="_blank"
                variant="ghost"
              >
                프로젝트 열기
              </ButtonSurface>
              {activeProject.repositoryHref ? (
                <ButtonSurface
                  as="a"
                  className="button button--ghost"
                  href={activeProject.repositoryHref}
                  rel="noopener noreferrer"
                  target="_blank"
                  variant="ghost"
                >
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
          title="구현 상세"
          titleAs="h2"
          titleClassName="ui-title-ko"
          descriptionClassName="ui-copy-ko"
          description={<p className="lead">화면 흐름, 상태 처리, 공용 UI처럼 질문받기 쉬운 지점을 정리했습니다.</p>}
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
          title="기술 스택"
          titleAs="h2"
          titleClassName="ui-title-ko"
          descriptionClassName="ui-copy-ko"
          description={<p className="lead">기술 이름보다 실제 화면에서 맡은 역할을 기준으로 묶었습니다.</p>}
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
