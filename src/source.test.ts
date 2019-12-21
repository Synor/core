import { SynorSource } from './source'

const synorSourceParams: Parameters<typeof SynorSource>[0] = {
  SourceEngine: () => null as any,
  sourceUri: '',
  migrationInfoParser: () => null as any
}

describe('SynorSource', () => {
  let params: typeof synorSourceParams

  beforeEach(() => {
    params = { ...synorSourceParams }
  })

  test('throws if SourceEngine is not function', () => {
    params.SourceEngine = null as any
    expect(() => SynorSource(params)).toThrow()
  })

  test('can be initialized', () => {
    const engineFactory = jest.spyOn(params, 'SourceEngine')
    const engine = SynorSource(params)
    expect(engineFactory).toHaveBeenCalledWith(params.sourceUri, {
      migrationInfoParser: params.migrationInfoParser
    })
    expect(engine).toBeDefined()
  })
})
