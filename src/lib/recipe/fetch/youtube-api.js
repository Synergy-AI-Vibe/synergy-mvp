// YouTube Data API v3 어댑터.
//
// 스크래핑 경로(youtube.js)와 "가져오는 내용"은 완전히 동일하다 — 설명란 텍스트와
// 고정 댓글 텍스트. 달라지는 건 경로의 성질뿐이다.
//
//   스크래핑: 키 불필요 / 데이터센터 IP에서 봇 차단당함 / 약관 회색지대
//   Data API: 키 필요   / 차단 없음 / 공식 / 할당량 10,000유닛/일
//
// videos.list 와 commentThreads.list 는 각각 1유닛이라 영상 1건당 2유닛,
// 하루 5,000건까지 조회할 수 있다.
import '../env.js'; // .env 의 YOUTUBE_API_KEY 를 process.env 로 올린다

const BASE = 'https://www.googleapis.com/youtube/v3';

export function apiKey() {
  return process.env.YOUTUBE_API_KEY || null;
}

async function call(path, params) {
  const key = apiKey();
  if (!key) throw new Error('YOUTUBE_API_KEY 환경변수가 없습니다.');
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`${BASE}/${path}?${qs}`);
  const text = await res.text();
  if (!res.ok) {
    let reason = '';
    try {
      reason = JSON.parse(text).error?.errors?.[0]?.reason || '';
    } catch {
      /* 본문이 JSON이 아니면 무시 */
    }
    const err = new Error(`YouTube API ${res.status}${reason ? ` (${reason})` : ''}: ${text.slice(0, 200)}`);
    err.status = res.status;
    err.reason = reason;
    throw err;
  }
  return JSON.parse(text);
}

/** 영상 메타데이터 + 설명란. 할당량 1유닛. */
export async function fetchVideo(videoId) {
  const data = await call('videos', { part: 'snippet', id: videoId });
  const item = data.items?.[0];
  if (!item) return { ok: false, reason: 'NOT_FOUND', message: '영상을 찾을 수 없습니다(비공개·삭제·잘못된 ID).' };
  const s = item.snippet;
  return {
    ok: true,
    videoId,
    title: s.title,
    channel: s.channelTitle,
    text: s.description || '',
    publishedAt: s.publishedAt,
  };
}

/**
 * 고정 댓글. 할당량 1유닛.
 * order=relevance 는 고정 댓글을 맨 앞에 올려주지만 문서상 보장은 아니다.
 * 채널 주인의 댓글을 우선 고르는 식으로 한 번 더 걸러 준다.
 */
export async function fetchTopComment(videoId, channelId) {
  let data;
  try {
    data = await call('commentThreads', {
      part: 'snippet',
      videoId,
      order: 'relevance',
      maxResults: '5',
      textFormat: 'plainText',
    });
  } catch (e) {
    // 댓글을 꺼둔 영상은 403 commentsDisabled — 실패가 아니라 정상 상태다.
    if (e.reason === 'commentsDisabled') return { ok: false, reason: 'COMMENTS_DISABLED' };
    throw e;
  }
  const items = data.items || [];
  if (!items.length) return { ok: false, reason: 'NO_COMMENTS' };

  const top = items.map((t) => t.snippet?.topLevelComment?.snippet).filter(Boolean);
  const byOwner = channelId ? top.find((c) => c.authorChannelId?.value === channelId) : null;
  const chosen = byOwner || top[0];
  if (!chosen?.textDisplay) return { ok: false, reason: 'NO_COMMENTS' };
  return {
    ok: true,
    text: chosen.textDisplay,
    author: chosen.authorDisplayName || null,
    byChannelOwner: !!byOwner,
  };
}

/** videos.list 는 channelId 도 주므로 고정 댓글 판별에 쓸 수 있게 함께 돌려준다. */
export async function fetchVideoWithChannel(videoId) {
  const data = await call('videos', { part: 'snippet', id: videoId });
  const item = data.items?.[0];
  if (!item) return { ok: false, reason: 'NOT_FOUND', message: '영상을 찾을 수 없습니다.' };
  const s = item.snippet;
  return {
    ok: true,
    videoId,
    title: s.title,
    channel: s.channelTitle,
    channelId: s.channelId,
    text: s.description || '',
  };
}
