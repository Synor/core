module.exports = {
  'src/**/*.ts': () => 'tsc -p tsconfig.json --noEmit',
  'src/**/*.ts': ['eslint']
}
