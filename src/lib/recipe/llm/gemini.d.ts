/**
 * gemini.js 의 타입 경계 (구현은 JS 그대로 — analyze.d.ts 와 같은 방식).
 * TS 에서 실제로 쓰는 함수만 선언합니다.
 */

/** Gemini responseSchema 조각 (대문자 타입 표기) */
export interface GeminiSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'BOOLEAN'
  [key: string]: unknown
}

export function apiKey(): string | null

/** 사용 가능한 모델 중 가볍고 빠른 것을 고른다 */
export function pickModel(preferred?: string): Promise<string>

/** 선호 순서대로 정렬한 폴백 후보 목록 (stable flash → lite) */
export function pickModels(preferred?: string): Promise<string[]>

export interface GenerateJsonResult<T = unknown> {
  data: T
  model: string
  usage: { input: number; output: number; total: number }
}

export function generateJson<T = unknown>(opts: {
  model: string
  system?: string
  user: string
  schema: GeminiSchema
  timeout?: number
}): Promise<GenerateJsonResult<T>>

/** 503/429 는 지수 백오프로 재시도한다 */
export function generateJsonWithRetry<T = unknown>(
  opts: {
    model: string
    system?: string
    user: string
    schema: GeminiSchema
    timeout?: number
  },
  retry?: { attempts?: number; baseDelay?: number }
): Promise<GenerateJsonResult<T>>
