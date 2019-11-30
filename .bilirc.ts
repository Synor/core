type Config = import('bili').Config

const config: Config = {
  input: ['src/index.ts'],
  output: {
    dir: 'lib',
    format: ['cjs', 'esm']
  },
  plugins: {
    typescript2: {
      tsconfigOverride: {
        compilerOptions: {}
      }
    }
  }
}

const { SYNOR_DATABASE, SYNOR_SOURCE } = process.env

if (SYNOR_DATABASE) {
  config.input = `src/database/${SYNOR_DATABASE}/index.ts`
  config.output.dir = 'lib/database'
  config.output.format = 'cjs'
  config.output.fileName = `${SYNOR_DATABASE}[ext]`
  config.plugins.typescript2.tsconfigOverride.compilerOptions.declaration = false
}

if (SYNOR_SOURCE) {
  config.input = `src/source/${SYNOR_SOURCE}/index.ts`
  config.output.dir = 'lib/source'
  config.output.format = 'cjs'
  config.output.fileName = `${SYNOR_SOURCE}[ext]`
  config.plugins.typescript2.tsconfigOverride.compilerOptions.declaration = false
}

export default config
