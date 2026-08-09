<a id="readme-top"></a>

# Ketose Portfolio

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
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
- [구조](#구조)
- [문서](#문서)
- [로드맵](#로드맵)
- [라이선스](#라이선스)
- [연락처](#연락처)

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 프로젝트 소개

`ketose-portfolio`는 공개 포트폴리오 사이트와 공통 패키지를 함께 관리하는 npm workspaces 모노레포입니다.

- **`apps/site`**: 자기소개형 랜딩 페이지가 아니라, 실제로 배포된 6개 프로젝트로 바로 들어가는 검증 가능한 작업 인덱스입니다. 채용 담당자가 30초 안에 "무엇을 만들었는지"를 확인할 수 있도록 설계했습니다.
- 두 앱은 공통 패키지(`ui-shell`, `services`, `themes`, `account-client`, `server-auth`, `server-storage`)로 반복 구조를 줄이고, OKLCH 기반 다크 모드 디자인 토큰을 공유합니다.
- 브랜드/문체 방향은 "정확하고(precise), 분위기 있고(atmospheric), 취향이 분명한(opinionated)" 세 단어로 관리하며, 자세한 기준은 [`branding/`](branding)에 문서화되어 있습니다.

### 기술 스택

**공통**

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- npm workspaces 기반 모노레포 (`apps/*`, `packages/*`)
- OKLCH 색 공간 기반 공유 테마 토큰 (`themes/theme.oklch.css`)
- [Vercel](https://vercel.com/) 배포 (앱별 독립 배포)

**`apps/site`**

- 정적 React SPA, 프로젝트 카드는 `E:/CAREER/portfolio/projects.json`에서 생성한 `packages/services/src/projects.generated.ts`를 소비

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

`verify`는 테마 토큰 검사와 전체 빌드를 순서대로 실행합니다.

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 사용법

```bash
npm run dev:site       # site 개발 서버
npm run build          # 전체 워크스페이스 빌드
npm run check          # 테마 토큰과 스타일 경계 검사
```

앱별로 더 좁게 확인하고 싶을 때는 개별 `build:*` 명령을 씁니다.

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 작업물

`apps/site`는 중앙 카탈로그에서 공개 대상으로 지정한 프로젝트를 실제 기간·상태·링크와 함께 소개합니다.

<!-- PORTFOLIO:WEB-PROJECTS:START -->
| 프로젝트 | 기간 | 상태 |
| --- | --- | --- |
| [무디트리](https://mooditree.vercel.app) | 2025.06.27 ~ 2025.07.31 (5주) | completed |
| [같이가계](https://wizlet-budget.vercel.app) | 2025.10.17 ~ 2025.11.21 (5주) | completed |
| [도파체크](https://dopacheck.luma200ok.com) | 2026.06.10 ~ 2026.06.17 (7일) | completed |
| [리뷰 감성 분석](https://nsmc-sentiment.streamlit.app) | 2026.06.21 ~ 2026.07.03 (12일) | completed |
| [음악 감정 추천](https://music-mood-recs.streamlit.app) | 2026.06.25 ~ 2026.07.04 (9일) | completed |
| [하자체크](https://hajacheck.luma200ok.com) | 2026.07.09 ~ 2026.08.07 (4주) | completed |
<!-- PORTFOLIO:WEB-PROJECTS:END -->

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 구조

- `apps/site`: 공개 포트폴리오 인덱스
- `apps/nulsight`: 별도 애플리케이션 워크스페이스
- `packages/ui-shell`: 앱 공통 레이아웃과 화면 프리미티브
- `packages/services`: 고정 서비스 URL과 중앙 카탈로그에서 생성된 프로젝트 메타데이터
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

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 로드맵

- [x] `apps/site` 공개 포트폴리오 인덱스 배포
- [x] 공통 패키지(`ui-shell`/`services`/`themes`) 분리로 앱 간 중복 제거
- [ ] 커스텀 도메인 이전 후 계정 시스템을 앱 간 공유 (`docs/platform-account.md` 참고)

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>

## 라이선스

개인 포트폴리오 저장소이며 별도 오픈소스 라이선스는 지정되어 있지 않습니다.

## 연락처

- GitHub: [Ketose333](https://github.com/Ketose333)
- Email: amumalbot4@gmail.com

<p align="right">(<a href="#readme-top">맨 위로</a>)</p>
