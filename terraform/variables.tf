variable "linode_token" {
  description = "Linode API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Linode region"
  type        = string
  default     = "us-east"
}

variable "instance_type" {
  description = "Linode instance type"
  type        = string
  default     = "g6-standard-2"
}

variable "root_password" {
  description = "Root password for the instance"
  type        = string
  sensitive   = true
}

variable "matrix_domain" {
  description = "Domain for the Matrix server"
  type        = string
}