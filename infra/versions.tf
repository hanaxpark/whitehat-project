terraform {
  required_version = ">= 1.10"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # bucket은 코드에 넣지 않는다: terraform init -backend-config="bucket=<state 버킷>"
  backend "s3" {
    key          = "blueteam/backend/terraform.tfstate"
    region       = "us-west-2"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-west-2"
}

variable "web_host" {
  type    = string
  default = "web.ratelxd.com"
}

variable "github_repo" {
  type        = string
  description = "OIDC sub 클레임의 저장소 부분 그대로 (예: ORG@<id>/REPO@<id>). 배포 역할이 이 저장소의 main 브랜치만 허용한다. 조회: gh api repos/ORG/REPO --jq '\"\\(.owner.login)@\\(.owner.id)/\\(.name)@\\(.id)\"'"
}

variable "initial_image_tag" {
  type        = string
  default     = "bootstrap"
  description = "첫 task definition이 가리키는 이미지 태그. 서비스 생성 전에 이 태그로 ECR에 push해 둬야 한다."
}

variable "desired_count" {
  type    = number
  default = 1
}
