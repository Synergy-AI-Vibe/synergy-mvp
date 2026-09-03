// 02_동작규칙 2-2 판별식 — "직접 만들지 마세요" 지시에 따라 문서의 정규식을 그대로 이식

export function isYoutubeUrl(u: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?|shorts\/|live\/)|youtu\.be\/|m\.youtube\.com\/)/i.test(
    u.trim()
  );
}
