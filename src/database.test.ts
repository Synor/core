import { SynorDatabase } from './database'

const synorDatabaseParams: Parameters<typeof SynorDatabase>[0] = {
  DatabaseEngine: () => null as any,
  databaseUri: '',
  baseVersion: '',
  getAdvisoryLockId: () => ['', ''],
  getUserInfo: () => Promise.resolve('')
}

describe('SynorDatabase', () => {
  let params: typeof synorDatabaseParams

  beforeEach(() => {
    params = { ...synorDatabaseParams }
  })

  test('throws if DatabaseEngine is not function', () => {
    params.DatabaseEngine = null as any
    expect(() => SynorDatabase(params)).toThrow()
  })

  test('can be initialized', () => {
    const engineFactory = jest.spyOn(params, 'DatabaseEngine')
    const engine = SynorDatabase(params)
    expect(engineFactory).toHaveBeenCalledWith(params.databaseUri, {
      baseVersion: params.baseVersion,
      getAdvisoryLockId: params.getAdvisoryLockId,
      getUserInfo: params.getUserInfo
    })
    expect(engine).toBeDefined()
  })
})
