# ??롫짗??곗쨮 筌띾슢諭?疫꿸퀣???紐낅늄??곕뮉 鈺곌퀬?띰쭕???뺣뼄 (state???節? ??놁벉).
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

  # 野껋럥以???꾨뗀諭?疫꿸퀣?: users = /api/auth, /api/users, contents = /api/posts(?蹂?夷뚪넫??툡????釉?, /api/comments
  services = {
    users = {
      priority = 10
      paths = [
        "/api/auth/*",
        "/api/users",
        "/api/users/*",
        "/api/admin/users*"
      ]
    }

    contents = {
      priority = 11
      paths = [
        "/api/posts*",
        "/api/comments/*",
        "/api/admin/posts*",
        "/api/admin/comments*"
      ]
    }
  }
}


