output "sqs_queue_url" {
  description = "Isi ke SQS_QUEUE_URL di .env server"
  value       = aws_sqs_queue.orders.url
}

output "api_access_key_id" {
  description = "Isi ke AWS_ACCESS_KEY_ID di .env server"
  value       = aws_iam_access_key.api.id
}

output "api_secret_access_key" {
  description = "Isi ke AWS_SECRET_ACCESS_KEY di .env server (terraform output -raw api_secret_access_key)"
  value       = aws_iam_access_key.api.secret
  sensitive   = true
}
