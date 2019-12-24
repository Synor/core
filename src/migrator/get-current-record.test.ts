import { getCurrentRecord } from './get-current-record'
import { getMigrationHistoryItem } from './index.utils.test'

describe('migrator:getCurrentRecord', () => {
  test('works as expected', () => {
    expect(
      getCurrentRecord([
        getMigrationHistoryItem({ id: 1, version: '01', type: 'do' }),
        getMigrationHistoryItem({
          id: 2,
          version: '02',
          type: 'do',
          state: 'reverted',
          revertedBy: 5
        }),
        getMigrationHistoryItem({
          id: 3,
          version: '03',
          type: 'do',
          state: 'reverted',
          revertedBy: 4
        }),
        getMigrationHistoryItem({ id: 4, version: '03', type: 'undo' }),
        getMigrationHistoryItem({ id: 5, version: '02', type: 'undo' }),
        getMigrationHistoryItem({ id: 6, version: '02', type: 'do' })
      ]).id
    ).toBe(6)
  })
})
