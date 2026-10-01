# 난기류 개발자 커뮤니티 프론트엔드 스타터

첨부 UI ZIP의 6개 screen.png, code.html, DESIGN.md를 기준으로 만든 React + Vite + React Router 프로젝트입니다. 네이비 공통 헤더, 파란 액션 버튼, 밝은 카드, 메인 코드 패널, 카테고리 사이드바, 게시글 상세, 작성 폼, 프로필 활동 구성을 반영했습니다. 원본 외부 이미지/폰트에 의존하지 않도록 로고는 CSS 문자 마크, 프로필 커버는 CSS 그래픽, 아바타는 이니셜로 대체했습니다.

## 빠른 실행

Node.js 22.12 이상 (검증 환경: 24.x)을 사용하세요.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell에서는 `Copy-Item .env.example .env.local`. 기본 주소는 http://localhost:5173. 기본 mock 모드에서는 백엔드가 필요 없습니다.

데모 로그인: **demo@example.com / Demo1234!**. 회원가입, 로그인 유지, 로그아웃, 검색/카테고리/정렬/페이지 이동, 글 작성·수정·삭제, 댓글 작성·삭제, 좋아요 설정·해제, 프로필 수정 및 활동 조회가 작동합니다. mock 데이터는 브라우저 localStorage에 저장되며 로그인 유지 해제 시 sessionStorage를 사용합니다. 개발자 도구에서 `nangiryu-demo-v1`, `nangiryu-demo-session`을 지우면 초기화됩니다. mock 회원가입 비밀번호는 데모 동작을 위해 평문 저장되므로 실제 개인정보를 입력하지 마세요.

## 화면 및 경로

| 화면 | 경로 | 주요 기능 |
|---|---|---|
| 메인 | `/` | 히어로, 인기 게시글, 카테고리 링크 |
| 로그인/회원가입 | `/auth` | 폼 검증, 비밀번호 표시, 로그인 후 원래 페이지 이동 |
| 목록/카테고리 | `/posts` | `category`, `q`, `type`, `sort`, `page` query 사용 |
| 상세/댓글/좋아요 | `/posts/:id` | Markdown 렌더, 작성자 수정/삭제, 댓글, 좋아요 |
| 작성/수정 | `/posts/new`, `/posts/:id/edit` | 로그인 보호, 작성자 확인, Markdown 미리보기 |
| 프로필 | `/profile` | 로그인 보호, 정보 수정, 게시글/댓글/좋아요한 글 |

## 실제 API로 전환

`.env.local`의 `VITE_DATA_MODE=api`로 바꾸고 개발 서버를 재시작합니다. API 오류 때 mock으로 자동 전환하지 않습니다. **실제 백엔드와의 연동은 아직 검증하지 않았으며 docs/API.md는 제안 계약입니다.**

로컬에서는 두 컨테이너의 내부 3000 포트를 서로 다른 호스트 포트로 연결하세요. 예: Users `3001:3000`, Contents `3002:3000`. Vite가 `/api/auth`, `/api/users`를 3001로, `/api/posts`, `/api/comments`를 3002로 프록시합니다. 변경하려면 `USERS_PROXY_TARGET`, `CONTENTS_PROXY_TARGET` 값을 조정하세요. prefix는 제거하지 않습니다.

브라우저 fetch는 항상 `/api/...` 상대경로이며 서버 주소나 ECS IP를 코드에 넣지 않습니다. 운영에서는 Vite proxy가 적용되지 않고 ALB가 직접 분기합니다. 인증은 HttpOnly 쿠키를 제안하며 `credentials: include`를 사용합니다. 401 응답 시 AuthContext를 초기화하며 다음 보호 작업에서 로그인을 요청합니다. 백엔드 응답이 다르면 `src/api/index.js`에 어댑터를 추가하세요.

```sh
npm test
npm run build
npm run preview
```

`.env.production`을 포함하여 `npm run build`는 기본적으로 실제 API 모드입니다. 쉘에 설정한 VITE_DATA_MODE가 있다면 이를 우선하므로 운영 배포 전 API 모드인지 확인하세요. `dist/`를 EC2의 `/var/www/nangiryu/dist/`에 배치합니다. 데모 빌드를 원하면 `npm run build -- --mode development`를 사용하세요. ZIP의 소스만 전달하며 node_modules와 빌드 파일은 제외합니다. `.env.local`이나 비밀 키는 전달하지 마세요. `VITE_` 변수는 브라우저에 공개됩니다.

## 새 AWS 아키텍처 적용

참고 이미지: 블루팀 아키텍처-new 구조도. 사용자는 Cloudflare → AWS WAF가 연결된 ALB로 접속합니다. 기본 경로는 Private Web-App EC2의 Nginx로, API는 각각 ECS/Fargate로 보냅니다. RDS 접근은 백엔드에서만 수행합니다. 이미지의 이전 경로 표기보다 아래 팀 경로를 우선합니다.

| ALB 우선순위 | Path pattern | Target Group |
|---|---|---|
| 10 | `/api/auth/*`, `/api/users`, `/api/users/*` | Users ECS (IP, 3000) |
| 20 | `/api/posts`, `/api/posts/*`, `/api/comments`, `/api/comments/*` | Contents ECS (IP, 3000) |
| Default | 그 외 | Web-App EC2 (80) |

`/api/posts/*` 외에 `/api/posts` 자체도 등록해야 목록/작성 요청을 처리합니다. HTTPS는 ALB/Cloudflare의 배포 설정에서 구성하고 EC2의 80번은 ALB에서만 접근하도록 제한하세요. Nginx 예시는 `deploy/nginx.conf`입니다. `/posts/p1` 직접 접속/새로고침을 `index.html`로 처리하며 잘못 들어온 `/api/`는 JSON 404로 반환합니다. Nginx health check 예시는 `/healthz`; ECS health endpoint는 각 백엔드 팀과 별도 합의하세요. 적용 전 `nginx -t`로 검증하고 reload 하세요.

## 파일 구조

```text
src/
  api/          # 상대경로 fetch client, 실제 endpoint adapter, mock 구현
  context/      # AuthContext
  components/   # Header, Footer, PostCard, CategorySidebar, 상태/보호 컴포넌트
  data/         # 카테고리 정의
  hooks/        # 로딩/오류/재시도, 이전 요청 결과 무시
  pages/        # 6개 주요 화면
  App.jsx       # 라우트와 에러 경계
  styles.css    # 원본 디자인 기반 반응형 스타일
deploy/nginx.conf
docs/API.md     # 백엔드 전달용 계약 제안
tests/          # 데이터 동작, 소유권, API 전환 핵심 검사
```

Markdown은 raw HTML을 렌더하지 않습니다. 등록/수정/삭제 권한은 mock에서도 검사하지만 실제 서비스는 반드시 서버에서 다시 검증해야 합니다. 이미지 업로드는 업로드 API가 미확정이라 안내와 확장 지점만 제공합니다. 알림, OAuth, 비밀번호 찾기, 관리자, 답글은 미구현입니다. 첨부 UI의 프로필 사진/배경과 로고 외부 자산은 대체했으므로 픽셀 단위 동일한 복제는 아닙니다.

기술 참고: [Vite 공식 가이드](https://vite.dev/guide/), [React Router 선언형 설치](https://reactrouter.com/start/declarative/installation).
