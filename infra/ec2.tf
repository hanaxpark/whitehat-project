variable "deploy_bucket" {
  type        = string
  default     = "blueteam-deploy-918111244569"
  description = "직접 만들어 둔 S3 버킷 (Terraform은 조회만 한다). wazuh agent rpm과 web 배포 산출물을 여기서 받는다. deploy-web.yml도 이 이름 규칙(blueteam-deploy-<계정ID>)을 쓴다."
}

variable "wazuh_agent_rpm" {
  type        = string
  default     = "wazuh/wazuh-agent.rpm"
  description = "배포 버킷 안의 wazuh agent rpm 키. NAT가 없어 packages.wazuh.com에 못 가므로 미리 올려 둔다. 버전은 매니저와 같거나 낮아야 한다."
}

# 기존 리소스는 조회만 한다.
data "aws_security_group" "webapp" {
  vpc_id = data.aws_vpc.main.id
  name   = "whs-webapp-sg"
}

data "aws_security_group" "wazuh" {
  vpc_id = data.aws_vpc.main.id
  name   = "whs-wazuh-aio-sg"
}

data "aws_security_group" "ssm_endpoints" {
  vpc_id = data.aws_vpc.main.id
  name   = "wazuh-ssm-endpoint-sg"
}

data "aws_lb_target_group" "webapp" {
  name = "whs-webapp-tg"
}

data "aws_instance" "wazuh" {
  filter {
    name   = "tag:Name"
    values = ["whs-wazuh"]
  }
  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

# NAT가 없다: AL2023 dnf 저장소는 S3에 있어서 S3 게이트웨이 엔드포인트로 받는다.
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_s3_bucket" "deploy" {
  bucket = var.deploy_bucket
}

resource "aws_iam_role" "ec2" {
  name = "blueteam-ec2"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "ec2_deploy_bucket" {
  name = "read-deploy-bucket"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "s3:GetObject"
      Resource = "${data.aws_s3_bucket.deploy.arn}/*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "blueteam-ec2"
  role = aws_iam_role.ec2.name
}

# web은 기존 whs-webapp-sg(ALB 80 인바운드, wazuh 아웃바운드)를 재사용하고, admin만 새로 만든다. 인바운드는 없다 (SSM 전용).
resource "aws_security_group" "admin" {
  name        = "blueteam-admin-sg"
  description = "admin EC2 (SSM only)"
  vpc_id      = data.aws_vpc.main.id
}

resource "aws_vpc_security_group_egress_rule" "admin_to_endpoints" {
  security_group_id = aws_security_group.admin.id
  cidr_ipv4         = data.aws_vpc.main.cidr_block
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "VPC interface endpoints"
}

resource "aws_vpc_security_group_egress_rule" "admin_to_s3" {
  security_group_id = aws_security_group.admin.id
  prefix_list_id    = data.aws_prefix_list.s3.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "S3 gateway endpoint (dnf, deploy bucket)"
}

resource "aws_vpc_security_group_egress_rule" "admin_to_wazuh" {
  for_each                     = toset(["1514", "1515"])
  security_group_id            = aws_security_group.admin.id
  referenced_security_group_id = data.aws_security_group.wazuh.id
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.key)
  to_port                      = tonumber(each.key)
  description                  = "wazuh agent"
}

resource "aws_vpc_security_group_egress_rule" "admin_to_db" {
  security_group_id            = aws_security_group.admin.id
  referenced_security_group_id = data.aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  description                  = "MySQL"
}

resource "aws_vpc_security_group_egress_rule" "admin_to_task" {
  security_group_id            = aws_security_group.admin.id
  referenced_security_group_id = aws_security_group.task.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  description                  = "ECS tasks"
}

# 기존 SG에는 규칙만 추가한다.
resource "aws_vpc_security_group_ingress_rule" "ssm_endpoints_from_admin" {
  security_group_id            = data.aws_security_group.ssm_endpoints.id
  referenced_security_group_id = aws_security_group.admin.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  description                  = "admin EC2 to ssm endpoints"
}

