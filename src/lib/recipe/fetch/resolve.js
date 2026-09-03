// URL 하나를 받아 "재료를 찾을 때까지" 여러 소스를 순서대로 시도한다.
//
// 코퍼스를 보니 유튜브는 설명란에 재료가 있는 경우가 20%뿐이었고,
// 나머지 중 일부는 고정 댓글이나 거기 걸린 블로그 링크에 재료가 있었다.
// 그래서 단일 소스가 아니라 폴백 사슬로 설계한다.
//
//   유튜브: 설명란 → 고정 댓글 → (설명란·댓글에 걸린 블로그 링크)
//   블로그: 본문
//
// 어느 단계에서 성공했는지를 trail 로 남겨 UI에서 "어디서 가져왔는지"를 보여준다.
import { fetchYoutube, fetchPinnedComment, findRecipeLinks, parseVideoId } from './youtube.js';
import { apiKey as youtubeApiKey, fetchVideoWithChannel, fetchTopComment } from './youtube-api.js';
import { fetchBlog } from './blog.js';
import { extractIngredients } from '../parse/ingredients.js';

const MIN_ITEMS = 3;

// 기획 3.1 — 블로그 URL 입력과 유튜브 내부의 블로그 링크 추적을 모두 제외
// (약관 검토 전까지 비활성. 경로는 살려 두고 플래그로만 끈다)
const ENABLE_BLOG = false;

// 공식 Data API 키가 있으면 그쪽을 쓰고, 없으면 스크래핑으로 떨어진다.
// 가져오는 내용(설명란·고정 댓글 텍스트)은 양쪽이 동일하므로 이 아래 파이프라인은
// 어느 경로로 왔는지 신경 쓰지 않는다.
async function fetchYoutubeSource(input) {
  const videoId = parseVideoId(input);
  if (youtubeApiKey()) {
    try {
      const v = await fetchVideoWithChannel(videoId);
      if (!v.ok) return { via: 'api', ok: false, videoId, reason: v.reason, message: v.message };
      return { via: 'api', ok: true, ...v, url: `https://www.youtube.com/watch?v=${videoId}` };
    } catch (e) {
      // 할당량 초과·키 오류면 스크래핑으로 폴백해서 검증은 계속 굴러가게 한다.
      return { via: 'scrape', apiError: e.message, ...(await fetchYoutube(input)) };
    }
  }
  return { via: 'scrape', ...(await fetchYoutube(input)) };
}

async function fetchYoutubeComment(src) {
  if (src.via === 'api') {
    const c = await fetchTopComment(src.videoId, src.channelId);
    return c.ok ? { ok: true, text: c.text } : { ok: false, reason: c.reason };
  }
  return fetchPinnedComment(src.videoId, src.html);
}

const step = (name, label, status, detail, count = 0) => ({ name, label, status, detail, count });

