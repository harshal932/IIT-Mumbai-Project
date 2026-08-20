/** Demo feed IDs used when the database is empty or offline. */
export function isDemoProblemId(id: string): boolean {
  return id.startsWith("sample-") || id.startsWith("problem-");
}
