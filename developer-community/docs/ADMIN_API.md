# 백엔드 팀 전달: 관리자 최소 구현 계약

첨부 기능 사진의 11번 관리자: 별도 권한, 부적절한 게시글 삭제, 댓글 삭제, 사용자 확인. 이 프론트에는 운영 현황/게시글 관리/댓글 관리/사용자 확인을 구현했습니다. 회원 정지/탈퇴, 역할 변경, 신고 처리 등은 요청 범위에 없어 추가하지 않았습니다.

**아래 API는 신규 제안입니다. 실제 백엔드에는 아직 없다는 전제로 만들었습니다.** 기존 팀원 어댑터에 맞춰 Bearer JWT와 raw JSON을 사용합니다. 프론트만으로 서버의 관리자 권한을 구현할 수 없으며 서버 구현 후 통합 검증이 필요합니다.

## 1. 권한 먼저 추가

Users의 사용자 모델에 `role`을 추가하세요. 값은 `user` 또는 `admin`, 기본값 user입니다. 회원가입/프로필 수정에서 role은 허용하지 않습니다. 최초 관리자는 일반 계정을 만든 뒤 운영자가 DB migration/관리 절차로 지정합니다. 프론트 mock 관리자 이메일/비밀번호를 운영 계정으로 자동 생성하지 마세요.

GET `/api/users/me`의 현재 응답에 role을 추가합니다.

```json
{"id":1,"username":"operator@example.com","email":"operator@example.com","nickname":"운영자","created_at":"2026-10-01T00:00:00Z","role":"admin"}
```

Contents의 관리자 라우트도 JWT 서명/만료/발급자를 검증하고 서버가 신뢰할 수 있는 role을 확인해야 합니다. 가능하면 현재 DB role을 조회하여 권한 회수가 즉시 반영되게 하세요. DB를 공유하지 않는다면 Users 내부 검증 또는 신뢰된 서버 통신으로 협의하세요. JWT payload를 서명 검증 없이 읽거나 요청 body/header의 role을 권한 근거로 사용하면 안 됩니다.

프론트는 `/me`에 role이 없거나 user이면 관리자 링크를 숨기고 직접 `/admin` 접속도 차단합니다. 이 화면 차단은 사용자 경험을 위한 것이며 서버의 권한 검사와 함께 사용해야 합니다.

## 2. 경로와 응답

일반 API 응답은 기존과 동일하게 유지하고, 아래 관리자 목록만 전체 개수와 서버 페이징을 제공합니다. 이 목록은 일반 게시글의 최근 100개 제한을 재사용하지 않습니다.

| 기능 | 서비스 | 메서드 / 경로 | 요청 | 응답 |
|---|---|---|---|---|
| 사용자 확인 | Users | GET `/api/users/admin/users` | q, page, pageSize | `{items:User[],total,page,pageSize}` |
| 전체 게시글 관리 | Contents | GET `/api/posts/admin/posts` | q, category, page, pageSize | `{items:Post[],total,page,pageSize}` |
| 게시글 삭제 | Contents | DELETE `/api/posts/admin/posts/:id` | JSON `{reason}` | 204 No Content |
| 전체 댓글 관리 | Contents | GET `/api/comments/admin/comments` | q, page, pageSize | `{items:Comment[],total,page,pageSize}` |
| 댓글 삭제 | Contents | DELETE `/api/comments/admin/comments/:id` | JSON `{reason}` | 204 No Content |

모든 엔드포인트는 admin 전용. 비로그인/만료는 401, 일반 사용자 JWT는 403, 삭제 대상 없음 404, 사유 검증 실패 422. 오류 JSON은 `{message,code}`. DELETE JSON body도 Express JSON parser에서 처리해주세요. 200 JSON을 쓰고 싶다면 `{message:"Deleted"}`도 client가 처리할 수 있지만 계약은 204로 맞추는 것을 권장합니다.

page 기본 1, pageSize 기본 10/최대 100. q 길이는 100자 이하. q는 사용자 목록에서 ID/이메일/닉네임, 글 목록에서 제목/본문/작성자, 댓글 목록에서 내용/작성자를 검색합니다. 게시글/댓글 최신 작성일 정렬, 같은 시각은 ID로 안정 정렬. total은 필터에 맞는 전체 개수이며 현재 페이지 길이가 아닙니다. query는 서버에서 검증하고 SQL은 parameter binding을 사용하세요.

### User 목록

필드: `id,username,email,nickname,created_at,role`. 비밀번호 해시/token은 절대 포함하지 않습니다.

### Post 목록

기존 일반 목록 필드 유지: `id,title,content,category,user_id,nickname,created_at,updated_at,view_count,like_count,comment_count,liked`. content는 목록에서 생략해도 됩니다. liked는 필요 없으면 false. 상세 열기는 기존 GET `/api/posts/:id`를 사용합니다.

### Comment 목록

`id,post_id,user_id,nickname,content,created_at,post_title`. post_title은 관리자가 원문을 찾을 수 있게 게시글 제목을 함께 반환합니다.

```json
{
  "items":[{"id":7,"post_id":2,"user_id":3,"nickname":"작성자","content":"댓글 내용","created_at":"2026-10-01T00:00:00Z","post_title":"원문 제목"}],
  "total":23,"page":1,"pageSize":10
}
```

## 3. 삭제 처리와 감사 기록

삭제 사유는 공백 제거 후 2~300자. admin actor ID는 검증한 JWT/DB 사용자에서 가져옵니다. 감사 기록에는 actor ID, 대상 유형/ID, 사유, 처리 시간, 결과를 기록하고 로그 조회 권한도 제한하세요. 게시글 삭제 시 연결된 댓글/좋아요를 함께 정리하여 FK 오류나 남은 데이터가 생기지 않게 하세요. 삭제와 감사 기록 저장은 원자적으로 처리하는 것이 좋습니다.

UI는 hard delete 기준으로 복구 불가 안내를 제공합니다. soft delete로 구현한다면 공개 목록/상세/댓글에서 삭제 상태를 제외하고, 재삭제 정책과 조회 규칙을 합의하세요. 현재 프론트에는 복구 기능이 없습니다. mock에서는 글/댓글 삭제 및 사유 기록이 브라우저 데이터에서 동작합니다.

## 4. 구현 순서

1. Users role migration, 기존 계정 기본 user, 최초 관리자 지정.
2. `/api/users/me` role 응답 및 사용자 확인 API 추가.
3. Contents의 인증/관리자 미들웨어와 관리 목록/삭제 API 추가.
4. 관리자용 `/admin/...` 라우트를 일반 `/:id` 라우트보다 먼저 등록하거나 ID 제약을 설정하여 `admin`이 ID로 잡히지 않게 처리.
5. 일반 계정 직접 API 호출 403, 관리자 타인 글/댓글 삭제, 연결 데이터/사유 기록, 401 만료를 통합 검증.

별도 서비스/ECS/관리자 페이지 전용 EC2는 필요하지 않습니다. `/admin` 화면도 같은 React dist/Nginx에서 제공하고 신규 API는 기존 `/api/users/*`, `/api/posts/*`, `/api/comments/*` ALB 규칙으로 분기됩니다. 아키텍처의 Admin EC2는 SSM 기반 인프라 운영 경로이며 웹 관리자 기능과 역할이 다릅니다.
