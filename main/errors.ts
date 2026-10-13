import type { ErrorCode } from '../shared/ipc'

// An expected failure (bad input, missing permission…) that is safe to show to the user.
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = code
  ) {
    super(message)
    this.name = 'AppError'
  }
}
