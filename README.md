<a id="readme-top"></a>

# Ketose Portfolio

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![PixiJS](https://img.shields.io/badge/PixiJS-E72264?style=flat-square&logo=pixijs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

React, TypeScript, Vite 기반 풀스택 & AI 프로젝트 포트폴리오 모노레포입니다.

[**라이브 데모 »**](https://ketose.vercel.app)

</br>

## 목차

- [프로젝트 소개](#프로젝트-소개)
  - [기술 스택](#기술-스택)
- [시작하기](#시작하기)
  - [사전 요구사항](#사전-요구사항)
  - [설치](#설치)
- [사용법](#사용법)
- [작업물](#작업물)
- [NULSIGHT](#nulsight)
- [구조](#구조)
- [문서](#문서)
- [로드맵](#로드맵)
- [라이선스](#라이선스)
- [연락처](#연락처)

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 프로젝트 소개

`ketose-portfolio`는 공개 포트폴리오 사이트(`apps/site`)와 브라우저 카드게임(`apps/nulsight`)을 한 저장소에서 관리하는 npm workspaces 모노레포입니다.

- **`apps/site`**: 자기소개형 랜딩 페이지가 아니라, 실제로 배포된 6개 프로젝트로 바로 들어가는 검증 가능한 작업 인덱스입니다. 채용 담당자가 30초 안에 "무엇을 만들었는지"를 확인할 수 있도록 설계했습니다.
- **`apps/nulsight`**: 커스텀 룰을 가진 1:1 브라우저 카드게임입니다. 로비, 덱 편집, 덱 허브, 실시간 듀얼 화면처럼 상태가 많은 UI 흐름을 하나의 React 표면 위에서 관리합니다.
- 두 앱은 공통 패키지(`ui-shell`, `services`, `themes`, `account-client`, `server-auth`, `server-storage`)로 반복 구조를 줄이고, OKLCH 기반 다크 모드 디자인 토큰을 공유합니다.
- 브랜드/문체 방향은 "정확하고(precise), 분위기 있고(atmospheric), 취향이 분명한(opinionated)" 세 단어로 관리하며, 자세한 기준은 [`branding/`](branding)에 문서화되어 있습니다.

> `apps/nulsight`는 레포에 남아 있고 개별 배포도 유지되지만, 현재 `apps/site`(공개 포트폴리오 인덱스)에서는 링크하지 않습니다.

### 기술 스택

**공통**

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- npm workspaces 기반 모노레포 (`apps/*`, `packages/*`)
- OKLCH 색 공간 기반 공유 테마 토큰 (`themes/theme.oklch.css`)
- [Vercel](https://vercel.com/) 배포 (앱별 독립 배포)

**`apps/site`**

- 정적 React SPA, 프로젝트 카드 데이터는 `packages/services/src/index.ts`가 단일 진실 공급원

**`apps/nulsight`**

- [PixiJS](https://pixijs.com/) 기반 듀얼 화면 렌더링
- Vercel Functions(`api/`)로 게임 상태·인증 API 처리
- Node.js 18 이상 필요(`engines.node`)

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm (workspaces 지원 버전)

### 설치

루트 디렉터리에서 실행합니다.

```bash
npm install
npm run verify
```

`verify`는 테마 토큰 검사, NULSIGHT 스타일 경계 검사, 전체 빌드를 순서대로 실행합니다.

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 사용법

```bash
npm run dev:site       # site 개발 서버
npm run dev:nulsight   # NULSIGHT 개발 서버
npm run build          # 전체 빌드 (site + NULSIGHT)
npm run check          # 테마 토큰 + NULSIGHT 스타일 경계 검사
```

앱별로 더 좁게 확인하고 싶을 때는 개별 `build:*` 명령을 씁니다.

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 작업물

`apps/site`는 아래 프로젝트들을 실제 배포 링크와 함께 소개합니다(자세한 메타데이터는 `packages/services/src/index.ts` 참고).

| 프로젝트 | 설명 |
| --- | --- |
| [무디트리](https://mooditree.vercel.app) | 감정 기록 AI 웹 앱 |
| [같이가계](https://wizlet-budget.vercel.app) | 팀 가계부 웹 앱 |
| [도파체크](https://dopacheck.luma200ok.com) | 도파민 습관 체크 웹 앱 |
| [리뷰 감성 분석](https://nsmc-sentiment.streamlit.app) | 리뷰 텍스트 감성 분석 |
| [음악 감정 추천](https://music-mood-recs.streamlit.app) | 감정 기반 음악 추천 |
| [하자체크](https://hajacheck.luma200ok.com) | 부동산 하자 체크 웹 앱 |

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## NULSIGHT

이 레포에서 직접 구현하는 유일한 프로젝트로, 별도 배포([nulsight.vercel.app](https://nulsight.vercel.app))를 가진 브라우저 카드게임입니다.

- 1:1 듀얼, 시작 HP 20, 시작 손패 5장, 덱 30장 이상 등 커스텀 룰을 자체 문서(`apps/nulsight/docs/rules.md`)로 관리합니다.
- 필드 존, 손패, 묘지, 추방, 선택 가능/선택된 카드, 체인/스택 프롬프트 같은 TCG 클라이언트 어휘는 YGOPRO를 구조적으로 참고하되, 룰과 카드 효과는 독자적으로 구현합니다.
- 카드 데이터·룰 상수는 `src/shared/`에서 시작하고, 브라우저 런타임 전역은 빌드 스크립트로 `public/js/`에 생성됩니다.
- 계정·저장소 공통 로직은 워크스페이스 패키지(`packages/server-auth`, `packages/server-storage`)를 우선 사용합니다.

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 구조

- `apps/site`: 공개 포트폴리오 인덱스
- `apps/nulsight`: 상태 흐름이 많은 React/Vite 카드게임 웹 앱
- `packages/ui-shell`: 앱 공통 레이아웃과 화면 프리미티브
- `packages/services`: 서비스 URL, 링크, 프로젝트 메타데이터 (source of truth)
- `packages/account-client`: 프론트엔드 계정 클라이언트
- `packages/server-auth`: 계정 저장소와 쿠키 세션 유틸
- `packages/server-storage`: 서버 저장소 래퍼와 네임스페이스 유틸
- `themes`: 공통 테마 토큰과 변환 결과
- `branding`: 사이트 문체, 방향성, 디자인 기준
- `docs`: 공통 작업 문서

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 문서

- 공통 문서: [`docs/README.md`](docs/README.md)
- 작업 가이드: [`docs/project-guide.md`](docs/project-guide.md)
- 계정 확장 메모: [`docs/platform-account.md`](docs/platform-account.md)
- 브랜딩 기준: [`branding/README.md`](branding/README.md)
- 문체 기준: [`branding/ui-copy-guardrails.md`](branding/ui-copy-guardrails.md)
- 프로젝트 날짜 기준: [`branding/project-timeline.md`](branding/project-timeline.md)
- NULSIGHT 구조: [`apps/nulsight/docs/structure.md`](apps/nulsight/docs/structure.md)
- NULSIGHT 룰: [`apps/nulsight/docs/rules.md`](apps/nulsight/docs/rules.md)

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 로드맵

- [x] `apps/site` 공개 포트폴리오 인덱스 배포
- [x] `apps/nulsight` 상태 흐름 UI 배포
- [x] 공통 패키지(`ui-shell`/`services`/`themes`) 분리로 앱 간 중복 제거
- [ ] 커스텀 도메인 이전 후 계정 시스템을 앱 간 공유 (`docs/platform-account.md` 참고)

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 라이선스

개인 포트폴리오 저장소이며 별도 오픈소스 라이선스는 지정되어 있지 않습니다.

## 연락처

- GitHub: [Ketose333](https://github.com/Ketose333)
- Email: amumalbot4@gmail.com

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>
