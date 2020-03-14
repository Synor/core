type Config = import('bili').Config

const config: Config = {
  input: ['src/index.ts'],
  output: {
    dir: 'lib',
    format: ['cjs', 'esm']
  },
  plugins: {
    typescript2: {
      objectHashIgnoreUnknownHack: false
    }
  }
}

export default config
