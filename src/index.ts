import {existsSync, mkdirSync, rmSync, writeFileSync} from 'fs'
import {copySync} from 'fs-extra'
import yaml from 'js-yaml'
import {join} from 'path'
import {loadDistribution, setDistributionVersion} from './distribution-file'
import {checkoutBranch, hasBranch, push} from './git'
import {
  getRepo,
  loadRepos,
  reposToReposFile,
  setRepoVersion,
} from './repos-file'
import type ProcessedRepos from './__types__/ProcessedRepos'

const DATA_PATH = join(__dirname, '..', 'data')
const DISTRIBUTION_YAML_PATH = join(DATA_PATH, 'distribution.yaml')
const REPOS_YAML_PATH = join(DATA_PATH, 'ros2.repos')
const SRC_CODE_PATH = join(DATA_PATH, 'src')
const OUT_DIRECTORY_PATH = join(__dirname, '..', 'out')

function getRepoPath(dataPath: string, repos: ProcessedRepos, repo: string) {
  const repoData = getRepo(repos, repo)
  if (repoData === undefined) {
    throw new Error(`Repo ${repo} does not exist`)
  }
  return join(dataPath, repoData.org, repo)
}

async function run({
  isDryRun,
  distributionYamlPath,
  reposYamlPath,
  srcCodePath,
  outDirectoryPath,
}: {
  isDryRun: boolean
  distributionYamlPath: string
  reposYamlPath: string
  srcCodePath: string
  outDirectoryPath: string
}) {
  let repos = loadRepos(reposYamlPath)
  let distribution = loadDistribution(distributionYamlPath)

  if (!existsSync(srcCodePath)) {
    throw new Error(`Directory ${srcCodePath} does not exist`)
  }
  if (existsSync(outDirectoryPath)) {
    rmSync(outDirectoryPath, {recursive: true})
  }
  mkdirSync(outDirectoryPath)
  const outSrcCodePath = join(outDirectoryPath, 'src')
  copySync(srcCodePath, outSrcCodePath)
  //copy src dir into out dir

  const newBranch = 'humble'
  const checkBranch = 'galactic'

  for (const repo of Object.keys(repos)) {
    const repoPath = getRepoPath(outSrcCodePath, repos, repo)
    if (await hasBranch(repoPath, RegExp(checkBranch))) {
      if (!(await hasBranch(repoPath, RegExp(newBranch)))) {
        const repoVersion = getRepo(repos, repo).version
        await checkoutBranch(repoPath, newBranch, repoVersion)
      } else {
        console.log(`Branch '${newBranch}' already exists in ${repoPath}`)
      }

      try {
        repos = setRepoVersion(repos, repo, newBranch)
      } catch (e) {
        console.error(
          "Failed to set version for repo '%s' in ros2.repos file",
          repo,
        )
      }
      try {
        distribution = setDistributionVersion(distribution, repo, newBranch)
      } catch (e) {
        console.error(
          "Failed to set version for repo '%s' in distribution file",
          repo,
        )
      }
      if (!isDryRun) {
        try {
          await push(repoPath, newBranch)
        } catch (e) {
          console.error(
            "Failed to push branch '%s' to repo '%s'",
            newBranch,
            repo,
          )
        }
      }
    } else {
      console.log(`No branch '${checkBranch}' found in ${repoPath}`)
    }
  }
  const reposFile = reposToReposFile(repos)
  const reposYamlSavePath = join(outDirectoryPath, 'ros2.repos')
  const distributionYamlSavePath = join(outDirectoryPath, 'distribution.yaml')
  writeFileSync(reposYamlSavePath, yaml.dump(reposFile))
  writeFileSync(
    distributionYamlSavePath,
    yaml.dump(distribution, {noArrayIndent: true}),
  )
}

async function main() {
  await run({
    isDryRun: true,
    distributionYamlPath: DISTRIBUTION_YAML_PATH,
    reposYamlPath: REPOS_YAML_PATH,
    srcCodePath: SRC_CODE_PATH,
    outDirectoryPath: OUT_DIRECTORY_PATH,
  })
}

main()
