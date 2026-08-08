# Project Timeline

포트폴리오 site의 프로젝트 카드는 `YYYY.MM + 상태` 형식으로 표기한다.

## 표기 기준

- 날짜는 프로젝트를 포트폴리오에서 설명할 때 가장 의미 있는 작업 시점을 쓴다.
- 저장소의 첫 커밋과 공개 명칭 확정 시점이 다르면 문서에 둘 다 남긴다.
- 화면 카드에는 한 줄만 노출하므로, 자세한 근거는 이 문서에 둔다.
- 상태 단어는 `시작`, `진행`, `정리`처럼 짧게 쓴다.
- 화면에 쓰는 실제 라벨은 `packages/services/src/index.ts`의 `timelineLabel`을 source of truth로 둔다.
- site는 `portfolioProjectServices` 순서대로 프로젝트를 보여준다.

## 현재 프로젝트

| 프로젝트 | 화면 표기 | 근거 |
| --- | --- | --- |
| 같이가계 | `2025.11 진행` | `sinisack/ogetherBudget_Project` 저장소는 2025-10-17 첫 커밋이 있고, 2025-11-20에 `WIZLET`에서 `같이가계`로 명칭을 정리한 커밋이 있다. |

## 참고 링크

- 같이가계 저장소: https://github.com/sinisack/ogetherBudget_Project
- 세부 작업 로그는 레포 외부 포트폴리오 자료에 보관한다.
