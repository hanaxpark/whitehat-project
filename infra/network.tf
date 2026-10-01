resource "aws_security_group" "task" {
  name        = "blueteam-ecs-task-sg"
  description = "users/contents Fargate tasks"
  vpc_id      = data.aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "task_from_alb" {
  security_group_id            = aws_security_group.task.id
  referenced_security_group_id = data.aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  description                  = "ALB to tasks"
}

# NAT가 없으므로 VPC 엔드포인트(ECR/Secrets/Logs, 443)와 S3 게이트웨이(이미지 레이어)만 열어 둔다.
resource "aws_vpc_security_group_egress_rule" "task_to_endpoints" {
  security_group_id = aws_security_group.task.id
  cidr_ipv4         = data.aws_vpc.main.cidr_block
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "VPC interface endpoints"
}

resource "aws_vpc_security_group_egress_rule" "task_to_s3" {
  security_group_id = aws_security_group.task.id
  prefix_list_id    = data.aws_prefix_list.s3.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "S3 gateway endpoint"
}

resource "aws_vpc_security_group_egress_rule" "task_to_db" {
  security_group_id            = aws_security_group.task.id
  referenced_security_group_id = data.aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  description                  = "MySQL"
}

# 기존 SG 3개에는 규칙만 추가한다 (SG 자체는 관리하지 않음).
resource "aws_vpc_security_group_ingress_rule" "db_from_task" {
  security_group_id            = data.aws_security_group.db.id
  referenced_security_group_id = aws_security_group.task.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  description                  = "ECS tasks to db"
}

resource "aws_vpc_security_group_ingress_rule" "endpoints_from_task" {
  security_group_id            = data.aws_security_group.endpoints.id
  referenced_security_group_id = aws_security_group.task.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  description                  = "ECS tasks to endpoints"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_task" {
  security_group_id            = data.aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.task.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  description                  = "ALB to ECS tasks"
}

resource "aws_lb_target_group" "svc" {
  for_each             = local.services
  name                 = "${each.key}-tg"
  port                 = 3000
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = data.aws_vpc.main.id
  deregistration_delay = 30

  health_check {
    path    = "/health"
    matcher = "200"
  }
}

resource "aws_lb_listener_rule" "svc" {
  for_each     = local.services
  listener_arn = data.aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.svc[each.key].arn
  }

  condition {
    host_header { values = [var.web_host] }
  }

  condition {
    path_pattern { values = each.value.paths }
  }
}
