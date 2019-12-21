import childProcess from 'child_process'
import { getGitUserInfo } from './index'

type Command = 'git config --get user.name' | 'git config --get user.email'

const mockGitConfig = (
  result?: {
    [command in Command]: [null, string] | [Error]
  }
): void => {
  // @ts-ignore
  const mockImplementation: typeof childProcess['exec'] = (
    ...args: Parameters<typeof childProcess['exec']>
  ) => {
    const command = args[0]
    const callback = args[args.length - 1]
    // @ts-ignore
    callback(result[command][0], result[command][1])
  }

  jest
    .spyOn(childProcess, 'exec')
    .mockImplementationOnce(mockImplementation)
    .mockImplementationOnce(mockImplementation)
}

describe('UserInfo', () => {
  describe('getGitUserInfo', () => {
    test('resolves git user info', async () => {
      mockGitConfig({
        'git config --get user.name': [null, 'Synor'],
        'git config --get user.email': [null, 'synor@example.com']
      })

      await expect(getGitUserInfo()).resolves.toMatchInlineSnapshot(
        `"Synor <synor@example.com>"`
      )
    })

    test('resolves git user info (no username)', async () => {
      mockGitConfig({
        'git config --get user.name': [Error()],
        'git config --get user.email': [null, 'synor@example.com']
      })

      await expect(getGitUserInfo()).resolves.toMatchInlineSnapshot(
        `"N/A <synor@example.com>"`
      )
    })

    test('resolves git user info (no email)', async () => {
      mockGitConfig({
        'git config --get user.name': [null, 'Synor'],
        'git config --get user.email': [new Error()]
      })

      await expect(getGitUserInfo()).resolves.toMatchInlineSnapshot(`"Synor"`)
    })

    test('resolves git user info (no username/email)', async () => {
      mockGitConfig({
        'git config --get user.name': [new Error()],
        'git config --get user.email': [new Error()]
      })

      await expect(getGitUserInfo()).resolves.toMatchInlineSnapshot(`"N/A"`)
    })
  })
})
