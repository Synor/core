import { exec } from 'child_process'

/**
 * Runs shell command to get value from Git Config
 *
 * @param key name of git config option
 *
 * @returns value of git config option
 */
function getGitConfigValue(key: string): Promise<string> {
  return new Promise(resolve => {
    exec(`git config --get ${key}`, (err, stdout) => {
      if (err) {
        resolve('')
        return
      }
      resolve(stdout.split(/\n/)[0])
    })
  })
}

/**
 * Extracts user information from Git.
 *
 * @returns User information: `Username <Email>`
 */
export async function getGitUserInfo(): Promise<string> {
  const [name, email] = await Promise.all([
    getGitConfigValue('user.name'),
    getGitConfigValue('user.email')
  ])

  return `${name || 'N/A'}${email ? ` <${email}>` : ''}`
}
