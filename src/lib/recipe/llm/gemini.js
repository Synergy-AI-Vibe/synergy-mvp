// Gemini API 어댑터. 무료 티어(AI Studio 키)로 동작한다.
//
// 모델 이름은 하드코딩하지 않는다 — 구글이 모델을 자주 갈아치우고, 무료 티어에서
// 쓸 수 있는 모델도 계정마다 다르다. ListModels 로 실제 사용 가능한 것을 찾아 쓴다.
import '../env.js'; // .env 의 GEMINI_API_KEY 를 process.env 로 올린다

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// 키 풀: GEMINI_API_KEYS(쉼표 구분, 공백 없이)가 있으면 그걸 쓰고,
// 한 키가 할당량(429)에 걸리면 rotateApiKey() 로 다음 키로 넘어간다.
// 단일 GEMINI_API_KEY / GOOGLE_API_KEY 도 그대로 동작한다.
let keyIndex = 0;

function keyPool() {
  const multi = process.env.GEMINI_API_KEYS;
  if (multi) return multi.split(',').map((s) => s.trim()).filter(Boolean);
  const single = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return single ? [single] : [];
}

export function apiKey() {
  const pool = keyPool();
  if (!pool.length) return null;
  return pool[keyIndex % pool.length];
}

/** 현재 키가 할당량에 걸렸을 때 다음 키로 전환. 전환했으면 true. */
export function rotateApiKey() {
  const pool = keyPool();
  if (pool.length < 2) return false;
  keyIndex = (keyIndex + 1) % pool.length;
  console.warn(`[gemini] 할당량 초과 — 키 ${((keyIndex - 1 + pool.length) % pool.length) + 1}/${pool.length} → ${keyIndex + 1}/${pool.length} 전환`);
  return true;
}

export async function listModels() {
  const key = apiKey();
  if (!key) throw new Error('GEMINI_API_KEY 환경변수가 없습니다.');
  const res = await fetch(`${BASE}/models?key=${key}&pageSize=200`);
  if (!res.ok) throw new Error(`ListModels ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => ({
      name: m.name.replace(/^models\//, ''),
      displayName: m.displayName,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
    }));
}

/**
 * 선호 순서대로 정렬한 후보 목록. 무료 티어에서는 특정 모델이 503(과부하)로
 * 막히는 일이 잦아서, 한 개만 고르지 말고 폴백 목록을 들고 있어야 한다.
 */
export async function pickModels(preferred = process.env.GEMINI_MODEL) {
  const models = await listModels();
  const names = models.map((m) => m.name);
  if (preferred) {
    if (!names.includes(preferred)) {
      throw new Error(`요청한 모델 '${preferred}' 을 쓸 수 없습니다. 사용 가능: ${names.join(', ')}`);
    }
    return [preferred, ...rankFlash(models).filter((n) => n !== preferred)];
  }
  const ranked = rankFlash(models);
  return ranked.length ? ranked : names;
}

function rankFlash(models) {
  const stable = models
    .filter(
      (m) =>
        /flash/i.test(m.name) &&
        !/preview|omni|thinking|image|tts|live|audio|embedding|latest|lite/i.test(m.name)
    )
    .sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }))
    .map((m) => m.name);
  const lite = models
    .filter(
      (m) =>
        /flash/i.test(m.name) &&
        /lite/i.test(m.name) &&
        !/preview|omni|tts|image|live|audio|embedding|latest/i.test(m.name)
    )
    .sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }))
    .map((m) => m.name);
  return [...stable, ...lite];
}

/** 사용 가능한 모델 중 가볍고 빠른 것을 우선 고른다. */
export async function pickModel(preferred = process.env.GEMINI_MODEL) {
  const models = await listModels();
  if (preferred) {
    const hit = models.find((m) => m.name === preferred);
    if (hit) return hit.name;
    throw new Error(`요청한 모델 '${preferred}' 을 쓸 수 없습니다. 사용 가능: ${models.map((m) => m.name).join(', ')}`);
  }
  // flash 계열(저렴·빠름) 중 텍스트 전용 안정판을 고른다.
  // preview/omni/tts/image/live 는 용도가 다르거나 할당량 조건이 달라 제외하고,
  // 'latest' 같은 움직이는 별칭도 재현성을 위해 뺀다.
  const flash = models
    .filter(
      (m) =>
        /flash/i.test(m.name) &&
        !/preview|omni|thinking|image|tts|live|audio|embedding|latest|lite/i.test(m.name)
    )
    .sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }));
  if (flash.length) return flash[0].name;
  // 안정판 flash 가 없으면 lite 까지 허용
  const lite = models
    .filter((m) => /flash/i.test(m.name) && !/preview|omni|tts|image|live|audio|embedding/i.test(m.name))
    .sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }));
  if (lite.length) return lite[0].name;
  if (!models.length) throw new Error('generateContent 를 지원하는 모델이 없습니다.');
  return models[0].name;
}

/**
 * 구조화된 JSON 출력을 강제해서 한 번 호출한다.
 * @returns {{ data: any, usage: {input:number, output:number, total:number}, model: string }}
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 503(과부하)·429(레이트리밋)는 무료 티어에서 흔한 일시 오류라 지수 백오프로 재시도한다.
 * 그래도 안 되면 호출부가 다음 모델로 폴백할 수 있도록 에러를 그대로 올린다.
 */
export async function generateJsonWithRetry(opts, { attempts = 4, baseDelay = 2000 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await generateJson(opts);
    } catch (e) {
      last = e;
      // 429 는 키 풀이 있으면 다음 키로 넘어가서 즉시 재시도한다
      if (e.status === 429 && rotateApiKey()) continue;
      const transient = e.status === 503 || e.status === 429 || e.status >= 500;
      if (!transient || i === attempts - 1) throw e;
      await sleep(baseDelay * 2 ** i);
    }
  }
  throw last;
}

export async function generateJson({ model, system, user, schema, timeout = 90000 }) {
  const key = apiKey();
  if (!key) throw new Error('GEMINI_API_KEY 환경변수가 없습니다.');

  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0,
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`generateContent ${res.status}: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    const json = JSON.parse(text);
    const cand = json.candidates?.[0];
    const raw = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
    const um = json.usageMetadata || {};
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`JSON 파싱 실패 (finishReason=${cand?.finishReason}): ${raw.slice(0, 300)}`);
    }
    return {
      data,
      model,
      usage: {
        input: um.promptTokenCount ?? 0,
        output: um.candidatesTokenCount ?? 0,
        total: um.totalTokenCount ?? 0,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
