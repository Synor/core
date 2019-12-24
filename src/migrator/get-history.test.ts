import { getHistory } from './get-history'
import { getMigrationRecord } from './index.utils.test'

const database = {
  records: jest.fn()
}

describe('migrator:getHistory', () => {
  test('works as expected', async () => {
    database.records.mockImplementationOnce(() =>
      Promise.resolve([
        getMigrationRecord({ id: 1, version: '01', type: 'do' }),
        getMigrationRecord({ id: 2, version: '02', type: 'do' }),
        getMigrationRecord({ id: 3, version: '03', type: 'do' }),
        getMigrationRecord({ id: 4, version: '03', type: 'undo' }),
        getMigrationRecord({ id: 5, version: '02', type: 'undo' })
      ])
    )

    await expect(
      getHistory(database as any, '01', 1)
    ).resolves.toMatchSnapshot()
  })
})
