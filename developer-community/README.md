# 난기류 개발자 커뮤니티 — 원본 UI 적용 React/Vite

첨부된 Stitch UI의 6개 화면과 관리자 센터 HTML을 기준으로 React 화면을 구현했습니다. 원본의 Tailwind 색상·타이포그래피 설정은 `tailwind.config.cjs`에 옮겨 빌드 시 실제 CSS로 생성합니다. 화면별 원본 HTML과 디자인 문서는 `design-reference/`에 보관했습니다. 로고와 프로필 이미지는 프로젝트에 포함해 외부 이미지 링크가 깨져도 보이게 했습니다. 팀원이 수정한 JWT/raw JSON/API 필드명 변환 코드는 `src/api/`에 유지했습니다.

## 빠른 실행

Node.js 22.12 이상. 검증 환경은 24.14.0.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell: `Copy-Item .env.example .env.local`. 기본 주소 http://localhost:5173. 기본 개발 모드는 mock이라 백엔드 없이 확인할 수 있습니다.

| mock 계정 | 이메일 | 비밀번호 |
|---|---|---|
| 일반 사용자 | demo@example.com | Demo1234! |
| 관리자 | admin@example.com | Admin1234! |

관리자 로그인 후 헤더의 **관리자** 링크 또는 `/admin`으로 이동합니다. 데모 계정은 mock 전용이며 실제 API 모드에 자동 생성되지 않습니다. mock 비밀번호는 동작 확인용으로 브라우저에 평문 저장되므로 실제 개인정보를 입력하지 마세요.

## 화면과 기능

| 경로 | 기능 |
|---|---|
| `/` | 메인, 인기 게시글, 카테고리 |
| `/auth` | 로그인/회원가입, 로그인 유지 |
| `/posts` | 목록, 검색, 카테고리, 정렬/페이징 |
| `/posts/:id` | 상세, Markdown, 댓글, 좋아요 |
| `/posts/new`, `/posts/:id/edit` | 글 작성/수정, Markdown 미리보기 |
| `/profile` | 정보 수정, 내 활동 |
| `/admin` | 관리자 운영 현황, 최근 게시글 |
| `/admin/posts` | 글 검색/카테고리/전체 목록, 상세 보기, 사유 입력 후 삭제 |
| `/admin/comments` | 댓글 검색/전체 목록/원문 이동, 사유 입력 후 삭제 |
| `/admin/users` | 사용자 검색, ID/이메일/닉네임/가입일/권한 확인 |

관리자 요구사항은 첨부 기능 사진의 별도 권한·게시글 삭제·댓글 삭제·사용자 확인입니다. 회원 정지/탈퇴, 역할 변경, 신고 관리까지 추가하지 않았습니다. 비로그인 상태는 로그인 안내, 일반 계정은 관리자 접근 불가 안내를 보여줍니다. 서버는 모든 관리자 API에서 별도로 권한을 검증해야 합니다.

## 실제 API 연결

`.env.local`에서 `VITE_DATA_MODE=api`로 변경 후 서버를 재시작합니다. 로컬 Users/Contents 컨테이너는 각각 `3001:3000`, `3002:3000`처럼 호스트 포트를 구분하세요. `USERS_PROXY_TARGET`, `CONTENTS_PROXY_TARGET`은 Vite proxy 대상이며 브라우저 API는 항상 `/api/...` 상대경로입니다.

팀원 어댑터 기준 인증은 JWT입니다. login에 `{username: email,password}`를 보내고 응답 token을 `Authorization: Bearer ...`로 사용합니다. 로그인 유지 시 localStorage, 그 외 sessionStorage. 로그아웃은 토큰을 지우며, 서버의 기존 JWT를 폐기하는 API는 없습니다. 기존 문서의 쿠키 인증/{data} envelope 설명을 이 버전에서 수정했습니다.

**실제 서버 통합은 미검증입니다.** 기존 API는 팀원 코드가 기대하는 계약을 `docs/API.md`에 정리했고 신규 관리자 API는 `docs/ADMIN_API.md`를 백엔드 담당자에게 전달하세요. `/api/users/me`에 `role: "admin"`이 있어야 실제 모드에서 관리자 페이지에 들어갈 수 있습니다. role이 없으면 일반 계정으로 처리하며 관리자 API 오류 때 mock으로 자동 전환하지 않습니다.

