export type PortfolioServiceId = 'site' | 'amesato' | 'nulsight'
export type PortfolioAuthStrategy = 'none' | 'local-session'

export type PortfolioService = {
  id: PortfolioServiceId
  name: string
  label: string
  url: string
  host: string
  authStrategy: PortfolioAuthStrategy
}

export const portfolioServices: Record<PortfolioServiceId, PortfolioService> = {
  site: {
    id: 'site',
    name: 'Portfolio',
    label: 'Ketose Portfolio',
    url: 'https://ketose.vercel.app',
    host: 'ketose.vercel.app',
    authStrategy: 'none',
  },
  amesato: {
    id: 'amesato',
    name: 'Amesato',
    label: 'Amesato',
    url: 'https://amesato.vercel.app',
    host: 'amesato.vercel.app',
    authStrategy: 'none',
  },
  nulsight: {
    id: 'nulsight',
    name: 'Nulsight',
    label: 'Nulsight',
    url: 'https://nulsight.vercel.app',
    host: 'nulsight.vercel.app',
    authStrategy: 'local-session',
  },
}

export const portfolioServiceList = [
  portfolioServices.site,
  portfolioServices.amesato,
  portfolioServices.nulsight,
] as const

export const portfolioLinks = {
  github: 'https://github.com/Ketose333/ketose-portfolio',
} as const

export const portfolioUrls = {
  site: portfolioServices.site.url,
  siteLabel: portfolioServices.site.host,
  amesato: portfolioServices.amesato.url,
  amesatoLabel: portfolioServices.amesato.host,
  nulsight: portfolioServices.nulsight.url,
  nulsightLabel: portfolioServices.nulsight.host,
  github: portfolioLinks.github,
} as const

export const portfolioAuthService = portfolioServices.nulsight

export function getPortfolioService(id: PortfolioServiceId) {
  return portfolioServices[id]
}
