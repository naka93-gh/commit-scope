/** unknown 型のエラーからメッセージ文字列を取得する */
export function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
