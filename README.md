# ketose-portfolio


## 라이브 링크

| 작업 | 링크 | 메모 |
| --- | --- | --- |
| Portfolio | https://ketose.vercel.app | 이 레포의 공개 인덱스 |
| 같이가계 | https://wizlet-budget.vercel.app | 별도 레포의 실시간 협업 가계부 |
| NULSIGHT | https://nulsight.vercel.app | 웹 TCG 클라이언트 |
| GitHub | https://github.com/Ketose333/ketose-portfolio | 현재 모노레포 |

같이가계 원본 레포: https://github.com/sinisack/ogetherBudget_Project

## 빠른 검증

- 설치: `npm install`
- 전체 점검: `npm run verify`
- 전체 빌드만: `npm run build`
- 전체 체크만: `npm run check`
- site 개발 서버: `npm run dev:site`


## 구성

- `apps/site`
  - 단일 페이지 포트폴리오 인덱스
  - 슈팅 게임 앱
- `apps/nulsight`
  - TCG 웹게임 앱
- `packages/ui-shell`
  - 세 앱이 같이 쓰는 레이아웃/크롬 프리미티브
- `packages/services`
  - 서비스 URL과 메타데이터
- `packages/account-client`
  - 프론트용 공용 계정 클라이언트
- `packages/server-storage`
  - 서버용 공용 저장 유틸과 네임스페이스 도구
- `packages/server-auth`
  - 서버용 공용 계정 저장소/쿠키 세션 조립기

## 현재 상태

- 세 앱은 각각 독립 배포되지만 한 레포에서 함께 관리됩니다.
- 디자인 토큰의 소스 오브 트루스는 `themes/theme.oklch.css`입니다.
- 서비스 이름, URL, 레포 링크, 프로젝트 날짜 라벨의 소스 오브 트루스는 `packages/services/src/index.ts`입니다.
- 프로젝트 날짜 라벨의 근거는 `branding/project-timeline.md`에 둡니다.
- NULSIGHT는 더 이상 별도 레거시 웹 표면을 유지하지 않고, React/Vite 표면 하나를 기준으로 갑니다.
- 실제 계정 API를 라이브로 쓰는 앱은 아직 NULSIGHT뿐입니다.

## 개발 명령

- site 개발: `npm run dev:site`
- NULSIGHT 개발: `npm run dev:nulsight`
- theme 토큰 점검: `npm run check:theme`
- NULSIGHT UI 경계 점검: `npm run check:nulsight-ui`

## 작업 메모

- 공용 로직은 먼저 `packages/`로 올릴 수 있는지 검토하고, 앱 안에는 설정 래퍼만 남기는 쪽을 선호합니다.
- NULSIGHT는 룰과 플레이 흐름을 우선하고, UI polishing이 레이아웃 안정성을 해치지 않아야 합니다.
- 새 참여자는 먼저 `docs/README.md`와 `docs/project-guide.md`를 읽는 것을 권장합니다.

## 문서

- 공통 문서 인덱스: `docs/README.md`
- 작업 메모와 온보딩: `docs/project-guide.md`
- 계정 확장 메모: `docs/platform-account.md`
- NULSIGHT 구조: `apps/nulsight/docs/structure.md`
- NULSIGHT 규칙: `apps/nulsight/docs/rules.md`
- NULSIGHT effect DSL: `apps/nulsight/docs/effect_dsl.md`
