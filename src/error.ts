/* eslint-disable no-dupe-class-members */

type MigrationRecord = import('./migration').MigrationRecord

type SynorMigrationErrorType = 'not_found'
type SynorValidationErrorType = 'dirty' | 'hash_mismatch'

type SynorErrorType =
  | SynorMigrationErrorType
  | SynorValidationErrorType
  | 'invalid_filename'
  | 'exception'

type SynorErrorDataType = {
  dirty: MigrationRecord
  hash_mismatch: MigrationRecord
  not_found: Partial<MigrationRecord>
  invalid_filename: { filename: string }
  exception: Error | Record<string, any>
}

export class SynorError<
  ErrorType extends SynorErrorType = 'exception'
> extends Error {
  type: ErrorType
  data: SynorErrorDataType[ErrorType]

  /**
   * Creates a general instance of SynorError
   *
   * @param message Error message
   */
  constructor(message: string)

  /**
   * Creates a special instance of SynorError with `type` and `data`
   *
   * @param message Error message
   * @param type Error type
   * @param data Error data
   */
  constructor(
    message: string,
    type: ErrorType,
    data: SynorErrorDataType[ErrorType]
  )

  constructor(
    message: string,
    type: SynorErrorType = 'exception',
    data: SynorErrorDataType[SynorErrorType] = {}
  ) {
    super(message)

    Error.captureStackTrace(this, this.constructor)

    if (data instanceof Error) {
      this.stack = `${data.stack}\n${this.stack}`
    }

    this.name = this.constructor.name
    this.type = type as ErrorType
    this.data = data as SynorErrorDataType[ErrorType]
  }
}

export function toSynorError<T extends SynorErrorType = 'exception'>(
  error: Error | SynorError<T>
): SynorError<T> {
  if (error instanceof SynorError) {
    return error
  }

  return new SynorError(
    `Exception: ${error.message}`,
    'exception',
    error
  ) as SynorError<T>
}
