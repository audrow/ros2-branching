import {join} from 'path'
import {
  getRepo,
  loadRepos,
  loadRepos_,
  processRepos,
  reposToReposFile,
  setRepo,
  setRepoVersion,
} from './repos-file'

const REPOS_YAML_PATH = join(__dirname, '__test_data__', 'ros2.repos')

describe('repos-file', () => {
  it('works in both directions', () => {
    const unprocessedRepos = loadRepos_(REPOS_YAML_PATH)
    const processedRepos = processRepos(unprocessedRepos)
    const convertedProcessedRepos = reposToReposFile(processedRepos)
    expect(convertedProcessedRepos).toEqual(unprocessedRepos)
  })
  it('processes in one step or two', () => {
    const unprocessedRepos = loadRepos_(REPOS_YAML_PATH)
    const processedRepos = processRepos(unprocessedRepos)
    const processedRepos2 = loadRepos(REPOS_YAML_PATH)
    expect(processedRepos2).toEqual(processedRepos)
  })
  it('gets a repo if it exists', () => {
    expect(getRepo(loadRepos(REPOS_YAML_PATH), 'rclcpp')).toMatchSnapshot()
    expect(getRepo(loadRepos(REPOS_YAML_PATH), 'not-a-repo')).toBeUndefined()
  })
  it('sets data on a repo', () => {
    const repos = loadRepos(REPOS_YAML_PATH)
    const oldOrg = getRepo(repos, 'rclcpp').org
    expect(oldOrg).toBe('ros2')
    const oldVersion = getRepo(repos, 'rclcpp').version
    expect(oldVersion).toBe('master')

    const newVersion = 'ultra-ros'
    const newOrg = 'ultra-org'
    const newRepos = setRepo(repos, 'rclcpp', {
      version: newVersion,
      org: newOrg,
    })

    expect(getRepo(repos, 'rclcpp').org).toEqual(oldOrg)
    expect(getRepo(repos, 'rclcpp').version).toEqual(oldVersion)

    expect(getRepo(newRepos, 'rclcpp').org).toEqual(newOrg)
    expect(getRepo(newRepos, 'rclcpp').version).toEqual(newVersion)

    expect(getRepo(newRepos, 'rclcpp')).toMatchSnapshot()
  })
  it('sets the version of an repo', () => {
    const repos = loadRepos(REPOS_YAML_PATH)
    const oldVersion = getRepo(repos, 'rclcpp').version
    expect(oldVersion).toBe('master')
    const newVersion = 'ultra-ros'
    const newRepos = setRepoVersion(repos, 'rclcpp', newVersion)
    expect(getRepo(repos, 'rclcpp').version).toBe(oldVersion)
    expect(getRepo(newRepos, 'rclcpp').version).toBe(newVersion)
  })
  it('throws an error when setting non-existent repo', () => {
    const repos = loadRepos(REPOS_YAML_PATH)
    expect(() => {
      setRepo(repos, 'not-a-repo', {
        version: 'ultra-ros',
      })
    }).toThrowErrorMatchingSnapshot()
    expect(() => {
      setRepoVersion(repos, 'not-a-repo', 'ultra-ros')
    }).toThrowErrorMatchingSnapshot()
  })
})
