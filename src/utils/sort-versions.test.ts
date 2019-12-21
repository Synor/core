import { sortVersions } from './sort-versions'

const versions = ['004', '002', '001', '003', '002']
const ascVersions = ['001', '002', '002', '003', '004']
const descVersions = ['004', '003', '002', '002', '001']

describe('utils:sortVersions', () => {
  test('sorts (default: ASC)', () => {
    expect(sortVersions(versions)).toEqual(ascVersions)
  })

  test('sorts (ASC)', () => {
    expect(sortVersions(versions, 'ASC')).toEqual(ascVersions)
  })

  test('sorts (DESC)', () => {
    expect(sortVersions(versions, 'DESC')).toEqual(descVersions)
  })

  test('does not mutate input', () => {
    const input = versions
    const output = sortVersions(input)
    expect(input).not.toEqual(output)
  })
})
