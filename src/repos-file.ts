import {readFileSync} from 'fs'
import yaml from 'js-yaml'
import type ProcessedRepos from './__types__/ProcessedRepos'
import type ReposFile from './__types__/ReposFile'

export function loadRepos(reposYamlPath: string): ProcessedRepos {
  const unprocessedRepos = loadRepos_(reposYamlPath)
  return processRepos(unprocessedRepos)
}

export function loadRepos_(reposYamlPath: string): ReposFile {
  return yaml.load(readFileSync(reposYamlPath, 'utf8')) as ReposFile
}

export function processRepos(repos: ReposFile) {
  const repos_: ProcessedRepos = {}
  Object.entries(repos.repositories).forEach(([orgAndName, data]) => {
    const [org, name] = orgAndName.split('/')
    repos_[name] = {
      org,
      ...data,
    }
  })
  return repos_
}

export function reposToReposFile(repos: ProcessedRepos) {
  const repos_: ReposFile = {repositories: {}}
  Object.entries(repos).forEach(([name, data]) => {
    repos_.repositories[`${data.org}/${name}`] = {
      type: data.type,
      url: data.url,
      version: data.version,
    }
  })
  return repos_
}

export function getRepo(repos: ProcessedRepos, repo: string) {
  return repos[repo]
}

export function setRepo(
  repos: ProcessedRepos,
  repo: string,
  data: {
    org?: string
    type?: string
    url?: string
    version?: string
  },
) {
  if (repos[repo] === undefined) {
    throw new Error(`Repo ${repo} does not exist`)
  }
  const newRepos = {...repos}
  newRepos[repo] = {
    ...newRepos[repo],
    ...data,
  }
  return newRepos
}

export function setRepoVersion(
  repos: ProcessedRepos,
  repo: string,
  version: string,
) {
  return setRepo(repos, repo, {version})
}
