resource "aws_ecr_repository" "svc" {
  for_each             = local.services
  name                 = "${each.key}-service"
  image_tag_mutability = "IMMUTABLE" # CI는 :${git sha}로만 push한다

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "svc" {
  for_each   = local.services
  repository = aws_ecr_repository.svc[each.key].name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep last 10 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action       = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "svc" {
  for_each          = local.services
  name              = "/ecs/${each.key}-service"
  retention_in_days = 14
}

resource "aws_ecs_cluster" "main" {
  name = "blueteam"
}

resource "aws_ecs_task_definition" "svc" {
  for_each                 = local.services
  family                   = "${each.key}-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.exec.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name         = each.key
    image        = "${aws_ecr_repository.svc[each.key].repository_url}:${var.initial_image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3000 }]
    environment = [
      { name = "PORT", value = "3000" },
      { name = "DB_HOST", value = data.aws_db_instance.db.address },
      { name = "DB_PORT", value = "3306" },
      { name = "DB_NAME", value = "blueteam" },
    ]
    # 컨테이너 시작 전에 ECS가 값을 주입한다. 시크릿이 바뀌면 태스크를 재시작해야 반영된다.
    secrets = [
      { name = "DB_USER", valueFrom = "${local.db_secret_arn}:username::" },
      { name = "DB_PASSWORD", valueFrom = "${local.db_secret_arn}:password::" },
      { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.svc[each.key].name
        awslogs-region        = "us-west-2"
        awslogs-stream-prefix = each.key
      }
    }
  }])
}

resource "aws_ecs_service" "svc" {
  for_each                          = local.services
  name                              = "${each.key}-service"
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.svc[each.key].arn
  desired_count                     = var.desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 30

  network_configuration {
    subnets          = [data.aws_subnet.app.id]
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.svc[each.key].arn
    container_name   = each.key
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # 이후 이미지 교체는 CI가 새 task definition revision을 등록해서 배포한다.
  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.svc]
}
