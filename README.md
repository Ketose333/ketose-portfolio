# ketose-portfolio

포트폴리오 사이트와 게임 프로젝트를 함께 관리하는 모노레포입니다.

현재 실제로 쓰는 워크스페이스:
- `apps/site`: 포트폴리오 사이트
- `apps/nulsight`: Nulsight 카드게임 앱

현재 상태:
- 사이트와 게임은 각각 독립 배포합니다.
- `apps/nulsight`는 기존 정적 앱 구조를 유지한 채 모노레포 안으로 편입된 상태입니다.
- 공통 색상과 기본 폰트 규칙은 `themes/theme.css`에서 공유합니다.
- 공통 토큰의 소스 오브 트루스는 `themes/theme.oklch.css`입니다.

자주 쓰는 명령:
- `npm run dev:site`
- `npm run dev:nulsight`
- `npm run build:site`
- `npm run build:nulsight`
- `npm run check:theme`

문서:
- `docs/README.md`
- `apps/nulsight/docs/rules.md`
- `apps/nulsight/docs/effect_dsl.md`
