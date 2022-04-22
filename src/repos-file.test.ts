import {loadAndProcessRepos, loadRepos, processRepos, reposToReposFile, getRepo, setRepo} from './repos-file'
import {join} from 'path'

const REPOS_YAML_PATH = join(__dirname, '__test_data__', 'ros2.repos')

describe('repos-file', () => {
  it('works in both directions', () => {
    const unprocessedRepos = loadRepos(REPOS_YAML_PATH)
    const processedRepos = processRepos(unprocessedRepos)
    const convertedProcessedRepos = reposToReposFile(processedRepos)
    expect(convertedProcessedRepos).toEqual(unprocessedRepos)
  })
  it('processes in one step or two', () => {
    const unprocessedRepos = loadRepos(REPOS_YAML_PATH)
    const processedRepos = processRepos(unprocessedRepos)
    const processedRepos2 = loadAndProcessRepos(REPOS_YAML_PATH)
    expect(processedRepos2).toEqual(processedRepos)
  })
  it('gets a repo if it exists', () => {
    expect(getRepo(loadAndProcessRepos(REPOS_YAML_PATH), 'rclcpp')).toMatchSnapshot()
    expect(getRepo(loadAndProcessRepos(REPOS_YAML_PATH), 'not-a-repo')).toBeUndefined()
  })
  it('sets data on a repo', () => {
    const repos = loadAndProcessRepos(REPOS_YAML_PATH)
    const oldVersion = getRepo(repos, 'rclcpp')!.version
    expect(oldVersion).toBe('master')

    const newVersion = 'ultra-ros'
    const newRepos = setRepo(repos, 'rclcpp', {
      version: newVersion,
    })
    expect(getRepo(repos, 'rclcpp').version).toEqual(oldVersion)
    expect(getRepo(newRepos, 'rclcpp').version).toEqual(newVersion)
    expect(getRepo(newRepos, 'rclcpp')).toMatchSnapshot()
  })
  it('throws an error when setting non-existent repo', () => {
    const repos = loadAndProcessRepos(REPOS_YAML_PATH)
    expect(() => {
      setRepo(repos, 'not-a-repo', {
        version: 'ultra-ros',
      })
    }).toThrowErrorMatchingSnapshot()
  })
})