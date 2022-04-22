type ReposFile = {
  repositories: {
    [repository: string]: {
      type: string
      url: string
      version: string
    }
  }
}

export default ReposFile
