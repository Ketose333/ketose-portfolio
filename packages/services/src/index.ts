export type PortfolioProjectServiceId = Exclude<PortfolioServiceId, 'site'>
export type PortfolioAuthStrategy = 'none' | 'local-session'

export const portfolioContactEmail = 'amumalbot4@gmail.com'

export const portfolioLinks = {
  github: 'https://github.com/Ketose333/ketose-portfolio',
  wizletBudgetRepository: 'https://github.com/sinisack/ogetherBudget_Project',
} as const

export type PortfolioService<TId extends PortfolioServiceId = PortfolioServiceId> = {
  id: TId
  name: string
  label: string
  url: string
  host: string
  repositoryUrl?: string
  timelineLabel?: string
  authStrategy: PortfolioAuthStrategy
}

export type PortfolioProjectService<TId extends PortfolioProjectServiceId = PortfolioProjectServiceId> =
  PortfolioService<TId> & {
    timelineLabel: string
  }

export const portfolioServices: {
  site: PortfolioService<'site'>
  nulsight: PortfolioProjectService<'nulsight'>
  wizletBudget: PortfolioProjectService<'wizletBudget'>
} = {
  site: {
    id: 'site',
    name: 'Portfolio',
    label: 'Ketose Portfolio',
    url: 'https://ketose.vercel.app',
    host: 'ketose.vercel.app',
    repositoryUrl: portfolioLinks.github,
    authStrategy: 'none',
  },
    repositoryUrl: portfolioLinks.github,
    timelineLabel: '2026.04 진행',
    authStrategy: 'none',
  },
  nulsight: {
    id: 'nulsight',
    name: 'NULSIGHT',
    label: 'NULSIGHT',
    url: 'https://nulsight.vercel.app',
    host: 'nulsight.vercel.app',
    repositoryUrl: portfolioLinks.github,
    timelineLabel: '2026.02 시작',
    authStrategy: 'local-session',
  },
  wizletBudget: {
    id: 'wizletBudget',
    name: '같이가계',
    label: 'Wizlet Budget',
    url: 'https://wizlet-budget.vercel.app',
    host: 'wizlet-budget.vercel.app',
    repositoryUrl: portfolioLinks.wizletBudgetRepository,
    timelineLabel: '2025.11 진행',
    authStrategy: 'none',
  },
}

export const portfolioServiceList = [
  portfolioServices.site,
  portfolioServices.wizletBudget,
  portfolioServices.nulsight,
] as const

export const portfolioProjectServices = [
  portfolioServices.wizletBudget,
  portfolioServices.nulsight,
] as const satisfies readonly PortfolioProjectService[]

export const portfolioUrls = {
  site: portfolioServices.site.url,
  siteLabel: portfolioServices.site.host,
  nulsight: portfolioServices.nulsight.url,
  nulsightLabel: portfolioServices.nulsight.host,
  wizletBudget: portfolioServices.wizletBudget.url,
  wizletBudgetLabel: portfolioServices.wizletBudget.host,
  wizletBudgetRepository: portfolioLinks.wizletBudgetRepository,
  github: portfolioLinks.github,
  email: portfolioContactEmail,
} as const

export const portfolioAuthService = portfolioServices.nulsight

export function getPortfolioService(id: PortfolioServiceId) {
  return portfolioServices[id]
}
