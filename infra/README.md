# Blue Team 백엔드 인프라 (Terraform)

users-service / contents-service를 **ECS Fargate**에 올리고, 기존 ALB의 경로 규칙으로 연결하고, GitHub Actions로 배포하는 Terraform 코드다.
AWS 계정 `918111244569`, 리전 `us-west-2`. 이미 수동으로 만들어진 VPC/ALB/RDS 등은 **조회(data source)만** 하고 새로 만들지 않는다.

## 만들어지는 것

| 파일 | 내용 |
|---|---|
| `versions.tf` | provider, S3 backend(버킷 이름은 init 때 전달), 변수 |
| `data.tf` | 기존 VPC/서브넷/ALB/SG/RDS 조회, **서비스별 경로 정의(`local.services`)** |
| `network.tf` | 태스크 SG, **기존 SG 3개에 규칙 추가**, 타깃 그룹, ALB 리스너 규칙 |
| `ecs.tf` | ECR, 로그 그룹, 클러스터, task definition, 서비스 |
| `iam.tf` | JWT 시크릿, ECS 실행 역할, GitHub OIDC provider, 서비스별 배포 역할 |
| `apply-schema.sh` | (Terraform 아님) DB 스키마/SQL을 일회성 Fargate 태스크로 실행 |

구조 요약:
- ALB `whs-alb` 443 리스너에서 `host=web.ratelxd.com` + 경로로 분기한다. users: `/api/auth/*`, `/api/users`, `/api/users/*` (priority 10), contents: `/api/posts*`, `/api/comments/*` (priority 11).
- 태스크는 프라이빗 서브넷 `whs-private-webapp`(us-west-2a)에 **서비스당 1개**. **NAT가 없다.** ECR/Secrets Manager/Logs는 이미 있는 VPC 엔드포인트, 이미지 레이어는 S3 게이트웨이 엔드포인트로 간다.
- DB 접속 정보: 호스트는 `whs-db`에서 읽고, 계정/비밀번호는 **RDS 관리형 시크릿**(`rds!db-...`), JWT는 새로 만드는 `blueteam/jwt-secret`. ECS가 컨테이너 시작 때 환경변수로 주입한다(앱 코드는 환경변수만 읽는다).
- 이미지 교체는 Terraform이 아니라 **CI가** 한다. 서비스의 `task_definition`은 `ignore_changes`다.

## 이미 계정에 있어서 다시 안 해도 되는 것

- state용 S3 버킷 `whs-blueteam-tfstate` (재사용)
- `whs-db`의 `blueteam` 데이터베이스와 테이블 4개(`users/posts/comments/likes`)

---

## 진행 순서

### 0. 준비
- 도구: `terraform >= 1.10`, `aws` CLI v2, `docker`, `jq`, (선택) `gh`
- AWS 자격증명(SSO). **`aws configure sso` 후 `export AWS_PROFILE=<프로필>`까지 해야 Terraform이 읽는다.** 안 하면 `terraform init`이 `No valid credential sources found`로 실패한다.

### 0. sso login
로컬 터미널에서 `aws configure sso` 실행
SSO session name은 원하시는 대로 하시고,
SSO start URL에 저희 Organization start URL인 `https://d-9267ca4957.awsapps.com/start` 이 내용 넣으시면 됩니다.
SSO region은 us-west-2.
SSO registration scopes는 기본 값으로 두시면 됩니다.

열리는 브라우저 창에서 로그인
id : blueteam-test1
pw : Zmffkdnemtlzbflxl1!

다시 터미널
Default client Region은 us-west-2
CLI default... 는 json
Profile name은 원하는 profile 이름

그 후 터미널에서
export AWS_PROFILE=<프로필 이름> => $env:AWS_PROFILE="blueteam"

하시면 --profile 없이도 계속 진행하실 수 있습니다.

### 1. GitHub 저장소와 `github_repo`
1. 배포할 GitHub 저장소를 **빈 저장소로 만든다**(README/.gitignore 추가 금지). **코드는 아직 push하지 않는다.** push는 8번에서 한다(Variables 등록 전에 push하면 워크플로가 인증 단계에서 실패한다).
2. zip에 들어 있는 `infra/terraform.tfvars`의 `github_repo`를 **자기 저장소 값으로 바꾼다.** 들어 있는 값은 삭제된 이전 저장소의 것이라 그대로 쓰면 안 된다.
   ```hcl
   github_repo = "<아래 명령의 출력>"
   ```
   **`ORG/REPO`가 아니라 숫자 ID가 붙은 형식이어야 한다.** GitHub OIDC 토큰의 `sub`가 `repo:ORG@<id>/REPO@<id>:ref:refs/heads/main` 형태라서 신뢰 정책이 이 문자열과 **정확히 일치**해야 한다. 조회:
   ```bash
   gh api repos/<계정>/<저장소> --jq '"\(.owner.login)@\(.owner.id)/\(.name)@\(.id)"'
   # gh가 없고 public이면:
   curl -s https://api.github.com/repos/<계정>/<저장소> | jq -r '"\(.owner.login)@\(.owner.id)/\(.name)@\(.id)"'
   ```
   저장소를 삭제하고 같은 이름으로 다시 만들면 ID가 바뀐다. 그때도 이 값을 새로 구해서 바꾸고 apply한다.