resource "aws_vpc_security_group_ingress_rule" "wazuh_from_admin" {
  for_each                     = toset(["1514", "1515"])
  security_group_id            = data.aws_security_group.wazuh.id
  referenced_security_group_id = aws_security_group.admin.id
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.key)
  to_port                      = tonumber(each.key)
  description                  = "admin agent to manager"
}

resource "aws_vpc_security_group_ingress_rule" "db_from_admin" {
  security_group_id            = data.aws_security_group.db.id
  referenced_security_group_id = aws_security_group.admin.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  description                  = "admin EC2 to db"
}

resource "aws_vpc_security_group_ingress_rule" "task_from_admin" {
  security_group_id            = aws_security_group.task.id
  referenced_security_group_id = aws_security_group.admin.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  description                  = "admin EC2 to tasks"
}

locals {
  hosts = {
    web   = { sg = data.aws_security_group.webapp.id, pkg = "nginx" }
    admin = { sg = aws_security_group.admin.id, pkg = "mariadb105" }
  }
}

resource "aws_instance" "host" {
  for_each               = local.hosts
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = "t3.micro"
  subnet_id              = data.aws_subnet.app.id
  vpc_security_group_ids = [each.value.sg]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  # 첫 부팅 때만 실행된다. wazuh rpm이 버킷에 없으면 그 단계만 실패하고 나머지는 계속 진행한다.
  user_data = <<-EOT
    #!/bin/bash
    dnf install -y ${each.value.pkg}
    %{if each.key == "web"}systemctl enable --now nginx%{endif}
    aws s3 cp s3://${data.aws_s3_bucket.deploy.id}/${var.wazuh_agent_rpm} /tmp/wazuh-agent.rpm --region us-west-2
    WAZUH_MANAGER=${data.aws_instance.wazuh.private_ip} WAZUH_AGENT_NAME=blueteam-${each.key} rpm -ihv /tmp/wazuh-agent.rpm
    systemctl enable --now wazuh-agent
  EOT

  tags = { Name = "blueteam-${each.key}" }

  lifecycle {
    ignore_changes = [ami] # 최신 AL2023 AMI가 나와도 인스턴스를 교체하지 않는다
  }
}

resource "aws_lb_target_group_attachment" "web" {
  target_group_arn = data.aws_lb_target_group.webapp.arn
  target_id        = aws_instance.host["web"].id
  port             = 80
}

output "ec2_ids" {
  description = "접속: aws ssm start-session --target <id>"
  value       = { for k, i in aws_instance.host : k => i.id }
}

output "deploy_bucket" {
  value = data.aws_s3_bucket.deploy.id
}

# web 배포: GitHub Actions가 산출물을 S3에 올리고 SSM Run Command로 web EC2에 풀게 한다 (SSH 없음).
resource "aws_iam_role" "deploy_web" {
  name = "blueteam-deploy-web"
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

resource "aws_iam_role_policy" "deploy_web" {
  name = "deploy"
  role = aws_iam_role.deploy_web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:PutObject"
        Resource = "${data.aws_s3_bucket.deploy.arn}/web/*"
      },
      {
        Effect = "Allow"
        Action = "ssm:SendCommand"
        Resource = [
          "arn:aws:ssm:us-west-2::document/AWS-RunShellScript",
          aws_instance.host["web"].arn,
        ]
      },
      {
        Effect   = "Allow"
        Action   = "ssm:GetCommandInvocation"
        Resource = "*"
      },
    ]
  })
}

output "deploy_web" {
  description = "GitHub repo variables: WEB_DEPLOY_ROLE_ARN / WEB_INSTANCE_ID"
  value = {
    WEB_DEPLOY_ROLE_ARN = aws_iam_role.deploy_web.arn
    WEB_INSTANCE_ID     = aws_instance.host["web"].id
  }
}
