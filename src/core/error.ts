/* eslint-disable no-dupe-class-members */

type MigrationRecord = import('./migration').MigrationRecord

type SynorDatabaseErrorType = 'lock_error' | 'unlock_error'
type SynorMigrationErrorType = 'not_found'
type SynorValidationErrorType = 'dirty' | 'hash_mismatch'

type SynorErrorType =
  | SynorDatabaseErrorType
  | SynorMigrationErrorType
  | SynorValidationErrorType
  | 'exception'

export class SynorError extends Error {
  type: SynorErrorType
  data: any

  constructor(
    message: string,
    data: any = {},
    type: SynorErrorType = 'exception'
  ) {
    super(message)

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.type = type
    this.data = data
  }
}

type SynorDatabaseErrorMeta = {
  lockId?: string
}

export class SynorDatabaseError extends SynorError {
  type!: SynorDatabaseErrorType
  data!: SynorDatabaseErrorMeta

  constructor(
    type: 'lock_error' | 'unlock_error',
    data: Required<Pick<SynorDatabaseErrorMeta, 'lockId'>>
  )

  constructor(type: SynorDatabaseErrorType, data: SynorDatabaseErrorMeta) {
    super('SynorDatabaseError', data, type)
  }
}

export class SynorMigrationError extends SynorError {
  type!: SynorMigrationErrorType
  data!: Partial<MigrationRecord>

  constructor(type: SynorMigrationErrorType, data: Partial<MigrationRecord>) {
    super('SynorMigrationError', data, type)
  }
}

export class SynorValidationError extends SynorError {
  type!: SynorValidationErrorType
  data!: MigrationRecord

  constructor(type: SynorValidationErrorType, data: MigrationRecord) {
    super('SynorValidationError', data, type)
  }
}
