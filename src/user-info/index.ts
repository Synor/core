/**
 * Extracts user information from the environment where the process is running.
 * Preferably automated, but can also be interactive.
 */
export type GetUserInfo = () => Promise<string>

export * from './git'
