# synergy-mvp

## 팀 이름

시너지

## 역할 분담

| 역할 | 담당 |
|---|---|
| PM·시간 관리자 | 김도혁 |
| 기획 담당 | 임주왕, 류진환, 김도혁, 조진만 |
| 제작 담당 | 김도혁, 류진환, 이현진, 임주왕, 조진만, 황유림 |
| 발표 담당 | 황유림 |
| 최종 제출 담당 | 이현진 |

## 파트별 담당

| 파트 | 담당 |
|---|---|
| 기획 | 임주왕 |
| 디자인 | 황유림 |
| FE | 이현진, 김도혁 |
| BE | 류진환, 조진만 |

## 프로젝트 정보

| 항목 | 내용 |
|---|---|
| 프로젝트명 | |
| 프로젝트 개요 | |
| 프로젝트 기간 | 9/3 (10:00 ~ 15:00) |
| 기술 스택 | Next.js / Supabase |
| 핵심 기능 | |

---

## 시작하기

### 1. 사전 준비물

- [Git](https://git-scm.com/downloads) 설치
- [Node.js](https://nodejs.org) 20 버전 이상 설치 (LTS 버전 권장)

### 2. 저장소 받기
 - Ctrl(컨트롤) + ` 을 누르면 VSCode에서 터미널이 뜹니다!!
```
git clone https://github.com/Synergy-AI-Vibe/synergy-mvp.git
cd synergy-mvp
```

### 3. 패키지 설치

```
npm install
```

여기서 자동으로 Husky(아래 참고)까지 같이 설치됩니다.

### 4. 로컬에서 실행해서 확인하기

```
npm run dev
```

터미널에 `Ready` 같은 메시지가 뜨면 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 → 화면이 정상적으로 보이면 성공입니다. 종료는 터미널에서 `Ctrl + C`.

---

## 브랜치 전략

| 브랜치 | 용도 |
|---|---|
| `develop` | 기본 브랜치. 작업은 여기서 시작 |
| `main` | 배포 브랜치 |
| `fe/*`, `be/*` 등 | 자유롭게 만드는 개발 브랜치 |

`main`, `develop`은 삭제 방지 룰셋이 적용되어 있어 실수로 지울 수 없습니다.

## Git 작업 규칙

- PR을 올리는 구조가 아니므로, push 시 Husky가 로컬에서 타입체크(`tsc --noEmit`) → `next build`를 자동으로 실행하고 실패하면 push 자체가 막힙니다. 최소한의 안전장치이니 에러가 나면 push 전에 먼저 고쳐주세요.

## npm 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (로컬 확인용) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run db:types` | Supabase DB 기반 타입 자동 생성 |
| `prepare` | Husky 훅 설치 (`npm install` 시 자동 실행되므로 직접 실행할 필요 없음) |

## Clone 이후 체크리스트

1. `npm install`
2. `npm run dev`로 로컬 실행 확인
3. (배포 담당자만) `npx vercel login` → `npx vercel link`