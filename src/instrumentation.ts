/**
 * Next 서버 프로세스 시작 시 1회 실행.
 *
 * 이 로컬(Windows)에서 IPv6 경로가 간헐적으로 ECONNRESET 을 내
 * 외부 API(fetch) 호출이 절반쯤 죽는 것을 확인했습니다 (Gemini에서 재현).
 * DNS 해석을 IPv4 우선으로 바꿔 안정화합니다. Vercel 에서도 무해합니다.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns')
    dns.setDefaultResultOrder('ipv4first')
  }
}
