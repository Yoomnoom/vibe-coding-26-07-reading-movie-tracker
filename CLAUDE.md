# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Pre-implementation. The repository currently contains only `PRD.md`. There is no source code, package.json, or build tooling yet — read `PRD.md` in full before starting any work, since it is the sole source of truth for scope and requirements.

## 작업 원칙 (필독)

- 이 프로젝트는 `PRD.md` 문서를 기준으로 개발한다. **새 기능을 만들 때는 항상 `PRD.md`를 먼저 참고**한다.
- 개발 순서는 반드시 다음 순서를 지킨다: **① 가짜 데이터로 화면 먼저 구현 → ② 실제 데이터(Notion/Sheets) 연동 → ③ 예외 처리(에러 알림, 로딩 스켈레톤, 빈 데이터 처리)는 마지막에 추가**. 순서를 건너뛰거나 뒤바꾸지 않는다.
- 개발 중에는 연결되어 있는 Notion, Google Sheets 도구를 그대로 사용해 기능을 구현하고 테스트한다.
- 단, 이 연결 방식은 **배포 이후에는 그대로 쓸 수 없다.** 배포 준비 단계가 되면 안전한 방식(서버 쪽 코드 + 환경변수)으로 전환해야 하며, **배포 준비 단계 전까지는 이 서버 전환 작업을 미리 구현하지 않는다.**
- 인증 정보(토큰, API 키 등)는 어떤 경우에도 화면(프론트엔드) 코드에 직접 넣지 않는다.
- 기술 스택은 React + Vite, Tailwind CSS, lucide-react로 고정한다. 상태 관리는 `useState`/`useContext`만 사용하고 별도 상태관리 라이브러리는 도입하지 않는다.
- 기능 단위(예: 초기 세팅 / 화면 뼈대 / Notion 연동 / Sheets 연동 / CRUD 완성)로 작업이 끝날 때마다 커밋한다. 여러 기능을 한 커밋에 묶지 않는다.
- `PRD.md`의 **Open Questions 항목은 아직 확정되지 않은 사항이므로, 임의로 결정하지 말고 반드시 사용자에게 먼저 물어본다.**
- 코드를 작성하기 전에 요구사항이나 설계가 애매한 부분이 있으면, 추측해서 진행하지 말고 항상 먼저 사용자에게 질문한다.

## What this project is

A personal web app ("독서/영화 기록 트래커") for logging books/movies after finishing them (title, rating, one-line review, completion date) and browsing them in a card-style gallery. It uses Notion or Google Sheets as the data store instead of a dedicated database — there is no traditional backend.

## Required tech stack (per PRD section 6)

- Frontend: React + Vite
- Styling: Tailwind CSS
- Icons: lucide-react
- State management: React `useState`/`useContext` only — do not introduce Redux/Zustand/etc.
- Data backends: Notion API and Google Sheets API, user-toggleable at runtime

## Development sequence (must follow this order, per PRD section 6)

1. Build screens first with fake/mock data (gallery, modal, filters/sort).
2. Wire up real data connections (Notion, Google Sheets).
3. Add exception/error handling (failed fetch notifications, loading skeletons, empty-state handling).

## Critical architecture constraint: dev vs. deployed data access

- **During development**: CRUD may be implemented and tested using the Notion/Google Sheets connections directly available in the dev environment.
- **At deployment time**: that direct connection method cannot be used on the deployed site. It must be swapped for a server-side approach (e.g. Vercel serverless functions) reading credentials from environment variables.
- **Credentials must never be exposed in frontend/client code**, in either the dev or deployed setup. When transitioning to deployment, treat this as a required refactor, not an afterthought.

## Core features and priorities (PRD section 4)

| Feature | Priority |
|---|---|
| Gallery read, sorted by completion date desc | P0 |
| Create new entry via form | P0 |
| Update rating/review by clicking a card | P0 |
| Data source toggle (Notion ↔ Sheets) | P0 |
| Delete (Notion = archive, Sheets = soft delete) | P1 |
| Filter (book/movie) and sort (date/rating) | P1 |
| Cover image display via URL, with placeholder fallback | P1 |
| GitHub commits per feature | P1 |
| Vercel auto-deploy on push | P1 |

Note the asymmetric delete semantics: Notion entries are archived, Google Sheets entries are soft-deleted (flagged, not row-removed) — implement these as genuinely different operations per backend, not a shared abstraction.

## UI structure (PRD section 7)

- **Top bar**: data source toggle ([Notion]/[Sheets]), type filter (all/book/movie), sort control (date/rating), "+ Add record" button.
- **Main area**: responsive card grid gallery.
- **Card**: cover image (books = 3:4 portrait, movies = 16:9 landscape, placeholder if missing), type color badge, star rating (⭐), one-line review, completion date.
- **Modal**: create/edit form (title, type, rating, review, completion date, cover image URL).

## Explicit non-goals (PRD section 3)

- Multi-user login/sharing — personal use only.
- Automatic cover image lookup via external APIs (Open Library/TMDB) — out of scope for v1; only manual URL input is supported.
- Native mobile app.

## Open questions (unresolved as of PRD — confirm with user before assuming)

- Default sort order: by completion date vs. by rating.
- Delete confirmation copy and whether undo is offered.
- Default data source shown on first load: Notion or Sheets.
