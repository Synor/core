import { SynorError } from '../error'
import { getMigrationRecordInfo, getMigrationSource } from '../__utils__.test'
import * as getMigrationModule from './get-migration'
import { getRecordsToRepair } from './get-records-to-repair'

jest.mock('./get-migration', () => ({
  getMigration: jest.fn()
}))

describe('migrator:getRecordsToRepair', () => {
  const source = {}

  test('throws is MigrationSource not found', async () => {
    jest.spyOn(getMigrationModule, 'getMigration').mockReset()
    jest
      .spyOn(getMigrationModule, 'getMigration')
      .mockImplementationOnce(() => Promise.resolve(null))

    const recordInfos = [
      getMigrationRecordInfo({ id: 1, version: '01', type: 'do' })
    ]

    try {
      await getRecordsToRepair(source as any, '0', recordInfos)
    } catch (error) {
      expect(error).toBeInstanceOf(SynorError)
      expect(error.type).toMatchInlineSnapshot(`"not_found"`)
    }
  })

  test('skips dirty records', async () => {
    jest.spyOn(getMigrationModule, 'getMigration').mockReset()
    jest
      .spyOn(getMigrationModule, 'getMigration')
      .mockImplementationOnce(() => Promise.resolve(null))

    const recordInfos = [
      getMigrationRecordInfo({ id: 1, version: '01', type: 'do', dirty: true })
    ]

    await expect(
      getRecordsToRepair(source as any, '0', recordInfos)
    ).resolves.toMatchSnapshot()
  })

  test('skips record with base version', async () => {
    jest.spyOn(getMigrationModule, 'getMigration').mockReset()
    jest
      .spyOn(getMigrationModule, 'getMigration')
      .mockImplementationOnce(() => Promise.resolve(null))

    const recordInfos = [
      getMigrationRecordInfo({ id: 1, version: '01', type: 'do' })
    ]

    await expect(
      getRecordsToRepair(source as any, '01', recordInfos)
    ).resolves.toMatchSnapshot()
  })

  test('works as expected', async () => {
    jest.spyOn(getMigrationModule, 'getMigration').mockReset()
    jest
      .spyOn(getMigrationModule, 'getMigration')
      .mockResolvedValueOnce(getMigrationSource({ version: '01', hash: '1' }))
      .mockResolvedValueOnce(
        getMigrationSource({ version: '02', type: 'undo' })
      )
      .mockResolvedValueOnce(getMigrationSource({ version: '02', hash: '2.x' }))

    const recordInfos = [
      getMigrationRecordInfo({ id: 1, version: '01', type: 'do', hash: '1' }),
      getMigrationRecordInfo({
        id: 2,
        version: '02',
        type: 'do',
        hash: '2',
        state: 'reverted',
        revertedBy: 4
      }),
      getMigrationRecordInfo({
        id: 3,
        version: '03',
        type: 'do',
        hash: '3',
        state: 'reverted',
        revertedBy: 4
      }),
      getMigrationRecordInfo({ id: 4, version: '02', type: 'undo' }),
      getMigrationRecordInfo({ id: 5, version: '02', type: 'do', hash: '2' })
    ]

    await expect(
      getRecordsToRepair(source as any, '0', recordInfos)
    ).resolves.toMatchSnapshot()
  })
})
