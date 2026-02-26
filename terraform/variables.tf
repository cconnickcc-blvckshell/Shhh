variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_secondary_region" {
  description = "Secondary AWS region for multi-region"
  type        = string
  default     = "us-west-2"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "shhh"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "shhh.app"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "ecs_cpu" {
  description = "ECS task CPU"
  type        = number
  default     = 1024
}

variable "ecs_memory" {
  description = "ECS task memory"
  type        = number
  default     = 2048
}

variable "min_capacity" {
  description = "Min ECS tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Max ECS tasks"
  type        = number
  default     = 20
}
