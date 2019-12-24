import { EventEmitter } from 'events'
import { SynorDatabase } from '../database'
import { SynorMigrationError, SynorError } from '../error'
import { SynorSource } from '../source'
import * as getCurrentRecordModule from './get-current-record'
import * as getHistoryModule from './get-history'
import * as getMigrationModule from './get-migration'
import * as getMigrationsToRunModule from './get-migrations-to-run'
import * as getRecordsToRepairModule from './get-records-to-repair'
import { SynorMigrator } from './index'
import * as validateMigrationModule from './validate-migration'

const database = {
  open: jest.fn(),
  close: jest.fn(),
  lock: jest.fn(),
  unlock: jest.fn(),
  drop: jest.fn(),
  run: jest.fn(),
  repair: jest.fn()
}

jest.mock('../database', () => ({
  SynorDatabase: jest.fn(() => database)
}))

const source = {
  open: jest.fn(),
  close: jest.fn(),
  last: jest.fn()
}

jest.mock('../source', () => ({
  SynorSource: jest.fn(() => source)
}))

jest.mock('./get-history', () => ({
  getHistory: jest.fn()
}))

jest.mock('./get-current-record', () => ({
  getCurrentRecord: jest.fn()
}))

jest.mock('./get-migration', () => ({
  getMigration: jest.fn()
}))

jest.mock('./get-migrations-to-run', () => ({
  getMigrationsToRun: jest.fn()
}))

jest.mock('./get-records-to-repair', () => ({
  getRecordsToRepair: jest.fn()
}))

jest.mock('./validate-migration', () => ({
  validateMigration: jest.fn()
}))

