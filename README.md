# Ketose Portfolio

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![PixiJS](https://img.shields.io/badge/PixiJS-E72264?style=flat-square&logo=pixijs&logoColor=white)

React, TypeScript, Vite 기반 프론트엔드 포트폴리오 모노레포입니다. 공개 포트폴리오 사이트와 두 개의 인터랙티브 웹 앱을 한 저장소에서 관리합니다.

같이가계 원본 저장소: https://github.com/sinisack/ogetherBudget_Project

## Quick Start

```bash
npm install
npm run verify
```

자주 쓰는 명령:

```bash
npm run dev:site
npm run dev:nulsight
npm run build
npm run check
```

## Structure

- `apps/site`: 공개 포트폴리오 인덱스
- `apps/nulsight`: 상태 흐름이 많은 React/Vite 웹 앱
- `packages/ui-shell`: 앱 공통 레이아웃과 화면 프리미티브
- `packages/services`: 서비스 URL, 링크, 프로젝트 메타데이터
- `packages/account-client`: 프론트엔드 계정 클라이언트
- `packages/server-auth`: 계정 저장소와 쿠키 세션 유틸
- `packages/server-storage`: 서버 저장소 래퍼와 네임스페이스 유틸
- `themes`: 공통 테마 토큰과 변환 결과
- `branding`: 사이트 문체, 방향성, 디자인 기준
- `docs`: 공통 작업 문서

## Frontend Focus

- React/Vite 앱을 독립 배포하면서 공통 패키지로 반복 구조를 줄였습니다.
- 서비스 URL과 프로젝트 메타데이터는 `packages/services/src/index.ts`에서 관리합니다.
- 공통 색상 토큰은 `themes/theme.oklch.css`를 기준으로 변환합니다.
- NULSIGHT는 로비, 덱 편집, 덱 허브, 진행 화면처럼 상태가 많은 UI 흐름을 다룹니다.

## 진행 현황

- [x] `apps/site` 공개 포트폴리오 인덱스 배포
- [x] `apps/nulsight` 상태 흐름 UI 배포
- [x] 공통 패키지(`ui-shell`/`services`/`themes`) 분리로 앱 간 중복 제거

## Docs

- 공통 문서: `docs/README.md`
- 작업 가이드: `docs/project-guide.md`
- 계정 확장 메모: `docs/platform-account.md`
- 문체 기준: `branding/ui-copy-guardrails.md`
- 프로젝트 날짜 기준: `branding/project-timeline.md`
