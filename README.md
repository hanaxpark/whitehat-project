# Blue Team Backend

ECS/Fargate 배포 단위는 2개로 유지하고, 각 서비스 내부 코드는 기능별로 분리했습니다.

- users-service : 인증/회원/프로필
- contents-service : 게시글/댓글/좋아요/검색
- RDS MySQL : 3306
- 각 Node.js 서비스 : 3000

실제 비밀번호/JWT Secret은 Git에 커밋하지 않습니다.
