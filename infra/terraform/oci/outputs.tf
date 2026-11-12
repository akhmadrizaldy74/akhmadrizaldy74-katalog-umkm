output "public_ip" {
  description = "Arahkan DNS A record API_DOMAIN ke IP ini"
  value       = oci_core_instance.app.public_ip
}

output "ssh" {
  value = "ssh ubuntu@${oci_core_instance.app.public_ip}"
}
