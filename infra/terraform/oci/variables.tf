variable "project" {
  type    = string
  default = "katalog-umkm"
}

# ---------- Kredensial OCI API key (Profile → API keys) ----------
variable "tenancy_ocid" { type = string }
variable "user_ocid" { type = string }
variable "fingerprint" { type = string }
variable "private_key_path" { type = string }
variable "compartment_ocid" { type = string }

variable "region" {
  type    = string
  default = "ap-singapore-1"
}

variable "ad_index" {
  description = "Coba 0/1/2 kalau muncul error 'Out of host capacity'"
  type        = number
  default     = 0
}

# ---------- Spesifikasi VM (batas Always Free: total 4 OCPU / 24 GB) ----------
variable "instance_shape" {
  type    = string
  default = "VM.Standard.A1.Flex"
}

variable "ocpus" {
  type    = number
  default = 2
}

variable "memory_gb" {
  type    = number
  default = 12
}

variable "boot_volume_gb" {
  type    = number
  default = 50
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_ed25519.pub"
}

variable "ssh_allowed_cidr" {
  description = "IP yang boleh SSH, contoh 103.10.20.30/32. 0.0.0.0/0 = semua (kurang aman)"
  type        = string
  default     = "0.0.0.0/0"
}
