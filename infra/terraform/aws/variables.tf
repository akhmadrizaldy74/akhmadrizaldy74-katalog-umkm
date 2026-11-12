variable "project" {
  type    = string
  default = "katalog-umkm"
}

variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "telegram_bot_token" {
  type      = string
  sensitive = true
}

variable "telegram_chat_id" {
  type = string
}

variable "budget_email" {
  description = "Email penerima peringatan biaya"
  type        = string
}