describe('SynorMigrator', () => {
  test('can be initialized', () => {
    const config = {}

    const migrator = new SynorMigrator(config as any)

    expect(SynorDatabase).toBeCalledWith(config)
    expect(SynorSource).toBeCalledWith(config)
    expect(migrator).toBeInstanceOf(EventEmitter)
  })

  describe('internals', () => {
    let migrator: SynorMigrator

    beforeAll(() => {
      migrator = new SynorMigrator({ baseVersion: '01' } as any)
    })

    beforeEach(() => {
      migrator.removeAllListeners()
    })

    test('lock throws if already locked', async () => {
      migrator.on('error', error => {
        throw error
      })

      // @ts-ignore
      await expect(migrator.lock()).resolves.toBeUndefined()
      // @ts-ignore
      await expect(migrator.lock()).rejects.toThrowError(SynorError)
    })

    test('unlock throws if not locked first', async () => {
      migrator.on('error', error => {
        throw error
      })

      // @ts-ignore
      migrator.locked = false
      // @ts-ignore
      await expect(migrator.unlock()).rejects.toThrowError(SynorError)
    })

    test('emitOrThrow throws error if no listener', () => {
      try {
        // @ts-ignore
        migrator.emitOrThrow('validate:error', new Error())
      } catch (error) {
        expect(error).toBeInstanceOf(SynorError)
      }
    })
  })

  describe('methods: {open,close}', () => {
    const onSpy = jest.fn()

    let migrator: SynorMigrator

    beforeEach(() => {
      jest.clearAllMocks()

      migrator = new SynorMigrator({} as any)
    })

    test('open', async () => {
      migrator.on('open:start', onSpy).on('open:end', onSpy)

      await expect(migrator.open()).resolves.toBeUndefined()

      expect(database.open).toHaveBeenCalled()
      expect(source.open).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
        ]
      `)
    })

    test('close', async () => {
      migrator.on('close:start', onSpy).on('close:end', onSpy)

      await expect(migrator.close()).resolves.toBeUndefined()

      expect(database.close).toHaveBeenCalled()
      expect(source.close).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
        ]
      `)
    })

    test('close (with lock)', async () => {
      migrator.on('close:start', onSpy).on('close:end', onSpy)

      // @ts-ignore
      jest.spyOn(migrator, 'unlock')

      // @ts-ignore
      migrator.locked = true
      await expect(migrator.close()).resolves.toBeUndefined()

      // @ts-ignore
      expect(migrator.unlock).toHaveBeenCalled()
      expect(database.close).toHaveBeenCalled()
      expect(source.close).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
        ]
      `)
    })
  })

  describe('methods', () => {
    const onSpy = jest.fn()

    let migrator: SynorMigrator

    beforeAll(() => {
      migrator = new SynorMigrator({ baseVersion: '01' } as any)
    })

    beforeEach(async () => {
      jest.resetAllMocks()

      await migrator.open()

      migrator
        .removeAllListeners()
        .on('lock:start', onSpy)
        .on('lock:end', onSpy)
        .on('unlock:start', onSpy)
        .on('unlock:end', onSpy)
    })

    afterEach(async () => {
      await migrator.close()
    })

    test('drop', async () => {
      migrator.on('drop:start', onSpy).on('drop:end', onSpy)

      await expect(migrator.drop()).resolves.toBeUndefined()

      expect(database.lock).toHaveBeenCalled()
      expect(database.drop).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('current', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)
      jest
        .spyOn(getCurrentRecordModule, 'getCurrentRecord')
        .mockReturnValue('current-record' as any)

      migrator
        .on('current:start', onSpy)
        .on('current', onSpy)
        .on('current:end', onSpy)

      await expect(migrator.current()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(
        jest.spyOn(getCurrentRecordModule, 'getCurrentRecord')
      ).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            "current-record",
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('history', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)

      migrator
        .on('history:start', onSpy)
        .on('history', onSpy)
        .on('history:end', onSpy)

      await expect(migrator.history()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            "history",
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('pending (early return)', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)
      jest
        .spyOn(getCurrentRecordModule, 'getCurrentRecord')
        .mockReturnValue({ version: '99' } as any)
      source.last.mockResolvedValue('01')
      jest
        .spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
        .mockResolvedValue('pending' as any)

      migrator
        .on('pending:start', onSpy)
        .on('pending', onSpy)
        .on('pending:end', onSpy)

      await expect(migrator.pending()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(
        jest.spyOn(getCurrentRecordModule, 'getCurrentRecord')
      ).toHaveBeenCalled()
      expect(source.last).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            Array [],
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('pending', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)
      jest
        .spyOn(getCurrentRecordModule, 'getCurrentRecord')
        .mockReturnValue({ version: '01' } as any)
      source.last.mockResolvedValue('99')
      jest
        .spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
        .mockResolvedValue('pending' as any)

      migrator
        .on('pending:start', onSpy)
        .on('pending', onSpy)
        .on('pending:end', onSpy)

      await expect(migrator.pending()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(
        jest.spyOn(getCurrentRecordModule, 'getCurrentRecord')
      ).toHaveBeenCalled()
      expect(source.last).toHaveBeenCalled()
      expect(
        jest.spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
      ).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            "pending",
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('validate (throws if migration not found)', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue([{ type: 'do', state: 'applied' }] as any)
      jest.spyOn(getMigrationModule, 'getMigration').mockResolvedValue(null)

      migrator
        .on('validate:start', onSpy)
        .on('validate:run:start', onSpy)
        .on('validate:error', onSpy)
        .on('validate:run:end', onSpy)
        .on('validate:end', onSpy)
        .on('error', error => {
          throw error
        })

      try {
        await migrator.validate()
      } catch (error) {
        expect(error).toBeInstanceOf(SynorMigrationError)
        expect(error.type).toMatchInlineSnapshot(`"not_found"`)
      }

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(jest.spyOn(getMigrationModule, 'getMigration')).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            Object {
              "state": "applied",
              "type": "do",
            },
          ],
          Array [],
          Array [],
        ]
      `)
    })

    test('validate (if invalid)', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue([{ type: 'do', state: 'applied' }] as any)
      jest
        .spyOn(getMigrationModule, 'getMigration')
        .mockResolvedValue('migration' as any)
      jest
        .spyOn(validateMigrationModule, 'validateMigration')
        .mockImplementation(() => {
          throw new Error('validate-error')
        })

      migrator
        .on('validate:start', onSpy)
        .on('validate:run:start', onSpy)
        .on('validate:error', onSpy)
        .on('validate:run:end', onSpy)
        .on('validate:end', onSpy)

      await expect(migrator.validate()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(jest.spyOn(getMigrationModule, 'getMigration')).toHaveBeenCalled()
      expect(
        jest.spyOn(validateMigrationModule, 'validateMigration')
      ).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            Object {
              "state": "applied",
              "type": "do",
            },
          ],
          Array [
            [SynorError: Exception: validate-error],
            Object {
              "state": "applied",
              "type": "do",
            },
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('validate (if valid)', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue([{ type: 'do', state: 'applied' }] as any)
      jest
        .spyOn(getMigrationModule, 'getMigration')
        .mockResolvedValue('migration' as any)
      jest.spyOn(validateMigrationModule, 'validateMigration')

      migrator
        .on('validate:start', onSpy)
        .on('validate:run:start', onSpy)
        .on('validate:error', onSpy)
        .on('validate:run:end', onSpy)
        .on('validate:end', onSpy)

      await expect(migrator.validate()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(jest.spyOn(getMigrationModule, 'getMigration')).toHaveBeenCalled()
      expect(
        jest.spyOn(validateMigrationModule, 'validateMigration')
      ).toHaveBeenCalled()

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            Object {
              "state": "applied",
              "type": "do",
            },
          ],
          Array [
            Object {
              "state": "applied",
              "type": "do",
            },
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('migrate (run error)', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)
      jest
        .spyOn(getCurrentRecordModule, 'getCurrentRecord')
        .mockReturnValue('current' as any)
      jest
        .spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
        .mockResolvedValue(['migration'] as any)
      database.run.mockRejectedValue(new Error('run-error'))

      migrator
        .on('migrate:start', onSpy)
        .on('migrate:run:start', onSpy)
        .on('migrate:error', onSpy)
        .on('migrate:run:end', onSpy)
        .on('migrate:end', onSpy)

      await expect(migrator.migrate('target' as any)).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(
        jest.spyOn(getCurrentRecordModule, 'getCurrentRecord')
      ).toHaveBeenCalled()
      expect(
        jest.spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
      ).toHaveBeenCalled()
      expect(database.run).toHaveBeenCalledWith('migration')

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            "migration",
          ],
          Array [
            [SynorError: Exception: run-error],
            "migration",
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('migrate', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)
      jest
        .spyOn(getCurrentRecordModule, 'getCurrentRecord')
        .mockReturnValue('current' as any)
      jest
        .spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
        .mockResolvedValue(['migration'] as any)

      migrator
        .on('migrate:start', onSpy)
        .on('migrate:run:start', onSpy)
        .on('migrate:error', onSpy)
        .on('migrate:run:end', onSpy)
        .on('migrate:end', onSpy)

      await expect(migrator.migrate('target' as any)).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(
        jest.spyOn(getCurrentRecordModule, 'getCurrentRecord')
      ).toHaveBeenCalled()
      expect(
        jest.spyOn(getMigrationsToRunModule, 'getMigrationsToRun')
      ).toHaveBeenCalled()
      expect(database.run).toHaveBeenCalledWith('migration')

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [
            "migration",
          ],
          Array [
            "migration",
          ],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })

    test('repair', async () => {
      jest
        .spyOn(getHistoryModule, 'getHistory')
        .mockResolvedValue('history' as any)
      jest
        .spyOn(getRecordsToRepairModule, 'getRecordsToRepair')
        .mockReturnValue('records-to-repair' as any)

      migrator.on('repair:start', onSpy).on('repair:end', onSpy)

      await expect(migrator.repair()).resolves.toBeUndefined()

      expect(jest.spyOn(getHistoryModule, 'getHistory')).toHaveBeenCalled()
      expect(
        jest.spyOn(getRecordsToRepairModule, 'getRecordsToRepair')
      ).toHaveBeenCalled()
      expect(database.repair).toHaveBeenCalledWith('records-to-repair')

      expect(onSpy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [],
          Array [],
          Array [],
          Array [],
          Array [],
          Array [],
        ]
      `)
    })
  })
})
