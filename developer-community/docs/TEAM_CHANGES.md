# 팀원 ZIP 비교 결과

비교 기준: 이전 `nangiryu-react-vite-starter.zip`의 소스와 사용자가 제공한 `developer-community.zip`. 팀원 ZIP은 원본 그대로 보존했습니다. 아래 내용은 코드 비교 결과이며 실제 백엔드 소스/실행 환경은 제공되지 않아 독립적으로 검증하지 않았습니다.

## 실제로 달라진 소스 파일: 3개

| 파일 | 이전 | 팀원 수정 | 의미 |
|---|---|---|---|
| `src/api/client.js` | HttpOnly 쿠키 제안, `{data:...}` 응답 | Bearer JWT, raw JSON, `{message,code}` 오류 | 백엔드 인증/응답 방식에 맞춘 통신 코드 |
| `src/api/index.js` | 프론트가 제안한 계약을 그대로 호출 | 실제 필드명을 화면용으로 바꾸는 어댑터 | 화면을 유지하면서 API 차이 흡수 |
| `tests/client.test.js` | 쿠키/envelope 검사 | JWT 저장/Authorization/raw JSON 검사 | 변경한 client 계약 검증 |

6개 페이지, 라우팅, AuthContext, CSS, mock, 배포 설정, README/API 문서는 내용이 동일했습니다. ZIP에 `node_modules/`, `dist/`도 포함되어 파일 크기가 약 21MB였습니다. 새 전달 ZIP은 재설치/재빌드가 가능한 소스와 lockfile 위주입니다.

## 팀원 API 어댑터의 구체적인 변경

- 로그인 입력의 이메일을 `{username: email,password}`로 전송. 가입할 때 username과 email 둘 다 이메일 값으로 전송합니다. 기존 username이 이메일과 다르게 만들어진 계정은 별도 로그인 입력 또는 마이그레이션 협의가 필요합니다.
- 가입 응답은 `{id}`로 보고 로그인 요청을 이어서 실행합니다.
- 로그인 응답 `{token}`을 기억하기 선택 시 localStorage, 그 외에는 sessionStorage에 저장하고 `Authorization: Bearer ...`로 전송합니다. 로그아웃은 로컬 토큰 제거이며 서버 토큰 폐기는 구현되어 있지 않습니다.
- `created_at`→`joinedAt/createdAt`, `user_id`→`authorId`, `post_id`→`postId`, `view_count/like_count/comment_count`→화면 필드명으로 변환하고 숫자 ID를 문자열로 바꿉니다.
- 좋아요 설정은 PUT에서 POST `/api/posts/:id/like`로 변경. 해제는 DELETE 유지.
- 댓글 목록/작성은 `/api/posts/:id/comments`로 변경. 댓글 삭제는 `/api/comments/:id` 유지.
- 게시글 목록의 배열을 받아 브라우저에서 페이지를 나누며, 댓글순 정렬과 내 글 필터도 브라우저에서 수행합니다.

## 확인해야 할 한계

팀원 코드 주석 및 구현 기준으로 `type`, `tags`, `bio`를 저장하지 않습니다. type은 항상 blog, tags는 빈 배열, bio는 빈 문자열로 표시되어 실제 모드 Q&A 목록은 비게 됩니다. 프로필 내 댓글/좋아요한 글은 빈 배열, 댓글 통계는 `-`, 내 글/좋아요 통계는 내려받은 최근 글 목록 범위만 계산합니다. 최근 100개 제한이 실제 서버에 있다면 전역 통계/페이지 수가 아닙니다. username의 50자 제한도 팀원 주석 기준이므로 백엔드 스키마를 확인해야 합니다.

화면에서 태그/자기소개를 입력해도 실제 모드에서는 저장되지 않는다는 점을 팀과 공유하세요. `docs/API.md`를 새 어댑터 기준으로 수정했고, 기존 제안 내용이 실제 연동 설명으로 오해되지 않도록 정리했습니다.

## 이번 관리자 추가판

- 팀원의 JWT/필드명/댓글/좋아요 어댑터를 유지하고 `src/api/real.js`로 분리해 검사할 수 있게 만들었습니다.
- `/admin`, `/admin/posts`, `/admin/comments`, `/admin/users` 화면 및 mock 권한 검사/조회/삭제/삭제사유 기록 추가.
- role은 서버 `/api/users/me` 값만 사용. 이메일/닉네임/클라이언트 가입 요청으로 관리자 승격하지 않습니다.
- 신규 관리자 API는 `docs/ADMIN_API.md`의 계약 제안이며 아직 실제 서버 구현을 확인하지 않았습니다.
- 잘못된 날짜는 `—`로 표시하고, 누락된 로그인 token 및 저장소 오류를 표시하도록 보완했습니다.
