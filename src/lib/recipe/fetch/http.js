// 공통 HTTP 유틸. 브라우저 흉내를 내야 유튜브/네이버가 정상 HTML을 준다.
export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export async function getText(url, { timeout = 20000, headers = {} } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    // 네이버 계열은 아직 EUC-KR로 내려주는 페이지가 남아 있다.
    const ct = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    const charset = /charset=([\w-]+)/i.exec(ct)?.[1]?.toLowerCase();
    const sniff = charset || sniffCharset(buf);
    if (sniff && !/utf-?8/.test(sniff)) {
      try {
        return new TextDecoder(sniff).decode(buf);
      } catch {
        /* 지원 안 하는 인코딩이면 utf-8로 폴백 */
      }
    }
    return buf.toString('utf8');
  } finally {
    clearTimeout(timer);
  }
}

function sniffCharset(buf) {
  const head = buf.subarray(0, 2048).toString('latin1');
  return /charset=["']?([\w-]+)/i.exec(head)?.[1]?.toLowerCase() || null;
}

export function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}
