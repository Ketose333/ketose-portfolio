# Project Guide

이 문서는 새 참여자가 빠르게 합류할 수 있게 만드는 공통 안내서입니다.

## 구조

- 이 레포는 `apps/`, `packages/`, `themes/`, `docs/` 중심으로 봅니다.
- 앱 전용 기능은 각 `apps/*` 아래에 둡니다.
- 둘 이상의 앱이 같이 쓰는 로직은 먼저 `packages/*`로 올릴 수 있는지 검토합니다.

## 작업 방식

- 구조를 바꿀 때는 먼저 dead path, legacy alias, fallback surface를 줄입니다.
- 공용화는 “복붙 제거”보다 “책임 위치를 명확히 만드는 것”을 우선합니다.
- UI 작업은 줄바꿈, 여백, 정보 위계, 실제 플레이/사용 흐름을 먼저 봅니다.
- `nulsight`는 카드게임 룰과 게임 상태 안정성이 최우선입니다.

## 먼저 볼 곳

- 루트 `README.md`
- `docs/platform-account.md`
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
- `site`와 `amesato`는 아직 public-first 앱입니다.
