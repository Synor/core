/* eslint-disable no-dupe-class-members */

type MigrationRecord = import('./migration').MigrationRecord

type SynorErrorStore = {
  dirty: MigrationRecord
  hash_mismatch: MigrationRecord
  invalid_filename: { filename: string }
  not_found: Partial<MigrationRecord>
  exception: Error | null
}

export type SynorErrorType = keyof SynorErrorStore

type SynorErrorData<
  ErrorType extends SynorErrorType
> = SynorErrorStore[ErrorType]

export class SynorError<
  ErrorType extends SynorErrorType = 'exception',
  ErrorData extends SynorErrorData<ErrorType> = SynorErrorData<ErrorType>
> extends Error {
  type: ErrorType
  data: ErrorData

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
  constructor(message: string, type: ErrorType, data: NonNullable<ErrorData>)

  constructor(
    message: string,
    type: SynorErrorType = 'exception',
    data: SynorErrorData<SynorErrorType> = null
  ) {
    super(message)

    Error.captureStackTrace(this, this.constructor)

    if (data instanceof Error) {
      this.stack = `${data.stack}\n${this.stack}`
    }

    this.name = this.constructor.name
    this.type = type as ErrorType
    this.data = data as ErrorData
  }
}

/**
 * Checks if `error` is an instance of `SynorError`.
 *
 * Optionally, checks if the instance of `SynorError` has the exact `type`.
 *
 * @param error Error
 * @param type `SynorError` type
 */
export function isSynorError<T extends SynorErrorType | undefined>(
  error: Error,
  type?: T
): error is SynorError<
  T extends SynorErrorType ? T : SynorErrorType,
  T extends SynorErrorType ? SynorErrorStore[T] : any
> {
  if (error instanceof SynorError) {
    return type ? error.type === type : true
  }

  return false
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
