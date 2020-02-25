# Changelog

## [Unreleased]

- ...

## [0.9.1] - 2020-02-25

- Fix hash generation in `SynorMigration` function

## [0.9.0] - 2020-02-25

- Resolve: [#34](https://github.com/Synor/core/issues/34)

## [0.8.2] - 2020-02-07

- Fix `getCurrentRecord` [#32](https://github.com/Synor/core/issues/32)

## [0.8.1] - 2020-02-07

- Fix `Migrator.info` [#32](https://github.com/Synor/core/issues/32)

## [0.8.0] - 2020-02-07

- Change types: remove `MigrationHistory`, add `MigrationRecordInfo` & `MigrationSourceInfo` [#32](https://github.com/Synor/core/issues/32)
- Combine `Migrator.history` and `Migrator.pending` into `Migrator.info` [#32](https://github.com/Synor/core/issues/32)
- Add support for Out of Order migration run [#32](https://github.com/Synor/core/issues/32)
- Add `extension` property in `MigrationInfo`

## [0.7.0] - 2020-01-14

- Close: [#31](https://github.com/Synor/core/issues/31)

## [0.6.1] - 2020-01-12

- Improve TypeScript support for `SynorError` (internal)
- Export `isSynorError`

## [0.6.0] - 2020-01-11

- Close: [#26](https://github.com/Synor/core/issues/26)
- Close: [#28](https://github.com/Synor/core/issues/28)
- Refactor `SynorError` (internal)

## [0.5.0] - 2020-01-05

- Fix: [#22](https://github.com/Synor/core/issues/22)
- Fix: [#23](https://github.com/Synor/core/issues/23)

## [0.4.1] - 2019-12-25

- Fix typo in config option: `separator`

## [0.4.0] - 2019-12-24

- Fix `sortVersions`
- Tweak `sanitizeContent` (internal)

## [0.3.0] - 2019-12-16

- Improved Error handling #19

## [0.2.0] - 2019-12-14

- Tweak default migration info parser
- Replace `Migrator.version` with `Migrator.current` #18
- Tweaks for ensuring consistent behavior

## 0.1.0 - 2019-12-10

- Initial release

[unreleased]: https://github.com/Synor/core/compare/0.9.1...HEAD
[0.9.1]: https://github.com/Synor/core/compare/0.9.0...0.9.1
[0.9.0]: https://github.com/Synor/core/compare/0.8.2...0.9.0
[0.8.2]: https://github.com/Synor/core/compare/0.8.1...0.8.2
[0.8.1]: https://github.com/Synor/core/compare/0.8.0...0.8.1
[0.8.0]: https://github.com/Synor/core/compare/0.7.0...0.8.0
[0.7.0]: https://github.com/Synor/core/compare/0.6.1...0.7.0
[0.6.1]: https://github.com/Synor/core/compare/0.6.0...0.6.1
[0.6.0]: https://github.com/Synor/core/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/Synor/core/compare/0.4.1...0.5.0
[0.4.1]: https://github.com/Synor/core/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/Synor/core/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/Synor/core/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Synor/core/compare/0.1.0...0.2.0
