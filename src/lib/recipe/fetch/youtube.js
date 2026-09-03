import { getText, UA } from './http.js';

// API 키 없이 watch 페이지 HTML 안의 ytInitialPlayerResponse 에서 설명란을 뽑는다.
// (기획서 2절: "영상/음성이 아니라 설명란 텍스트" 기반 추출)
export function parseVideoId(url) {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (!/(^|\.)youtube\.com$/.test(host) && host !== 'youtube-nocookie.com') return null;
    if (u.pathname === '/watch') return u.searchParams.get('v');
    const m = /^\/(shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

// HTML에 박힌 JSON 문자열 리터럴을 안전하게 되살린다.
function readJsonString(html, key) {
  const re = new RegExp(`"${key}":"((?:\\\\.|[^"\\\\])*)"`);
  const m = re.exec(html);
  if (!m) return null;
  try {
    return JSON.parse('"' + m[1] + '"');
  } catch {
    return null;
  }
}

// --- 고정 댓글 ---
// 설명란에 재료를 안 적고 "자세한 레시피는 고정 댓글 참고"로 넘기는 채널이 실제로 있다.
// 공개 innertube 키가 watch 페이지에 박혀 있어 API 키 없이 댓글을 읽을 수 있다.
function walk(obj, pred, out = []) {
  if (obj && typeof obj === 'object') {
    if (pred(obj)) out.push(obj);
    for (const k of Object.keys(obj)) walk(obj[k], pred, out);
  }
  return out;
}

function extractEmbeddedJson(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const start = html.indexOf('{', i);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = start; j < html.length; j++) {
    const c = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, j + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export async function fetchPinnedComment(videoId, html) {
  const page = html ?? (await getText(`https://www.youtube.com/watch?v=${videoId}`));
  const apiKey = /"INNERTUBE_API_KEY":"([^"]+)"/.exec(page)?.[1];
  const clientVersion = /"INNERTUBE_CLIENT_VERSION":"([^"]+)"/.exec(page)?.[1] || '2.20240101.00.00';
  const initial = extractEmbeddedJson(page, 'ytInitialData');
  const section = walk(initial, (o) => o.itemSectionRenderer?.sectionIdentifier === 'comment-item-section');
  const token = walk(section, (o) => o.continuationCommand?.token)[0]?.continuationCommand?.token;
  if (!apiKey || !token) return { ok: false, reason: 'NO_COMMENT_CONTINUATION' };

  const res = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion, hl: 'ko', gl: 'KR' } },
      continuation: token,
    }),
  });
  if (!res.ok) return { ok: false, reason: `COMMENT_HTTP_${res.status}` };
  const next = await res.json();

  // 신형 응답은 본문이 frameworkUpdates 의 entity 로 분리돼 있고, 목록의 첫 스레드가 고정 댓글이다.
  const payloads = (next?.frameworkUpdates?.entityBatchUpdate?.mutations || [])
    .map((m) => m.payload?.commentEntityPayload)
    .filter((p) => p?.properties?.content?.content);
  const first = payloads[0];
  if (!first) return { ok: false, reason: 'NO_COMMENTS' };
  return { ok: true, text: first.properties.content.content, author: first.author?.displayName || null };
}

// 설명란/고정 댓글에 걸린 외부 레시피 링크. 링크인바이오·쇼핑·SNS는 건너뛴다.
const LINK_DENY = /(youtube\.com|youtu\.be|litt\.ly|linktr\.ee|instagram|facebook|twitter|x\.com|threads|tiktok|coupang|smartstore|link\.coupang|kakao|band\.us|open\.kakao)/i;
const LINK_PREFER = /(tistory\.com|blog\.naver\.com|brunch\.co\.kr|blogspot|wordpress|velog\.io|postype)/i;

export function findRecipeLinks(text) {
  const urls = [...String(text || '').matchAll(/https?:\/\/[^\s<>"')\]]+/g)].map((m) => m[0].replace(/[.,)]+$/, ''));
  const usable = urls.filter((u) => !LINK_DENY.test(u));
  return [...usable.filter((u) => LINK_PREFER.test(u)), ...usable.filter((u) => !LINK_PREFER.test(u))];
}

export async function fetchYoutube(url) {
  const videoId = parseVideoId(url);
  if (!videoId) {
    return { ok: false, source: 'youtube', reason: 'INVALID_URL', message: '유튜브 URL 형식이 아닙니다.' };
  }
  const html = await getText(`https://www.youtube.com/watch?v=${videoId}`);

  const description = readJsonString(html, 'shortDescription');
  const title = readJsonString(html, 'title');
  const channel = readJsonString(html, 'ownerChannelName') || readJsonString(html, 'author');

  if (description == null) {
    // 동의 페이지 / 봇 차단 / 삭제된 영상 등
    const blocked = /consent\.youtube\.com|CONSENT|Sign in to confirm/i.test(html);
    return {
      ok: false,
      source: 'youtube',
      videoId,
      reason: blocked ? 'BLOCKED' : 'NO_PLAYER_RESPONSE',
      message: blocked
        ? '유튜브가 봇으로 판단해 설명란을 내려주지 않았습니다.'
        : '설명란 데이터를 찾지 못했습니다.',
    };
  }
  if (description.trim() === '') {
    return {
      ok: false,
      source: 'youtube',
      videoId,
      title,
      channel,
      reason: 'EMPTY_DESCRIPTION',
      message: '이 영상은 설명란이 비어 있습니다.',
      text: '',
      html,
    };
  }

  return {
    ok: true,
    source: 'youtube',
    videoId,
    title,
    channel,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    text: description,
    html,
  };
}
