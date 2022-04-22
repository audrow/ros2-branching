import {join} from 'path'
import {
  getFromDistribution,
  loadDistribution,
  setDistributionVersion,
} from './distribution-file'

const DISTRIBUTION_YAML_PATH = join(
  __dirname,
  '__test_data__',
  'distribution.yaml',
)
describe('distribution-file', () => {
  it('should load the distribution file', () => {
    const dist = loadDistribution(DISTRIBUTION_YAML_PATH)
    expect(dist).toMatchSnapshot()
    getFromDistribution(dist, 'rclcpp')
  })

  it('should get a repo from the distribution file, if it exists', () => {
    const dist = loadDistribution(DISTRIBUTION_YAML_PATH)
    expect(getFromDistribution(dist, 'rclcpp')).toMatchSnapshot()
    expect(getFromDistribution(dist, 'not-a-repo')).toBeUndefined()
  })

  it('should set the version of a repo in the distribution file', () => {
    const dist = loadDistribution(DISTRIBUTION_YAML_PATH)
    const oldVersion = getFromDistribution(dist, 'rclcpp').doc!.version
    expect(oldVersion).toBe('master')
    const newVersion = 'ultra-ros'
    const newDist = setDistributionVersion(dist, 'rclcpp', newVersion)
    console.log(getFromDistribution(dist, 'rclcpp'))
    expect(getFromDistribution(dist, 'rclcpp').doc!.version).toBe(oldVersion)
    expect(getFromDistribution(dist, 'rclcpp').source!.version).toBe(oldVersion)
    expect(getFromDistribution(newDist, 'rclcpp').doc!.version).toBe(newVersion)
    expect(getFromDistribution(newDist, 'rclcpp').source!.version).toBe(
      newVersion,
    )
  })
})
