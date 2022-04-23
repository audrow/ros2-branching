import simpleGit from 'simple-git'

export async function hasBranch(path: string, branch: RegExp) {
  const branches = Object.keys((await simpleGit(path).branch(['-a'])).branches)
  return branches.some((b) => b.match(branch))
}

export async function checkoutBranch(
  path: string,
  newBranch: string,
  currentBranch: string,
) {
  try {
    const git = simpleGit(path)
    await git.checkoutBranch(newBranch, currentBranch)
  } catch (e) {
    console.error(
      `Failed to checkout branch '${newBranch}' from '${currentBranch}' in '${path}'`,
    )
    throw e
  }
}

export async function push(path: string, branch: string, remote = 'origin') {
  const git = simpleGit(path)
  await git.push(remote, branch)
}

async function main() {
  const tempFs = await import('temp-fs')
  const {path: path_} = tempFs.mkdirSync({
    recursive: true,
    track: true,
  })
  const path = path_.toString()

  const repo = 'https://github.com/ros2/common_interfaces'
  await simpleGit().clone(repo, path)

  const checkBranch = 'galactic'
  const rollingBranch = 'master'
  const newBranch = 'humble'
  if (await hasBranch(path, RegExp(checkBranch))) {
    await checkoutBranch(path, newBranch, rollingBranch)
  }

  tempFs.clearSync()
}

if (typeof require !== 'undefined' && require.main === module) {
  main()
}
