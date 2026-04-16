import type { PropsWithChildren } from 'react'
import { ShellChrome } from '@portfolio/ui-shell'
import { portfolioUrls } from '@portfolio/services'

const SECTION_LINKS = [
  { label: 'Projects', href: '#projects' },
  { label: 'System', href: '#system' },
  { label: 'Method', href: '#method' },
] as const

const ACTION_LINKS = [
  { label: 'Amesato', href: portfolioUrls.amesato },
  { label: 'Nulsight', href: portfolioUrls.nulsight },
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
          <strong className="ui-shell-chrome__title">Portfolio</strong>
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
            <p className="ui-shell-chrome__footer-copy">Ketose portfolio.</p>
          </div>
          <div className="ui-shell-chrome__footer-links">
            <a className="ui-shell-chrome__footer-link" href={portfolioUrls.amesato}>
              Amesato
            </a>
            <a className="ui-shell-chrome__footer-link" href={portfolioUrls.nulsight}>
              Nulsight
            </a>
            <a className="ui-shell-chrome__footer-link" href={portfolioUrls.github}>
              Repository
            </a>
          </div>
        </>
      }
    >
      {children}
    </ShellChrome>
  )
}
