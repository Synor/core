import { exec } from 'child_process'

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

export async function getGitUserInfo(): Promise<string> {
  const [name, email] = await Promise.all([
    getGitConfigValue('user.name'),
    getGitConfigValue('user.email')
  ])

  return `${name || 'N/A'}${email ? ` <${email}>` : ''}`
}
