resource "random_password" "jwt" {
  length  = 48
  special = false
}

# users가 서명하고 contents가 검증하므로 두 서비스가 같은 시크릿을 참조한다.
resource "aws_secretsmanager_secret" "jwt" {
  name                    = "blueteam/jwt-secret"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt.result
}

# 태스크 시작 시 ECS가 이미지 pull / 로그 / 시크릿 조회에 쓰는 역할. 앱 코드는 AWS API를 부르지 않아 task role은 없다.
resource "aws_iam_role" "exec" {
  name = "blueteam-ecs-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "exec" {
  role       = aws_iam_role.exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "exec_secrets" {
  name = "read-app-secrets"
  role = aws_iam_role.exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = [local.db_secret_arn, aws_secretsmanager_secret.jwt.arn]
    }]
  })
}

# GitHub Actions OIDC: 장기 액세스 키 없이 main 브랜치에서만 서비스별 역할을 assume한다.
# 이미 계정에 같은 provider가 있으면 apply가 실패하므로 그때는 data source로 바꾼다.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

resource "aws_iam_role" "deploy" {
  for_each = local.services
  name     = "blueteam-deploy-${each.key}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "deploy" {
  for_each = local.services
  name     = "deploy"
  role     = aws_iam_role.deploy[each.key].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer",
        ]
        Resource = aws_ecr_repository.svc[each.key].arn
      },
      {
        # task definition API는 리소스 수준 제한을 지원하지 않는다.
        Effect   = "Allow"
        Action   = ["ecs:RegisterTaskDefinition", "ecs:DescribeTaskDefinition"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = aws_ecs_service.svc[each.key].id
      },
      {
        Effect    = "Allow"
        Action    = "iam:PassRole"
        Resource  = aws_iam_role.exec.arn
        Condition = { StringEquals = { "iam:PassedToService" = "ecs-tasks.amazonaws.com" } }
      },
    ]
  })
}

output "deploy_role_arns" {
  description = "GitHub repo variables: USERS_DEPLOY_ROLE_ARN / CONTENTS_DEPLOY_ROLE_ARN"
  value       = { for k, r in aws_iam_role.deploy : k => r.arn }
}

output "ecr_urls" {
  value = { for k, r in aws_ecr_repository.svc : k => r.repository_url }
}
