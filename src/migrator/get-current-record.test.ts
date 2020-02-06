import { getMigrationRecordInfo } from '../__utils__.test'
import { getCurrentRecord } from './get-current-record'

describe('migrator:getCurrentRecord', () => {
  test('works as expected', () => {
    expect(
      getCurrentRecord([
        getMigrationRecordInfo({ id: 1, version: '01', type: 'do' }),
        getMigrationRecordInfo({
          id: 2,
          version: '02',
          type: 'do',
          state: 'reverted',
          revertedBy: 5
        }),
        getMigrationRecordInfo({
          id: 3,
          version: '03',
          type: 'do',
          state: 'reverted',
          revertedBy: 4
        }),
        getMigrationRecordInfo({ id: 4, version: '03', type: 'undo' }),
        getMigrationRecordInfo({ id: 5, version: '02', type: 'undo' }),
        getMigrationRecordInfo({ id: 6, version: '02', type: 'do' })
      ]).id
    ).toBe(6)
  })
})
