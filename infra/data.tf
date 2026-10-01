# 수동으로 만든 기존 인프라는 조회만 한다 (state에 넣지 않음).
data "aws_vpc" "main" {
  tags = { Name = "whs-vpc" }
}

data "aws_subnet" "app" {
  vpc_id = data.aws_vpc.main.id
  filter {
    name   = "tag:Name"
    values = ["whs-private-webapp"]
  }
}

data "aws_lb" "main" {
  name = "whs-alb"
}

data "aws_lb_listener" "https" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 443
}

data "aws_security_group" "alb" {
  vpc_id = data.aws_vpc.main.id
  name   = "whs-alb-sg"
}

data "aws_security_group" "db" {
  vpc_id = data.aws_vpc.main.id
  name   = "whs-db-sg"
}

data "aws_security_group" "endpoints" {
  vpc_id = data.aws_vpc.main.id
  name   = "whs-vpc-endpoint-sg"
}

data "aws_prefix_list" "s3" {
  name = "com.amazonaws.us-west-2.s3"
}

data "aws_db_instance" "db" {
  db_instance_identifier = "whs-db"
}

locals {
  db_secret_arn = data.aws_db_instance.db.master_user_secret[0].secret_arn

  # 경로는 코드 기준: users = /api/auth, /api/users, contents = /api/posts(댓글·좋아요 포함), /api/comments
  services = {
    users    = { priority = 10, paths = ["/api/auth/*", "/api/users", "/api/users/*"] }
    contents = { priority = 11, paths = ["/api/posts*", "/api/comments/*"] }
  }
}
