# NULSIGHT

상태 흐름이 많은 화면을 React/Vite로 구성한 인터랙티브 웹 앱입니다. 로비, 덱 편집, 덱 허브, 진행 화면을 하나의 React 표면에서 관리합니다.

## Live

- https://nulsight.vercel.app

## Run

루트 디렉터리에서 실행합니다.

```bash
npm run dev:nulsight
npm run build:nulsight
```

앱 내부 점검:

```bash
npm run build:verify --workspace @portfolio/nulsight
```

## Role

- `src/pages`: 라우트 단위 화면
- `src/app`: 라우터, 공통 컴포넌트, API 클라이언트
- `src/client`: 브라우저 런타임, 오디오, 화면 상태
- `src/shared`: 카드 데이터와 공통 규칙
- `api`: Vercel Functions 엔드포인트
- `lib`: 저장소, 인증, 게임 상태 처리
- `docs`: 구조와 규칙 문서

## Notes

- 계정과 저장소 공통 로직은 `packages/`의 서버 패키지를 우선 사용합니다.
- 브라우저 전역 런타임은 빌드 스크립트로 생성해 `public/js`에 둡니다.
- 파괴적인 관리 기능은 환경 변수로 보호합니다.
