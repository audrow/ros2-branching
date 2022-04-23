import simpleGit from 'simple-git'
import tempFs from 'temp-fs'
import {checkoutBranch, hasBranch} from './git'

let path: string

describe('git', () => {
  beforeAll(async () => {
    const {path: path_} = tempFs.mkdirSync({
      recursive: true,
      track: true,
    })
    path = path_.toString()
    const repo = 'https://github.com/ros2/common_interfaces'
    await simpleGit().clone(repo, path)
  })
  afterAll(() => {
    tempFs.clearSync()
    path = ''
  })

  it('says if a branch exists correctly', async () => {
    expect(await hasBranch(path, RegExp('galactic'))).toBeTruthy()
    expect(await hasBranch(path, RegExp('master'))).toBeTruthy()
    expect(await hasBranch(path, RegExp('not-a-branch'))).toBeFalsy()
  })
  it('creates a new branch', async () => {
    const newBranch = 'humble'
    const baseBranch = 'master'
    expect(await hasBranch(path, RegExp('galactic'))).toBeTruthy()
    expect(await hasBranch(path, RegExp(baseBranch))).toBeTruthy()
    expect(await hasBranch(path, RegExp(newBranch))).toBeFalsy()
    await checkoutBranch(path, newBranch, baseBranch)
    expect(await hasBranch(path, RegExp(newBranch))).toBeTruthy()
  })
})
