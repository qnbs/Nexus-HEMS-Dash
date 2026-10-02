/** Client error from settings patch validation or apply (HTTP 400). */
export class SettingsPatchError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'SettingsPatchError';
  }
}
