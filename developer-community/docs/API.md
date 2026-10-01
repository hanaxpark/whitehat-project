# 기존 API — 팀원 수정 어댑터 기준

이 문서는 사용자가 제공한 팀원 ZIP의 client/index 구현에서 확인한 **프론트가 기대하는 계약**입니다. 백엔드 소스나 실제 응답을 독립적으로 확인한 결과가 아닙니다. 관리자 추가 API는 `ADMIN_API.md`에 별도로 정리했습니다.

## 공통

상대경로 `/api/...`, Authorization Bearer JWT, 성공 raw JSON (기존 `{data}` wrapper 미사용), 오류 `{message,code}`. DELETE는 204 No Content 또는 JSON 응답. 401 때 토큰 제거 및 AuthContext 초기화. 숫자 ID와 snake_case 날짜/필드명을 어댑터에서 화면용으로 변환합니다.

## Users

| 기능 | 메서드 / 경로 | 요청 | 기대 응답 |
|---|---|---|---|
| 로그인 | POST `/api/auth/login` | `{username:email,password}` | `{token}` |
| 가입 | POST `/api/auth/register` | `{username:email,email,password,nickname}` | `{id}` (이후 로그인 호출) |
| 현재 사용자 | GET `/api/users/me` | Bearer | User |
| 닉네임 수정 | PATCH `/api/users/me` | `{nickname}` | raw JSON 또는 204 (이후 me 재조회) |

User: `id,email,username,nickname,created_at`. 관리자 구현 때 `role` 추가. role이 `admin`인 경우만 관리자 화면 허용하며 누락 값은 user 처리. 자기소개 bio는 현재 빈 문자열로 표시하고 저장하지 않습니다. 팀원 주석의 username 50자 제한은 백엔드 스키마를 확인하세요.

로그아웃 API 호출 없이 브라우저 JWT만 삭제합니다. 서버 로그아웃/토큰 폐기나 refresh가 필요하면 백엔드 계약을 추가해야 합니다. 이 구현은 HttpOnly 쿠키 인증이 아닙니다. 저장된 JWT는 브라우저 스크립트에서 읽을 수 있으므로 XSS 방지, 토큰 만료/회수 방식을 팀과 맞추세요.

## Contents

| 기능 | 메서드 / 경로 | 요청 | 기대 응답 |
|---|---|---|---|
| 목록 | GET `/api/posts` | category, q, sort=latest 또는 popular | Post[] |
| 상세 | GET `/api/posts/:id` | 선택 Bearer | Post |
| 작성 | POST `/api/posts` | `{title,content,category}` | `{id}` |
| 수정 | PATCH `/api/posts/:id` | `{title,content,category}` | raw JSON 또는 204 |
| 삭제 | DELETE `/api/posts/:id` | Bearer | raw JSON 또는 204 |
| 좋아요 설정 | POST `/api/posts/:id/like` | Bearer | raw JSON 또는 204 (상세 재조회) |
| 좋아요 해제 | DELETE `/api/posts/:id/like` | Bearer | raw JSON 또는 204 (상세 재조회) |
| 댓글 목록 | GET `/api/posts/:id/comments` | 없음 | Comment[] |
| 댓글 작성 | POST `/api/posts/:id/comments` | `{content}` | `{id}` |
| 댓글 삭제 | DELETE `/api/comments/:id` | Bearer | raw JSON 또는 204 |

Post: `id,title,content,category,user_id,nickname,created_at,updated_at,view_count,like_count,comment_count,liked`. Comment: `id,post_id,user_id,nickname,content,created_at`. 화면에서는 authorId/postId/createdAt/likeCount 등으로 매핑합니다. liked는 백엔드에서 boolean 또는 0/1을 반환해야 합니다.

category: general/frontend/backend/cloud/security/study/free. 어댑터는 type=blog, tags=[] 기본값을 쓰며 저장 요청에 type/tags를 보내지 않습니다. 목록 배열을 받은 후 브라우저 페이징/댓글순 정렬/내 글 필터링을 적용합니다. 서버의 최근 100개 제한이 실제로 있다면 전체 페이지와 사용자 통계가 아닙니다.

## 남은 계약 협의

- type/tags/bio 저장과 Q&A 목록.
- 내 댓글/좋아요한 글 조회, 정확한 사용자 전체 통계.
- 서버 페이징과 전체 total, 안정적인 정렬 및 검색 범위.
- 작성자 권한 서버 검사, 입력/SQL parameter 검증, 좋아요 중복 제약.
- S3 이미지 업로드와 URL 계약, 댓글 수정 API.
- 신규 관리자 권한/목록/삭제: `ADMIN_API.md` 참고.
