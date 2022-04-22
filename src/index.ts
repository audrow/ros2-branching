import {join} from 'path'
import {loadDistribution} from './distribution-file'
import {loadRepos} from './repos-file'

const DATA_PATH = join(__dirname, '..', 'data')
const DISTRIBUTION_YAML_PATH = join(DATA_PATH, 'distribution.yaml')
const REPOS_YAML_PATH = join(DATA_PATH, 'ros2.repos')

function main() {
  const repos = loadRepos(REPOS_YAML_PATH)
  console.log(repos)
  const distribution = loadDistribution(DISTRIBUTION_YAML_PATH)
  console.log(distribution)

  const repo = 'rclcpp'
  // console.log(getFromRepos(repos, repo), getFromDistribution(distribution, repo))
}

main()
