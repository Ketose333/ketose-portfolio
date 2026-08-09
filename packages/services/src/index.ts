export type PortfolioServiceId =
  | 'site'
  | 'mooditree'
  | 'wizletBudget'
  | 'dopacheck'
  | 'reviewSentiment'
  | 'musicRecs'
  | 'hajacheck'
export type PortfolioProjectServiceId = Exclude<PortfolioServiceId, 'site'>
export type PortfolioAuthStrategy = 'none' | 'local-session'

export { generatedPortfolioProjects } from './projects.generated'

export const portfolioContactEmail = 'amumalbot4@gmail.com'

export const portfolioLinks = {
  github: 'https://github.com/Ketose333/ketose-portfolio',
  wizletBudgetRepository: 'https://github.com/sinisack/ogetherBudget_Project',
  mooditreeRepository: 'https://github.com/KDigital3/AIproject',
  dopacheckRepository: 'https://github.com/luma-team-ai/DopaCheck',
  reviewSentimentRepository: 'https://github.com/Ketose333/review-sentiment',
  musicRecsRepository: 'https://github.com/Ketose333/music-mood-recs',
  hajacheckRepository: 'https://github.com/luma-team-ai/HajaCheck',
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
  mooditree: PortfolioProjectService<'mooditree'>
  wizletBudget: PortfolioProjectService<'wizletBudget'>
  dopacheck: PortfolioProjectService<'dopacheck'>
  reviewSentiment: PortfolioProjectService<'reviewSentiment'>
  musicRecs: PortfolioProjectService<'musicRecs'>
  hajacheck: PortfolioProjectService<'hajacheck'>
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
  mooditree: {
    id: 'mooditree',
    name: '무디트리',
    label: 'MoodiTree',
    url: 'https://mooditree.vercel.app',
    host: 'mooditree.vercel.app',
    repositoryUrl: portfolioLinks.mooditreeRepository,
    timelineLabel: '2025.06 진행',
    authStrategy: 'none',
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
  dopacheck: {
    id: 'dopacheck',
    name: '도파체크',
    label: 'DopaCheck',
    url: 'https://dopacheck.luma200ok.com',
    host: 'dopacheck.luma200ok.com',
    repositoryUrl: portfolioLinks.dopacheckRepository,
    timelineLabel: '2026.06 진행',
    authStrategy: 'none',
  },
  reviewSentiment: {
    id: 'reviewSentiment',
    name: '리뷰 감성 분석',
    label: 'review-sentiment',
    url: 'https://nsmc-sentiment.streamlit.app',
    host: 'nsmc-sentiment.streamlit.app',
    repositoryUrl: portfolioLinks.reviewSentimentRepository,
    timelineLabel: '2026.06 진행',
    authStrategy: 'none',
  },
  musicRecs: {
    id: 'musicRecs',
    name: '음악 감정 추천',
    label: 'music-mood-recs',
    url: 'https://music-mood-recs.streamlit.app',
    host: 'music-mood-recs.streamlit.app',
    repositoryUrl: portfolioLinks.musicRecsRepository,
    timelineLabel: '2026.06 진행',
    authStrategy: 'none',
  },
  hajacheck: {
    id: 'hajacheck',
    name: '하자체크',
    label: 'HajaCheck',
    url: 'https://hajacheck.luma200ok.com',
    host: 'hajacheck.luma200ok.com',
    repositoryUrl: portfolioLinks.hajacheckRepository,
    timelineLabel: '2026.07 진행',
    authStrategy: 'none',
  },
}

export const portfolioServiceList = [
  portfolioServices.site,
  portfolioServices.mooditree,
  portfolioServices.wizletBudget,
  portfolioServices.dopacheck,
  portfolioServices.reviewSentiment,
  portfolioServices.musicRecs,
  portfolioServices.hajacheck,
] as const

export const portfolioProjectServices = [
  portfolioServices.mooditree,
  portfolioServices.wizletBudget,
  portfolioServices.dopacheck,
  portfolioServices.reviewSentiment,
  portfolioServices.musicRecs,
  portfolioServices.hajacheck,
] as const satisfies readonly PortfolioProjectService[]

export const portfolioUrls = {
  site: portfolioServices.site.url,
  siteLabel: portfolioServices.site.host,
  wizletBudget: portfolioServices.wizletBudget.url,
  wizletBudgetLabel: portfolioServices.wizletBudget.host,
  wizletBudgetRepository: portfolioLinks.wizletBudgetRepository,
  github: portfolioLinks.github,
  email: portfolioContactEmail,
} as const

export function getPortfolioService(id: PortfolioServiceId) {
  return portfolioServices[id]
}
