# Synor

Database Migration Library

## Installation

```sh
# using yarn:
yarn add synor

# using npm:
npm install --save synor
```

## Usage

```js
const path = require('path')
const { Synor } = require('synor')
const { MySQLDatabaseEngine } = require('synor/lib/database/mysql')
const { FileSourceEngine } = require('synor/lib/source/file')

const synor = Synor({
  DatabaseEngine: MySQLDatabaseEngine,
  SourceEngine: FileSourceEngine,
  databaseUri: 'mysql://root:root@localhost:3306/synor',
  sourceUri: `file://${path.resolve('migrations')}`
})

const currentVersion = async () => {
  await synor.migrator.open()
  const version = await synor.migrator.version()
  console.log('version', version)
  await synor.migrator.close()
}

currentVersion().catch(err => {
  console.error(err)
  process.exit(1)
})
```

## License

Licensed under the MIT License. Check the [LICENSE](./LICENSE) file for details.
