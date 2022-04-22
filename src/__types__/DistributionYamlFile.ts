type DistributionYamlFile = {
  release_platfroms: {
    [os: string]: string[]
  }
  repositories: {
    [repository: string]: {
      doc?: {
        type: string
        url: string
        version: string
      }
      release?: {
        packages: string[]
        tags: {
          release: string
        }
        version: string
      }
      source?: {
        type: string
        url: string
        version: string
      }
      status: string
    }
  }
  type: string
  version: number
}

export default DistributionYamlFile
