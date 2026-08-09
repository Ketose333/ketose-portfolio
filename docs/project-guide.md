# Project Guide

이 문서는 새 참여자가 빠르게 합류할 수 있게 만드는 공통 안내서입니다.

## 구조

- 이 레포는 `apps/`, `packages/`, `themes/`, `docs/` 중심으로 봅니다.
- 앱 전용 기능은 각 `apps/*` 아래에 둡니다.
- 둘 이상의 앱이 같이 쓰는 로직은 먼저 `packages/*`로 올릴 수 있는지 검토합니다.

## 작업 방식

1. 구조를 바꿀 때는 먼저 dead path, legacy alias, fallback surface를 줄입니다.
2. 공용화는 “복붙 제거”보다 “책임 위치를 명확히 만드는 것”을 우선합니다.
3. UI 작업은 줄바꿈, 여백, 정보 위계, 실제 플레이/사용 흐름을 먼저 봅니다.
4. 브랜딩, 화면 문구, 색상 판단은 `branding/`의 기준 문서를 먼저 확인합니다.
5. 모든 라이브 웹 표면은 다크모드 기반으로 보고 작업합니다. 색상 변경 전 `branding/theme-principles.md`를 확인합니다.
6. 제출 전에는 `npm run verify`를 우선 실행합니다. 앱 하나만 빠르게 볼 때만 개별 `build:*` 명령을 씁니다.
7. 장식성 텍스트 기준은 `branding/ui-copy-guardrails.md` 원본 문서를 직접 봅니다.
8. NULSIGHT는 카드게임 룰과 게임 상태 안정성이 최우선입니다.

## 진행 체크리스트

앞으로 작업을 제안하거나 마무리할 때는 가능한 한 아래 번호를 유지합니다.

1. 범위: 이번 변경이 site, NULSIGHT, 공용 패키지, 문서 중 어디에 닿는지 먼저 적습니다.
2. 기준: 관련 source of truth가 있는지 확인합니다. 프로젝트 사실은 `E:/CAREER/portfolio/projects.json`, 고정 서비스 정보는 `packages/services/src/index.ts`, 색상은 `themes/theme.oklch.css`, 문체는 `branding/ui-copy-guardrails.md`를 우선합니다.
3. 정리: legacy, fallback, 중복 문구, 앱 전용 래퍼가 남아 있는지 봅니다.
4. UI: 줄바꿈, 여백, 정보 위계, 장식성 텍스트, 모바일 폭을 확인합니다.
5. 검증: 문서만 바꿨다면 `git diff --check`, 코드나 스타일을 바꿨다면 `npm run verify`를 기준으로 합니다.
6. 기록: 작업로그나 브랜딩 문서에 남길 가치가 있는 결정만 짧게 남깁니다.

## 먼저 볼 곳

- 루트 `README.md`
- `branding/README.md`
- `docs/platform-account.md`
- `branding/ui-copy-guardrails.md`
- `apps/nulsight/README.md`
- `apps/nulsight/docs/structure.md`

## 작업 메모

- 변경 전에 기존 구조를 먼저 확인하고, 공용 패키지로 올릴 가치가 있는지 판단합니다.
- legacy fallback은 바로 삭제하지 말고, 실제 런타임 참조가 사라졌는지 먼저 확인합니다.
- 검증 산출물 `dist-check/`는 소스가 아니며, 로컬 확인용 출력입니다.

## 현재 경계

- 실제 계정 API는 아직 `nulsight`만 라이브로 사용합니다.
- 공용 계정 클라이언트는 `packages/account-client`
- 공용 서버 auth/storage는 `packages/server-auth`, `packages/server-storage`
- `site`는 아직 public-first 앱입니다.
- 프로젝트명, URL, 레포 링크, 기간·상태는 중앙 카탈로그에서 생성한 `packages/services/src/projects.generated.ts`를 기준으로 합니다.
