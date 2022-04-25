import {Command} from 'commander'
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'fs'
import {copySync} from 'fs-extra'
import yaml from 'js-yaml'
import {join} from 'path'
import packageJson from '../package.json'
import {loadDistribution, setDistributionVersion} from './distribution-file'
import {checkoutBranch, hasBranch, push} from './git'
import logger from './logger'
import {
  getRepo,
  loadRepos,
  reposToReposFile,
  setRepoVersion,
} from './repos-file'
import type ProcessedRepos from './__types__/ProcessedRepos'

const DEFAULT_DATA_PATH = join(process.cwd(), 'data')
const DEFAULT_DISTRIBUTION_YAML_PATH = join(
  DEFAULT_DATA_PATH,
  'distribution.yaml',
)
const DEFAULT_REPOS_YAML_PATH = join(DEFAULT_DATA_PATH, 'ros2.repos')
const DEFAULT_SRC_CODE_PATH = join(DEFAULT_DATA_PATH, 'src')
const DEFAULT_OUT_DIRECTORY_PATH = join(process.cwd(), 'out')

function getRepoPath(dataPath: string, repos: ProcessedRepos, repo: string) {
  const repoData = getRepo(repos, repo)
  if (repoData === undefined) {
    throw new Error(`Repo ${repo} does not exist`)
  }
  return join(dataPath, repoData.org, repo)
}

type ErrorLog = {
  [repo: string]: string
}

function recordError({
  error,
  repo,
  errorLog,
  defaultMessage,
}: {
  error: Error | unknown
  defaultMessage: string
  errorLog: ErrorLog
  repo: string
}) {
  let errorMessage: string
  if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = defaultMessage
  }
  errorLog[repo] = errorMessage
  logger.error(errorMessage)
}

function displayErrors(errorLog: ErrorLog, title: string) {
  const reposWithErrors = Object.keys(errorLog)
  if (reposWithErrors.length > 0) {
    logger.error(`${title}`)
    logger.error(`${reposWithErrors.length} repos with errors:`)
    for (const repo of reposWithErrors) {
      logger.error(`- ${repo}: ${errorLog[repo]}`)
    }
  }
}

async function run({
  isPushBranches,
  distributionYamlPath,
  reposYamlPath,
  srcCodePath,
  outDirectoryPath,
}: {
  isPushBranches: boolean
  distributionYamlPath: string
  reposYamlPath: string
  srcCodePath: string
  outDirectoryPath: string
}) {
  logger.debug(`Loading repo and distribution files`)
  let repos = loadRepos(reposYamlPath)
  let distribution = loadDistribution(distributionYamlPath)

  if (!existsSync(srcCodePath)) {
    throw new Error(`Directory ${srcCodePath} does not exist`)
  }
  logger.debug(`Setting up output directory: ${outDirectoryPath}`)
  if (existsSync(outDirectoryPath)) {
    rmSync(outDirectoryPath, {recursive: true})
  }
  mkdirSync(outDirectoryPath)
  const outSrcCodePath = join(outDirectoryPath, 'src')
  logger.debug(`Copying ${srcCodePath} to ${outDirectoryPath}`)
  copySync(srcCodePath, outSrcCodePath)

  const branchPairs = [
    {
      findBranch: 'galactic',
      replaceBranch: 'humble',
    },
    {
      findBranch: 'galactic-devel',
      replaceBranch: 'humble-devel',
    },
  ]

  const setRepoErrors: ErrorLog = {}
  const setDistroErrors: ErrorLog = {}
  const pushBranchesError: ErrorLog = {}
  for (const branches of branchPairs) {
    const newBranch = branches.replaceBranch
    const checkBranch = branches.findBranch
    for (const repo of Object.keys(repos)) {
      const repoPath = getRepoPath(outSrcCodePath, repos, repo)
      if (await hasBranch(repoPath, RegExp('/' + checkBranch + '$'))) {
        if (!(await hasBranch(repoPath, RegExp('/' + newBranch + '$')))) {
          const repoVersion = getRepo(repos, repo).version
          await checkoutBranch(repoPath, newBranch, repoVersion)
          logger.debug(`Checked out ${repo}@${repoVersion}`)
        } else {
          logger.debug(`Branch '${newBranch}' already exists in ${repoPath}`)
        }

        try {
          repos = setRepoVersion(repos, repo, newBranch)
        } catch (error) {
          recordError({
            error,
            defaultMessage: `Failed to set version for repo '${repo}' in ros2.repos file`,
            errorLog: setRepoErrors,
            repo,
          })
        }
        try {
          distribution = setDistributionVersion(distribution, repo, newBranch)
        } catch (error) {
          recordError({
            error,
            defaultMessage: `Failed to set version for repo '${repo}' in distribution file`,
            errorLog: setDistroErrors,
            repo,
          })
        }
        if (isPushBranches) {
          try {
            await push(repoPath, newBranch)
            logger.debug(`Pushed branch '${newBranch}' to ${repoPath}`)
          } catch (error) {
            recordError({
              error,
              defaultMessage: `Failed to push branch '${newBranch}' to repo '${repo}'`,
              errorLog: pushBranchesError,
              repo,
            })
          }
        }
      } else {
        logger.debug(`No branch '${checkBranch}' found in ${repoPath}`)
      }
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

  displayErrors(setRepoErrors, 'Repo set version errors')
  displayErrors(setDistroErrors, 'Distribution set version errors')
  displayErrors(pushBranchesError, 'Branch push errors')
  if (
    Object.keys(setRepoErrors).length > 0 ||
    Object.keys(setDistroErrors).length > 0 ||
    Object.keys(pushBranchesError).length > 0
  ) {
    logger.info(`Finished with errors - created files in ${outDirectoryPath}`)
  } else {
    logger.info(
      `Finished without errors! - created files in ${outDirectoryPath}`,
    )
  }
}

class Cli {
  rootCommand: Command
  constructor() {
    this.rootCommand = new Command()
      .name(packageJson.name)
      .description(packageJson.description)
      .version(packageJson.version)
      .showHelpAfterError('(add --help for additional information)')
      .showSuggestionAfterError(true)
      .allowExcessArguments(false)

    this.rootCommand
      .command('run')
      .option(
        '--push-branches',
        'Push the created branches in the ros2.repos repositories',
        false,
      )
      .option(
        '--distribution-yaml-path <path>',
        'Path to distribution.yaml',
        DEFAULT_DISTRIBUTION_YAML_PATH,
      )
      .option(
        '--repos-yaml-path <path>',
        'Path to ros2.repos',
        DEFAULT_REPOS_YAML_PATH,
      )
      .option(
        '--src-code-path <path>',
        'Path to src code',
        DEFAULT_SRC_CODE_PATH,
      )
      .option(
        '--out-directory-path <path>',
        'Path to output directory',
        DEFAULT_OUT_DIRECTORY_PATH,
      )
      .action(async (options) => {
        await run({
          isPushBranches: options.pushBranches,
          distributionYamlPath: options.distributionYamlPath,
          reposYamlPath: options.reposYamlPath,
          srcCodePath: options.srcCodePath,
          outDirectoryPath: options.outDirectoryPath,
        })
      })
  }
  process() {
    this.rootCommand.parse(process.argv)
    if (this.rootCommand.args.length === 0) {
      this.rootCommand.help()
    }
  }
}

async function main() {
  const cli = new Cli()
  cli.process()
}

main()
