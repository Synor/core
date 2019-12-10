type MigrationRecord = import('./migration').MigrationRecord

type SynorMigrationErrorType = 'not_found'
type SynorValidationErrorType = 'dirty' | 'hash_mismatch'

type SynorErrorType =
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
