import { generatedPortfolioProjects } from './projects.generated'

export { generatedPortfolioProjects } from './projects.generated'

export type PortfolioProject = {
  id: string
  name: string
  label: string
  timelineLabel: string
  status: string
  repositoryUrl: string
  demoUrl: string
  summary: string
}

export type PortfolioService = {
  id: string
  name: string
  label: string
  url: string
  host: string
  repositoryUrl?: string
}

export const portfolioContactEmail = 'amumalbot4@gmail.com'

export const portfolioProjects: readonly PortfolioProject[] = generatedPortfolioProjects

const portfolioSite = {
  id: 'site',
  name: 'Portfolio',
  label: 'Ketose Portfolio',
  url: 'https://ketose.vercel.app',
  host: 'ketose.vercel.app',
  repositoryUrl: 'https://github.com/Ketose333/ketose-portfolio',
} as const satisfies PortfolioService

export const portfolioServiceList: readonly PortfolioService[] = [
  portfolioSite,
  ...portfolioProjects.map((project) => {
    const url = project.demoUrl || project.repositoryUrl
    return {
      id: project.id,
      name: project.name,
      label: project.label,
      url,
      host: new URL(url).host,
      repositoryUrl: project.repositoryUrl || undefined,
    }
  }),
]

export const portfolioUrls = {
  site: portfolioSite.url,
  siteLabel: portfolioSite.host,
  github: portfolioSite.repositoryUrl,
  email: portfolioContactEmail,
} as const
