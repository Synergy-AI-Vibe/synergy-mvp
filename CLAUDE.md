@AGENTS.md

# Push 전 로컬 검증

`git push` 시 Husky pre-push 훅(`.husky/pre-push`)이 타입체크(`tsc --noEmit`) → `next build` → (연결된 경우) `vercel build` 순서로 자동 실행되어 실패하면 push가 막힌다. 훅은 `npm install` 시 `prepare` 스크립트로 자동 설치되므로 별도 조치가 필요 없다.
