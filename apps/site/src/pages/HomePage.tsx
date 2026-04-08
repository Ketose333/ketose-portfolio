import { projectUrls } from '../config'

const stackGroups = [
  {
    title: '프론트엔드',
    items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
  },
  {
    title: '게임 런타임',
    items: ['PixiJS', 'Canvas 기반 UI', 'DOM 오버레이', '오디오/배경 리소스 분기'],
  },
  {
    title: '운영 구조',
    items: ['Vercel 배포', 'Monorepo', '공용 문서/리소스 분리', 'GitHub 중심 관리'],
  },
] as const

const projectCards = [
  {
    label: '운영 중',
    summary:
      '동방영이전 모티브의 브라우저 게임. 20면 캠페인, 분기 구조, 보스 대사, 장면별 배경과 BGM을 갖춘 상태로 운영 중입니다.',
    links: [
      { label: 'GitHub', href: projectUrls.github },
    ],
  },
  {
    label: '이관 완료',
    title: 'Nulsight',
    summary:
      '카드게임 프로젝트. 현재 모노레포 안에서 빌드와 배포가 가능하며, 공용 테마와 운영 규칙을 맞추면서 구조를 계속 다듬고 있습니다.',
    links: [
      { label: '플레이', href: projectUrls.nulsight },
      { label: 'GitHub', href: projectUrls.github },
    ],
  },
] as const

export function HomePage() {
  return (
    <main className="page">
      <section className="masthead">
        <div className="masthead__main">
          <p className="kicker">Ketose Portfolio</p>
          <h1>게임과 웹 프로젝트를 함께 관리합니다.</h1>
          <p className="lead">
            이 사이트는 프로젝트 소개와 배포 링크를 맡습니다. 실제 앱은 각각 독립적으로 배포하며,
          </p>
          <div className="actions">
            </a>
            <a className="button button--ghost" href={projectUrls.nulsight}>
              Nulsight 플레이
            </a>
            <a className="button button--ghost" href={projectUrls.github}>
              GitHub 레포
            </a>
          </div>
        </div>
        <aside className="masthead__panel">
          <dl className="facts">
            <div>
              <dt>사이트</dt>
              <dd>
                <a href={projectUrls.site}>{projectUrls.siteLabel}</a>
              </dd>
            </div>
            <div>
              <dd>
              </dd>
            </div>
            <div>
              <dt>Nulsight</dt>
              <dd>
                <a href={projectUrls.nulsight}>{projectUrls.nulsightLabel}</a>
              </dd>
            </div>
            <div>
              <dt>저장소</dt>
              <dd>
                <a href={projectUrls.github}>Ketose333/ketose-portfolio</a>
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="section">
        <div className="section__header">
          <p className="kicker">사용 기술</p>
          <h2>현재 레포에서 실제로 쓰는 기술입니다.</h2>
        </div>
        <div className="stack-grid">
          {stackGroups.map((group) => (
            <article className="panel" key={group.title}>
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

      <section className="section">
        <div className="section__header">
          <p className="kicker">프로젝트</p>
          <h2>현재 공개 중인 작업입니다.</h2>
        </div>
        <div className="project-grid">
          {projectCards.map((card) => (
            <article className="panel project-card" key={card.title}>
              <p className="panel__label">{card.label}</p>
              <h3>{card.title}</h3>
              <p>{card.summary}</p>
              <div className="actions actions--compact">
                {card.links.map((link) => (
                  <a className="button button--ghost" href={link.href} key={link.label}>
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
