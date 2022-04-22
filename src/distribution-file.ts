import {readFileSync} from 'fs'
import yaml from 'js-yaml'
import type DistributionYamlFile from './__types__/DistributionYamlFile'

export function loadDistribution(distributionYamlPath: string) {
  const distribution = yaml.load(
    readFileSync(distributionYamlPath, 'utf8'),
  ) as DistributionYamlFile
  return distribution
}

export function getFromDistribution(
  distribution: DistributionYamlFile,
  repo: string,
) {
  return distribution.repositories[repo]
}

export function setDistributionVersion(
  distribution: DistributionYamlFile,
  repo: string,
  version: string,
  isSkipRelease = true,
) {
  if (distribution.repositories[repo] === undefined) {
    throw new Error(`Repo ${repo} does not exist`)
  }
  const newDistribution = JSON.parse(JSON.stringify(distribution))
  const dist = getFromDistribution(newDistribution, repo)
  if (dist.doc) {
    dist.doc.version = version
  }
  if (dist.release && !isSkipRelease) {
    dist.release.version = version
  }
  if (dist.source) {
    dist.source.version = version
  }
  return newDistribution
}
