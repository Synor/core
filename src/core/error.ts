/* eslint-disable no-dupe-class-members */

type MigrationRecord = import('./migration').MigrationRecord

type SynorDatabaseErrorType = 'LOCK_ERROR' | 'UNLOCK_ERROR'
type SynorMigrationErrorType = 'NOT_FOUND'
type SynorValidationErrorType = 'DIRTY' | 'HASH_MISMATCH'

type SynorErrorType =
  | SynorDatabaseErrorType
  | SynorMigrationErrorType
  | SynorValidationErrorType
  | 'EXCEPTION'

export class SynorError extends Error {
  type: SynorErrorType
  meta: any

  constructor(
    message: string,
    meta: any = {},
    type: SynorErrorType = 'EXCEPTION'
  ) {
    super(message)

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.type = type
    this.meta = meta
  }
}

type SynorDatabaseErrorMeta = {
  lockId?: string
}

export class SynorDatabaseError extends SynorError {
  type!: SynorDatabaseErrorType
  meta!: SynorDatabaseErrorMeta

  constructor(
    type: 'LOCK_ERROR' | 'UNLOCK_ERROR',
    meta: Required<Pick<SynorDatabaseErrorMeta, 'lockId'>>
  )

  constructor(type: SynorDatabaseErrorType, meta: SynorDatabaseErrorMeta) {
    super('Database Error', meta, type)
  }
}

export class SynorMigrationError extends SynorError {
  type!: SynorMigrationErrorType
  meta!: Partial<MigrationRecord>

  constructor(type: SynorMigrationErrorType, meta: Partial<MigrationRecord>) {
    super('Migration Error', meta, type)
  }
}

export class SynorValidationError extends SynorError {
  type!: SynorValidationErrorType
  meta!: Partial<MigrationRecord>

  constructor(type: SynorValidationErrorType, meta: Partial<MigrationRecord>) {
    super('Validation Error', meta, type)
  }
}
