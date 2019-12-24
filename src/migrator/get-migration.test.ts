import { getMigration } from './get-migration'

const source = {
  get: jest.fn(),
  read: jest.fn()
}

describe('migrator:getMigration', () => {
  test('returns null (if not available)', async () => {
    source.get.mockImplementationOnce(() => Promise.resolve(null))

    await expect(getMigration(source as any, '99', 'do')).resolves.toBeNull()
    expect(source.get).toBeCalledWith('99', 'do')

    source.get.mockReset()
  })

  test('returns data (if available)', async () => {
    const info = { version: '01', type: 'do', title: '', filename: '' }

    source.get.mockImplementationOnce(() => Promise.resolve(info))
    source.read.mockImplementationOnce(() => Promise.resolve(Buffer.from('')))

    await expect(
      getMigration(source as any, '01', 'do')
    ).resolves.toMatchSnapshot()
    expect(source.get).toBeCalledWith('01', 'do')
    expect(source.read).toBeCalledWith(info)

    source.get.mockReset()
    source.read.mockReset()
  })
})
