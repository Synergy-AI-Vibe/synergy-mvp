import { getText, decodeEntities } from './http.js';

// 블로그 본문 텍스트 추출.
// 기획서 2절 메모대로 "범용 파서"는 위험하므로, 주요 플랫폼(네이버/티스토리/브런치)은
// 본문 컨테이너를 직접 찍고, 나머지는 일반 휴리스틱으로 폴백한다.

const BLOCK_TAGS =
  'p|div|br|li|tr|h1|h2|h3|h4|h5|h6|section|article|blockquote|figcaption|td|dd|dt';

export function htmlToText(html) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|iframe|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(new RegExp(`<\\s*(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi'), '\n')
    .replace(new RegExp(`<\\s*/\\s*(?:${BLOCK_TAGS})\\s*>`, 'gi'), '\n')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s
    .split('\n')
    .map((l) => l.replace(/[​ ﻿]/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 여는 태그 위치에서 시작해 짝이 맞는 닫는 태그까지 잘라낸다 (중첩 div 대응).
function sliceElement(html, startIdx, tag) {
  const open = new RegExp(`<${tag}\\b`, 'gi');
  const close = new RegExp(`</${tag}\\s*>`, 'gi');
  let depth = 0;
  let i = startIdx;
  while (i < html.length) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return html.slice(startIdx);
    if (o && o.index < c.index) {
      depth++;
      i = o.index + 1;
    } else {
      depth--;
      i = c.index + 1;
      if (depth <= 0) return html.slice(startIdx, c.index + c[0].length);
    }
  }
  return html.slice(startIdx);
}

function extractByMarker(html, markerRe, tag = 'div') {
  const m = markerRe.exec(html);
  if (!m) return null;
  // 마커(class/id)가 들어 있는 여는 태그의 시작 위치를 찾는다.
  const start = html.lastIndexOf('<', m.index);
  if (start < 0) return null;
  return sliceElement(html, start, tag);
}

const CONTAINERS = [
  { name: 'naver-se', re: /class="[^"]*se-main-container[^"]*"/i, tag: 'div' },
  { name: 'naver-legacy', re: /id="postViewArea"/i, tag: 'div' },
  { name: 'tistory-entry', re: /class="[^"]*(?:entry-content|article-view|tt_article_useless_p_margin)[^"]*"/i, tag: 'div' },
  { name: 'brunch', re: /class="[^"]*wrap_body[^"]*"/i, tag: 'div' },
  { name: 'article', re: /<article\b/i, tag: 'article' },
  { name: 'main', re: /<main\b/i, tag: 'main' },
];

// 네이버 블로그는 본문이 iframe 안에 있어서 원본 URL로는 빈 껍데기만 온다.
export function naverPostViewUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)blog\.naver\.com$/.test(u.hostname)) return null;
  let blogId = u.searchParams.get('blogId');
  let logNo = u.searchParams.get('logNo');
  if (!blogId || !logNo) {
    const m = /^\/([^/]+)\/(\d+)/.exec(u.pathname);
    if (m) {
      blogId = m[1];
      logNo = m[2];
    }
  }
  if (!blogId || !logNo) return null;
  return `https://blog.naver.com/PostView.naver?blogId=${encodeURIComponent(
    blogId
  )}&logNo=${encodeURIComponent(logNo)}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
}

export async function fetchBlog(inputUrl) {
  const fetchUrl = naverPostViewUrl(inputUrl) || inputUrl;
  let html;
  try {
    html = await getText(fetchUrl);
  } catch (e) {
    return { ok: false, source: 'blog', reason: 'FETCH_FAILED', message: `페이지를 불러오지 못했습니다: ${e.message}` };
  }

  const title =
    decodeEntities(/<meta[^>]+property="og:title"[^>]*content="([^"]*)"/i.exec(html)?.[1] || '') ||
    decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '').trim();

  let containerName = 'fallback-body';
  let text = '';
  for (const c of CONTAINERS) {
    const frag = extractByMarker(html, c.re, c.tag);
    if (!frag) continue;
    const t = htmlToText(frag);
    if (t.length >= 120) {
      containerName = c.name;
      text = t;
      break;
    }
  }
  if (!text) text = htmlToText(html);

  if (text.replace(/\s/g, '').length < 50) {
    return {
      ok: false,
      source: 'blog',
      url: inputUrl,
      title,
      reason: 'NO_CONTENT',
      message: '본문 텍스트를 충분히 찾지 못했습니다. (JS 렌더링 페이지일 수 있음)',
      container: containerName,
      text,
    };
  }

  return { ok: true, source: 'blog', url: inputUrl, fetchUrl, title, container: containerName, text };
}