현재 실제 어댑터는 태그/글 유형/자기소개를 저장하지 않습니다. Q&A 목록은 빈 결과가 되고, 내 댓글/좋아요한 글은 API가 없어 표시하지 못합니다. 게시글 목록/내 글 통계는 서버가 내려준 최근 배열 범위입니다. mock에서는 이 기능들이 동작하지만 실제 API에 해당 컬럼/엔드포인트를 추가하기 전까지 동일하지 않습니다. 이미지 첨부, 알림, OAuth, 비밀번호 찾기, 댓글 수정/답글은 미구현입니다.

## 검증 및 배포

```sh
npm test
npm run build
npm run preview
```

`.env.production`으로 기본 운영 빌드는 API 모드입니다. mock 빌드가 필요하면 `npm run build -- --mode development`를 사용하세요. 쉘의 VITE_DATA_MODE는 파일보다 우선하므로 배포 전 값을 확인하세요.

EC2에는 `dist/`만 배포하면 되고 Nginx가 제공합니다. Node.js 실행 서버나 관리자 페이지 전용 EC2는 필요하지 않습니다. 기존 ALB는 Users에 `/api/auth/*`, `/api/users`, `/api/users/*`, Contents에 `/api/posts`, `/api/posts/*`, `/api/comments`, `/api/comments/*`, 나머지는 프론트 EC2로 분기합니다. 새 관리자 API도 이 경로 안에 있습니다.

`deploy/nginx.conf`의 root 기본 예시는 `/var/www/nangiryu/dist`입니다. 연결된 채팅에서 `/var/www/frontend`를 사용했다면 **root와 실제 파일 배치 위치를 일치**시키세요. `/admin` 직접 접속/새로고침도 SPA fallback이 처리합니다. `/health`와 `/healthz` 모두 제공하며 기존 ALB 체크 경로와 맞추세요. API가 Nginx로 잘못 들어오면 HTML 200 대신 JSON 404를 반환합니다. 적용 전 `nginx -t` 검증 후 reload 하세요.

## 구조와 전달 문서

```text
src/api/client.js          # JWT + 상대경로 fetch
src/api/real.js            # 팀원 API 어댑터 + 신규 관리자 계약
src/api/mock.js            # 일반/관리자 mock 데이터 동작
src/context/AuthContext.jsx
src/auth/permissions.js    # role 확인
src/components/           # 공통 화면 및 관리자 접근 안내
src/pages/                # 원본 HTML/CSS에 맞춘 6개 화면
src/pages/admin/          # 관리자 센터, 목록, 삭제 확인창
tailwind.config.cjs        # 첨부 HTML의 색상/글꼴/크기 토큰
design-reference/         # 첨부된 화면별 원본 HTML과 DESIGN.md
public/                   # 원본 화면 로고/프로필 이미지
docs/TEAM_CHANGES.md       # 팀원 ZIP의 변경점과 한계
docs/API.md               # 팀원 어댑터가 기대하는 기존 API
docs/ADMIN_API.md         # 백엔드 담당자에게 전달할 관리자 계약/구현 순서
docs/VALIDATION.md         # 검증 결과
deploy/nginx.conf
tests/
```

mock 저장소는 `nangiryu-demo-v2`, 로그인 상태는 `nangiryu-demo-session`. 기존 v1 데이터를 읽어 일반 사용자 역할을 유지하며 관리자 데모 계정을 추가합니다. admin@example.com을 일반 계정으로 이미 만들어둔 경우 자동 승격하지 않으므로 데모 저장소를 초기화해야 합니다. 초기화 시 개발자 도구에서 v1/v2/세션 키를 모두 제거하세요. API JWT 저장 키는 `nangiryu-token`입니다.

ZIP에는 소스/lockfile/문서/설정을 포함하고 node_modules, dist, 캐시, 개인 환경변수는 제외합니다. 실제 운영 관리자 비밀번호/토큰을 소스 또는 ZIP에 넣지 마세요. Markdown raw HTML은 렌더하지 않으며 클라이언트 입력 검증과 별개로 서버 검증이 필요합니다.
