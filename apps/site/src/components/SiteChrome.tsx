import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { ShellChrome } from '@portfolio/ui-shell'
import { portfolioUrls } from '@portfolio/services'

const SECTION_LINKS = [
  { label: '작업', href: '/#projects' },
  { label: '구현', href: '/#demo' },
  { label: '기술', href: '/#system' },
] as const

const ACTION_LINKS = [
  { label: '연락하기', href: '/contact' },
] as const

export function SiteChrome({ children }: PropsWithChildren) {
  return (
    <ShellChrome
      shellClassName="site-shell"
      headerClassName="site-shell__header"
      contentClassName="site-shell__content"
      footerClassName="site-shell__footer"
      maxWidth="1428px"
      gutter="96px"
      brand={
        <Link className="ui-shell-chrome__brand site-shell__brand" to="/">
          <strong className="ui-shell-chrome__title">Portfolio</strong>
        </Link>
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
            <Link
              className={`ui-shell-chrome__button${index === 0 ? ' ui-shell-chrome__button--solid' : ''}`}
              to={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </>
      }
      footer={
        <>
          <div className="ui-shell-chrome__footer-note">
            <p className="ui-shell-chrome__footer-copy">Portfolio</p>
          </div>
          <div className="ui-shell-chrome__footer-links">
            <a className="ui-shell-chrome__footer-link" href={portfolioUrls.github} rel="noopener noreferrer" target="_blank">
              GitHub ↗
            </a>
            <Link className="ui-shell-chrome__footer-link" to="/contact">
              연락하기
            </Link>
          </div>
        </>
      }
    >
      {children}
    </ShellChrome>
  )
}
