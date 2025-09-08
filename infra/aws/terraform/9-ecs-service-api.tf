##############################################
# CertNode  ECS Service (API, Fargate)
# File: infra/aws/terraform/9-ecs-service-api.tf
##############################################

# ------------------------------------------------------------
# Locals
# ------------------------------------------------------------
locals {
  container_name  = "api"
  container_port  = 8080
  task_cpu        = 512  # 0.5 vCPU (override by editing here if needed)
  task_memory     = 1024 # 1 GB
  desired_count   = 2
  min_capacity    = 2
  max_capacity    = 6
  target_cpu_util = 50
}

# Needed facts (provided in 00-data.tf):
# - data.aws_caller_identity.current
# - data.aws_region.current

# Resolve the ALB security group (created in i8) by its Name tag
# i8 tags the ALB SG as "${local.name_prefix}-alb-sg" with local.common_tags.
data "aws_security_group" "alb" {
  filter {
    name   = "tag:Name"
    values = ["${local.name_prefix}-alb-sg"]
  }
}

# Private subnets are already exposed in 5-rds.tf as data.aws_subnets.private

# Target group from i8 (ALB -> this service). Name/tag: "${local.name_prefix}-api-tg".
data "aws_lb_target_group" "api" {
  name = "${local.name_prefix}-api-tg"
}

# CloudWatch Log Group (created in i7)
# i7 defines local.log_group_app_name = "/aws/ecs/${local.name_prefix}-api"
locals {
  cw_log_group_name = local.log_group_app_name
}

# ------------------------------------------------------------
# Security Group for ECS tasks
# ------------------------------------------------------------
data "aws_vpc" "selected" {
  # i2 tags VPC with Name = "${name_prefix}-vpc"
  filter {
    name   = "tag:Name"
    values = ["${local.name_prefix}-vpc"]
  }
}

resource "aws_security_group" "api_tasks" {
  name        = "${local.name_prefix}-api-tasks-sg"
  description = "ECS tasks for ${local.name_prefix} API"
  vpc_id      = data.aws_vpc.selected.id

  # Egress anywhere (outbound calls, e.g., to RDS, S3 endpoints, KMS)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-tasks-sg"
  })
}

# Allow ALB -> tasks on the container port
resource "aws_security_group_rule" "alb_to_tasks" {
  type                     = "ingress"
  security_group_id        = aws_security_group.api_tasks.id
  from_port                = local.container_port
  to_port                  = local.container_port
  protocol                 = "tcp"
  source_security_group_id = data.aws_security_group.alb.id
  description              = "Allow ALB to reach API tasks"
}

# ------------------------------------------------------------
# Task Definition (Fargate, hardening on)
# ------------------------------------------------------------
resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name_prefix}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(local.task_cpu)
  memory                   = tostring(local.task_memory)
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn # from i3
  task_role_arn            = aws_iam_role.ecs_task.arn           # from i3

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = local.container_name
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/${local.ecr_repo_name}:latest" # CI will push immutable tags/digests
      essential = true
      portMappings = [{
        name          = "http"
        containerPort = local.container_port
        hostPort      = local.container_port
        protocol      = "tcp"
        appProtocol   = "http"
      }]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "LOG_LEVEL", value = "info" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = local.cw_log_group_name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
          mode                  = "non-blocking"
          max-buffer-size       = "25m"
        }
      }
      linuxParameters = {
        capabilities = {
          drop = ["ALL"]
        }
      }
      user                   = "10001"
      readonlyRootFilesystem = true
      disableNetworking      = false
      pseudoTerminal         = false
      mountPoints            = []
      volumesFrom            = []
      healthCheck = {
        command     = ["CMD-SHELL", "test -f /tmp/.boot || (sleep 2); wget -q -O - 127.0.0.1:${local.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }
    }
  ])

  # Define a small tmpfs for runtime scratch if the image expects it
  volume {
    name = "tmp"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-td"
  })
}

# ------------------------------------------------------------
# ECS Service (behind ALB)
# ------------------------------------------------------------
resource "aws_ecs_service" "api" {
  name                   = "${local.name_prefix}-api"
  cluster                = aws_ecs_cluster.this.id # from i7
  task_definition        = aws_ecs_task_definition.api.arn
  desired_count          = local.desired_count
  launch_type            = "FARGATE"
  enable_execute_command = false

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [aws_security_group.api_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = data.aws_lb_target_group.api.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 30
  propagate_tags                     = "SERVICE"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-svc"
  })

  lifecycle {
    ignore_changes = [
      task_definition # allow CI/CD to roll task defs without TF drift fights
    ]
  }

  depends_on = [
    aws_security_group_rule.alb_to_tasks
  ]
}

# ------------------------------------------------------------
# App Autoscaling (CPU-based target tracking)
# ------------------------------------------------------------
resource "aws_appautoscaling_target" "api" {
  max_capacity       = local.max_capacity
  min_capacity       = local.min_capacity
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.api]
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${local.name_prefix}-api-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = local.target_cpu_util
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}
