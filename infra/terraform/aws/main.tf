# SQS (+ dead-letter queue) → Lambda → Telegram, plus IAM user khusus untuk API
# dan budget alert. Semua layanan ini masuk AWS Always Free untuk trafik UMKM.
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = var.project }
  }
}

# ---------- Queue ----------
resource "aws_sqs_queue" "orders_dlq" {
  name                      = "${var.project}-orders-dlq"
  message_retention_seconds = 1209600 # 14 hari
}

resource "aws_sqs_queue" "orders" {
  name                       = "${var.project}-orders"
  visibility_timeout_seconds = 60 # >= timeout Lambda
  message_retention_seconds  = 345600
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.orders_dlq.arn
    maxReceiveCount     = 5
  })
}

# ---------- Lambda ----------
data "archive_file" "notify_order" {
  type        = "zip"
  source_file = "${path.module}/../../../lambda/notify_order/handler.py"
  output_path = "${path.module}/build/notify_order.zip"
}

resource "aws_iam_role" "lambda" {
  name = "${var.project}-notify-order"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_sqs" {
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
      Resource = aws_sqs_queue.orders.arn
    }]
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project}-notify-order"
  retention_in_days = 7 # hemat kuota log gratis
}

resource "aws_lambda_function" "notify_order" {
  function_name    = "${var.project}-notify-order"
  role             = aws_iam_role.lambda.arn
  runtime          = "python3.12"
  architectures    = ["arm64"]
  handler          = "handler.handler"
  filename         = data.archive_file.notify_order.output_path
  source_code_hash = data.archive_file.notify_order.output_base64sha256
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      TELEGRAM_BOT_TOKEN = var.telegram_bot_token
      TELEGRAM_CHAT_ID   = var.telegram_chat_id
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

resource "aws_lambda_event_source_mapping" "orders" {
  event_source_arn        = aws_sqs_queue.orders.arn
  function_name           = aws_lambda_function.notify_order.arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
}

# ---------- IAM user untuk API di Oracle VM (hanya boleh kirim ke queue) ----------
resource "aws_iam_user" "api" {
  name = "${var.project}-api"
}

resource "aws_iam_user_policy" "api_sqs" {
  user = aws_iam_user.api.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.orders.arn
    }]
  })
}

resource "aws_iam_access_key" "api" {
  user = aws_iam_user.api.name
}

# ---------- Budget alert: email kalau biaya > $1 ----------
resource "aws_budgets_budget" "guard" {
  name         = "${var.project}-budget"
  budget_type  = "COST"
  limit_amount = "1"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100 # 100% dari $1
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_email]
  }
}
