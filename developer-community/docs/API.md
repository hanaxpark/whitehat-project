# 백엔드 팀 전달용 API 제안 명세

서비스 경로는 팀에서 확정한 값입니다. 아래 HTTP 메서드, 하위 경로, 필드, 쿠키 인증 및 응답 envelope는 **프론트 스타터를 위한 제안 계약**이며 실제 구현 여부를 확인한 명세가 아닙니다. 백엔드 팀과 합의한 뒤 `src/api/index.js`와 필요한 응답 어댑터를 수정해주세요.

## 공통 규칙

- 브라우저 요청은 `/api/...` 상대경로. 배포 환경의 도메인은 하나입니다.
- 인증: 서버가 발급하는 HttpOnly 세션 쿠키. `credentials: include` 사용. 토큰은 localStorage에 저장하지 않습니다.
- 성공 응답: `{ "data": ... }`. 삭제/로그아웃은 204 No Content 가능.
- 오류 응답: `{ "error": { "code": "VALIDATION", "message": "사용자에게 표시할 오류" } }`.
- 401 비로그인/만료, 403 권한 부족, 404 없음, 409 중복, 422 입력 검증, 429 요청 제한, 5xx 서버 오류.
- ID는 JSON 문자열, 날짜는 UTC ISO 8601. `likeCount`, `commentCount`, `views`, `total`은 숫자입니다.
- 서버는 글/댓글 소유권, 입력 길이, 이메일 중복, 비밀번호 해시, 요청 제한을 검증해야 합니다. 클라이언트의 `authorId`를 권한 근거로 사용하지 않습니다.

## Users Service

| 기능 | 메서드 / 경로 | 요청 | data 응답 | 인증 |
|---|---|---|---|---|
| 로그인 | POST `/api/auth/login` | `{email,password,remember:boolean}` | User + Set-Cookie | 없음 |
| 회원가입 (자동 로그인) | POST `/api/auth/register` | `{email,password,nickname}` | User + Set-Cookie | 없음 |
| 로그아웃 | POST `/api/auth/logout` | 없음 | 204, 쿠키 폐기 | 쿠키 |
| 현재 사용자 | GET `/api/users/me` | 없음 | User | 쿠키 |
| 프로필 수정 | PATCH `/api/users/me` | `{nickname,bio}` | User | 쿠키 |
| 내 활동 | GET `/api/users/me/activity?kind=posts` | kind: `posts`, `comments`, `liked` | `{stats:{posts,comments,likes},items:Post[] 또는 Comment[]}` | 쿠키 |

User: `{id,email,nickname,bio,joinedAt}`. 비밀번호나 해시를 응답에 포함하지 않습니다. Post/Comment의 공개 author는 `{id,nickname,bio,joinedAt}`만 응답해도 됩니다. 프론트는 author 이메일을 사용하지 않습니다.

현재 스타터의 활동 목록은 전체 결과를 받습니다. 규모가 커지면 페이징을 추가하세요. Users가 활동을 제공하려면 Contents 데이터 조회 협의가 필요합니다. 독립 DB를 사용한다면 내부 서비스 호출 또는 Contents의 사용자 필터 조회로 계약을 조정하세요.

## Contents Service

| 기능 | 메서드 / 경로 | 요청 | data 응답 | 인증 |
|---|---|---|---|---|
| 목록/검색 | GET `/api/posts` | query 아래 참고 | `{items:Post[],total,page,pageSize}` | 선택 |
| 상세 | GET `/api/posts/:id` | 없음 | Post | 선택 |
| 작성 | POST `/api/posts` | PostInput | Post (201) | 쿠키 |
| 수정 | PATCH `/api/posts/:id` | PostInput | Post | 작성자 |
| 삭제 | DELETE `/api/posts/:id` | 없음 | 204 | 작성자 |
| 좋아요 설정 | PUT `/api/posts/:id/like` | 없음 | `{liked:true,likeCount}` | 쿠키 |
| 좋아요 해제 | DELETE `/api/posts/:id/like` | 없음 | `{liked:false,likeCount}` | 쿠키 |
| 댓글 목록 | GET `/api/comments?postId=:id` | postId | Comment[] | 없음 |
| 댓글 작성 | POST `/api/comments` | `{postId,content}` | Comment (201) | 쿠키 |
| 댓글 삭제 | DELETE `/api/comments/:id` | 없음 | 204 | 작성자 |

목록 query: `category`, `q` (제목/본문/태그/닉네임 검색), `type=blog|question`, `sort=latest|popular|comments`, `page=1`, `pageSize=5`, 선택 `authorId`. 정렬은 최신 작성일 / 좋아요 수 / 댓글 수 기준입니다. 서버에서 pageSize 상한을 제한하세요.

PostInput: `{title,content,category,type,tags:string[]}`. 제목 1–150자, 본문 1–50,000자, 태그 최대 5개. category는 `general`, `frontend`, `backend`, `cloud`, `security`, `study`, `free`. type은 `blog` 또는 `question`.

Post: `{id,title,content,category,type,tags,authorId,author,createdAt,updatedAt,views,likeCount,commentCount,liked}`. `liked`는 현재 사용자 기준이며 비로그인 때 false. 좋아요는 userId/postId 고유 제약과 멱등성 보장 필요.

Comment: `{id,postId,authorId,author,content,createdAt}`. 댓글 1–2,000자. 게시글 삭제 시 댓글도 삭제하거나 숨기도록 합의하세요.

```json
{
  "data": {
    "id": "p1", "title": "AWS 아키텍처 구축 후기", "content": "## 배운 점\n...",
    "category": "cloud", "type": "blog", "tags": ["AWS"], "authorId": "u1",
    "author": {"id":"u1","nickname":"cloud_dev","bio":"개발자","joinedAt":"2026-01-01T00:00:00Z"},
    "createdAt":"2026-10-01T00:00:00Z", "updatedAt":"2026-10-01T00:00:00Z",
    "views":128, "likeCount":24, "commentCount":5, "liked":false
  }
}
```

## 인증 및 배포 합의 사항

두 서비스가 같은 세션을 검증할 방법(공유 세션 저장소 또는 서버 간 검증)을 정하세요. `Secure; HttpOnly; SameSite=Lax; Path=/` 쿠키를 제안합니다. remember=true일 때만 지속 세션을 사용하고, 로그아웃은 서버 세션까지 폐기해야 합니다. 상태 변경 요청은 Origin 검증 등 CSRF 보호를 백엔드에서 적용하세요. CSRF 토큰 방식으로 합의하면 api client에 헤더를 추가해야 합니다.

S3 이미지 업로드, 댓글 수정/답글/댓글 좋아요, 관리자, 비밀번호 재설정, 알림은 이 스타터 범위에서 구현하지 않았습니다. 이미지 업로드는 Contents Service의 presigned URL API, 파일 크기/MIME 검증, 공개 이미지 주소 계약을 추가한 후 연결하세요.
