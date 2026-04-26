import type { PropsWithChildren } from 'react'
import { ShellChrome } from '@portfolio/ui-shell'
import { portfolioProjectServices, portfolioUrls } from '@portfolio/services'

const SECTION_LINKS = [
  { label: '작업', href: '#projects' },
  { label: '기술', href: '#demo' },
  { label: '구조', href: '#system' },
] as const

const ACTION_LINKS = [
  { label: 'GitHub', href: portfolioUrls.github },
] as const

export function SiteChrome({ children }: PropsWithChildren) {
  return (
    <ShellChrome
      shellClassName="site-shell"
      headerClassName="site-shell__header"
      contentClassName="site-shell__content"
      footerClassName="site-shell__footer"
      brand={
        <a className="ui-shell-chrome__brand site-shell__brand" href="/">
          <span className="ui-shell-chrome__eyebrow">Ketose</span>
          <strong className="ui-shell-chrome__title">작업 인덱스</strong>
        </a>
      }
      context={null}
      nav={
        <>
          {SECTION_LINKS.map((item) => (
            <a className="ui-shell-chrome__nav-link" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </>
      }
      actions={
        <>
          {ACTION_LINKS.map((item, index) => (
            <a
              className={`ui-shell-chrome__button${index === 0 ? ' ui-shell-chrome__button--solid' : ''}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </>
      }
      footer={
        <>
          <div className="ui-shell-chrome__footer-note">
            <p className="ui-shell-chrome__footer-copy">라이브 앱과 GitHub 저장소</p>
          </div>
          <div className="ui-shell-chrome__footer-links">
            {portfolioProjectServices.map((service) => (
              <a className="ui-shell-chrome__footer-link" href={service.url} key={service.id}>
                {service.name}
              </a>
            ))}
            <a className="ui-shell-chrome__footer-link" href={portfolioUrls.github}>
              GitHub
            </a>
          </div>
        </>
      }
    >
      {children}
    </ShellChrome>
  )
}