export async function resolveRecipe(input) {
  const trail = [];

  if (!parseVideoId(input)) {
    if (!ENABLE_BLOG) {
      // 블로그가 유일한 경로이므로 skipped 를 남기고 실패 처리한다
      trail.push(step('blog', '블로그 본문', 'skipped', '기획 3.1 — 블로그 입력 비활성'));
      return {
        ok: false,
        source: 'blog',
        reason: 'BLOG_DISABLED',
        message: '블로그 주소는 지원하지 않아요. 유튜브 링크를 넣거나 재료를 직접 입력해 주세요.',
        text: '',
        extraction: extractIngredients('', { source: 'blog' }),
        trail,
        resolvedFrom: null,
      };
    }
    const blog = await fetchBlog(input);
    const ex = extractIngredients(blog.text || '', { source: 'blog' });
    trail.push(
      step(
        'blog',
        '블로그 본문',
        blog.ok && ex.items.length >= MIN_ITEMS ? 'ok' : blog.ok ? 'no-ingredients' : 'failed',
        blog.ok ? `본문 ${(blog.text || '').length}자 (${blog.container})` : blog.message,
        ex.items.length
      )
    );
    return { ...blog, extraction: ex, trail, resolvedFrom: trail[0].status === 'ok' ? 'blog' : null };
  }

  // --- 1단계: 설명란 ---
  const yt = await fetchYoutubeSource(input);
  const via = yt.via === 'api' ? '공식 API' : '스크래핑';
  const base = {
    source: 'youtube',
    videoId: yt.videoId,
    title: yt.title,
    channel: yt.channel,
    url: yt.url || input,
    fetchVia: yt.via,
  };
  const descEx = extractIngredients(yt.text || '', { source: 'youtube' });
  trail.push(
    step(
      'description',
      `유튜브 설명란 (${via})`,
      !yt.ok ? 'failed' : descEx.items.length >= MIN_ITEMS ? 'ok' : 'no-ingredients',
      !yt.ok ? yt.message : `설명란 ${(yt.text || '').length}자`,
      descEx.items.length
    )
  );
  if (descEx.items.length >= MIN_ITEMS) {
    return { ...base, ok: true, text: yt.text, extraction: descEx, trail, resolvedFrom: 'description' };
  }
  if (yt.reason === 'INVALID_URL' || yt.reason === 'BLOCKED') {
    return { ...base, ok: false, reason: yt.reason, message: yt.message, text: '', extraction: descEx, trail, resolvedFrom: null };
  }

  // --- 2단계: 고정 댓글 ---
  let pinnedText = '';
  try {
    const pinned = await fetchYoutubeComment(yt);
    pinnedText = pinned.ok ? pinned.text : '';
    const pinEx = extractIngredients(pinnedText, { source: 'youtube-pinned' });
    trail.push(
      step(
        'pinned',
        `고정 댓글 (${via})`,
        !pinned.ok ? 'failed' : pinEx.items.length >= MIN_ITEMS ? 'ok' : 'no-ingredients',
        pinned.ok ? `댓글 ${pinnedText.length}자` : pinned.reason,
        pinEx.items.length
      )
    );
    if (pinEx.items.length >= MIN_ITEMS) {
      return { ...base, ok: true, text: pinnedText, extraction: pinEx, trail, resolvedFrom: 'pinned' };
    }
  } catch (e) {
    trail.push(step('pinned', '고정 댓글', 'failed', e.message));
  }

  // --- 3단계: 설명란·고정 댓글에 걸린 블로그 링크 ---
  const links = [...findRecipeLinks(yt.text || ''), ...findRecipeLinks(pinnedText)];
  if (!ENABLE_BLOG && links.length) {
    trail.push(step('linked-blog', '연결된 블로그', 'skipped', `기획 3.1 — 블로그 추적 비활성 (링크 ${links.length}개 무시)`));
  }
  for (const link of ENABLE_BLOG ? links.slice(0, 2) : []) {
    try {
      const blog = await fetchBlog(link);
      const ex = extractIngredients(blog.text || '', { source: 'linked-blog' });
      trail.push(
        step(
          'linked-blog',
          '연결된 블로그',
          blog.ok && ex.items.length >= MIN_ITEMS ? 'ok' : blog.ok ? 'no-ingredients' : 'failed',
          link,
          ex.items.length
        )
      );
      if (ex.items.length >= MIN_ITEMS) {
        return { ...base, ok: true, text: blog.text, linkedUrl: link, extraction: ex, trail, resolvedFrom: 'linked-blog' };
      }
    } catch (e) {
      trail.push(step('linked-blog', '연결된 블로그', 'failed', `${link} — ${e.message}`));
    }
  }

  return {
    ...base,
    ok: false,
    reason: yt.reason || 'NO_INGREDIENTS',
    message: '설명란·고정 댓글·연결된 블로그 어디에서도 재료 목록을 찾지 못했습니다. 재료를 직접 입력해 주세요.',
    text: yt.text || '',
    extraction: descEx,
    trail,
    resolvedFrom: null,
  };
}
