// .env 파일이 있으면 읽어서 process.env 에 채운다. (의존성 없음)
//
// API 키를 채팅이나 명령줄 히스토리에 남기지 않기 위한 경로다.
// .env 는 .gitignore 에 있으므로 저장소에 올라가지 않는다.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv(file = join(ROOT, '.env')) {
  if (!existsSync(file)) return { loaded: false, keys: [] };
  const keys = [];
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq < 1) continue;
    const key = s.slice(0, eq).trim();
    let value = s.slice(eq + 1).trim();
    // 따옴표로 감싼 값 허용
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // 이미 환경변수로 들어와 있으면 그쪽을 우선한다
    if (!process.env[key]) process.env[key] = value;
    keys.push(key);
  }
  return { loaded: true, keys };
}

/** 키 값을 노출하지 않고 설정 여부만 확인할 때 쓴다. */
export function describeKey(name) {
  const v = process.env[name];
  if (!v) return `${name}: 없음`;
  return `${name}: 설정됨 (${v.length}자, ...${v.slice(-4)})`;
}

loadEnv();
