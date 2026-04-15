# ketose-portfolio

Ketose 포트폴리오와 실험적인 게임 프로젝트를 함께 운영하는 모노레포입니다.

## 구성

- `apps/site`
  - 단일 페이지 포트폴리오 인덱스
- `apps/amesato`
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
- `nulsight`는 더 이상 별도 레거시 웹 표면을 유지하지 않고, React/Vite 표면 하나를 기준으로 갑니다.
- 실제 계정 API를 라이브로 쓰는 앱은 아직 `nulsight`뿐입니다.

## 시작

- 설치: `npm install`
- site 개발: `npm run dev:site`
- amesato 개발: `npm run dev:amesato`
- nulsight 개발: `npm run dev:nulsight`
- site 빌드: `npm run build:site`
- amesato 빌드: `npm run build:amesato`
- nulsight 빌드: `npm run build:nulsight`
- 토큰 점검: `npm run check:theme`

## 작업 메모

- 공용 로직은 먼저 `packages/`로 올릴 수 있는지 검토하고, 앱 안에는 설정 래퍼만 남기는 쪽을 선호합니다.
- `nulsight`는 룰과 플레이 흐름을 우선하고, UI polishing이 레이아웃 안정성을 해치지 않아야 합니다.
- 새 참여자는 먼저 `docs/README.md`와 `docs/project-guide.md`를 읽는 것을 권장합니다.

## 문서

- 공통 문서 인덱스: `docs/README.md`
- 작업 메모와 온보딩: `docs/project-guide.md`
- 계정 확장 메모: `docs/platform-account.md`
- Nulsight 구조: `apps/nulsight/docs/structure.md`
- Nulsight 규칙: `apps/nulsight/docs/rules.md`
- Nulsight effect DSL: `apps/nulsight/docs/effect_dsl.md`