### 2. Terraform 초기화와 plan
```bash
cd infra
terraform init -backend-config="bucket=whs-blueteam-tfstate"
terraform plan
```
plan에서 확인: **기존 리소스의 destroy/replace가 0건**이고, 기존 SG 3개(`whs-alb-sg`, `whs-db-sg`, `whs-vpc-endpoint-sg`)에는 규칙 **추가**만 있어야 한다.

### 3. ECR과 OIDC 먼저 생성
```bash
terraform apply -target=aws_ecr_repository.svc -target=aws_iam_openid_connect_provider.github
```

### 4. 첫 이미지(`bootstrap` 태그) push — 이미지 없이 서비스를 만들면 태스크가 계속 실패한다
**프로젝트 루트(`users-service/`, `contents-service/` 폴더가 있는 곳)에서** 실행한다(`infra/`에서 하면 `path "users-service" not found`).
```bash
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 918111244569.dkr.ecr.us-west-2.amazonaws.com
for s in users contents; do
  docker build -t 918111244569.dkr.ecr.us-west-2.amazonaws.com/$s-service:bootstrap $s-service
  docker push 918111244569.dkr.ecr.us-west-2.amazonaws.com/$s-service:bootstrap
done
```
ECR 태그는 IMMUTABLE이라 같은 태그를 다시 push하면 실패한다.

### 5. 전체 apply
```bash
cd infra && terraform apply
```
출력의 `deploy_role_arns`를 GitHub 저장소 **Settings → Secrets and variables → Actions → Variables**에 등록한다: `USERS_DEPLOY_ROLE_ARN`, `CONTENTS_DEPLOY_ROLE_ARN`. 이름은 대소문자까지 그대로.

### 6. 서비스 상태 확인
```bash
aws ecs describe-services --region us-west-2 --cluster blueteam --services users-service contents-service \
  --query 'services[].{name:serviceName,desired:desiredCount,running:runningCount}'
aws logs tail /ecs/users-service --region us-west-2 --since 15m
```
둘 다 `running: 1`이어야 한다. 이벤트에 `ResourceInitializationError`가 있으면 엔드포인트/SG 문제다. 로그의 `npm error ... signal SIGTERM`은 ECS가 태스크를 교체할 때 나오는 정상 기록이다(앱 오류 아님).

### 7. DB 스키마 (이미 있어도 안전)
`db/schema.sql`은 `IF NOT EXISTS`뿐이라 반복 실행해도 데이터가 지워지지 않는다. DB가 프라이빗이라 로컬에서는 접속할 수 없어서, 이미 배포된 users-service task definition으로 일회성 태스크를 띄운다.
```bash
bash infra/apply-schema.sh              # db/schema.sql 적용
bash infra/apply-schema.sh ./my.sql     # 임의 SQL 실행 (이 스크립트로만 DB에 접근 가능)
```
성공하면 `exit: 0`과 `RESULT` 출력이 나온다. 스키마가 없으면 `/health`가 503이라 ECS가 태스크를 계속 재시작한다.

### 8. CI/CD 동작 확인
1. **여기서 처음으로 새 저장소에 push한다.** 그다음 `git init -b main` → `git add -A` → `git status`로 `.env`, `terraform.tfvars`가 목록에 **없는지** 확인 → commit → `git remote add origin <레포지토리 링크>` → `git push -u origin main`. 첫 push는 모든 경로가 변경으로 잡혀서 **두 워크플로가 모두 실행된다.** 이후에는 변경된 폴더의 워크플로만 실행된다(`users-service/**` → deploy-users, `contents-service/**` → deploy-contents). 이 첫 실행이 CI/CD 검증이다.
2. Actions가 초록색이면 ECR에 **git SHA 태그 이미지**가 생기고 task definition이 `:2`로 올라간다.
3. API 동작 확인 (`web.ratelxd.com`):
   ```bash
   H=https://web.ratelxd.com
   curl -s -X POST $H/api/auth/register -H 'Content-Type: application/json' -d '{"username":"smoketest","email":"smoke@test.com","password":"Test1234!","nickname":"smoke"}'
   TOKEN=$(curl -s -X POST $H/api/auth/login -H 'Content-Type: application/json' -d '{"username":"smoketest","password":"Test1234!"}' | jq -r .token)
   curl -s $H/api/users/me -H "Authorization: Bearer $TOKEN"
   curl -s -X POST $H/api/posts -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":"hello","content":"first","category":"general"}'
   curl -s $H/api/posts
   ```
   글 작성이 성공하면 두 서비스가 같은 `JWT_SECRET`을 쓰고 있다는 뜻이다.
4. 테스트 데이터 삭제 (cascade로 글도 함께 지워진다):
   ```bash
   printf "DELETE FROM blueteam.users WHERE username='smoketest';\nALTER TABLE blueteam.users AUTO_INCREMENT=1;\nALTER TABLE blueteam.posts AUTO_INCREMENT=1;\n" > /tmp/cleanup.sql
   bash infra/apply-schema.sh /tmp/cleanup.sql
   ```

---
