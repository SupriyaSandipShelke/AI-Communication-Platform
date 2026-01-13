terraform {
  required_providers {
    linode = {
      source  = "linode/linode"
      version = "~> 2.0"
    }
  }
}

provider "linode" {
  token = var.linode_token
}

resource "linode_instance" "matrix" {
  label       = "matrix-server"
  region      = var.region
  type        = var.instance_type
  image       = "linode/ubuntu20.04"
  root_pass   = var.root_password
  authorized_keys = []

  interface {
    purpose = "public"
  }

  boot_config {
    label = "My Boot Config"
  }
}

resource "linode_firewall" "matrix" {
  label = "matrix-firewall"

  rules {
    inbound {
      label    = "ssh"
      action   = "ACCEPT"
      protocol = "TCP"
      ports    = "22"
      addresses {
        ipv4 = ["0.0.0.0/0"]
        ipv6 = ["::/0"]
      }
    }

    inbound {
      label    = "matrix"
      action   = "ACCEPT"
      protocol = "TCP"
      ports    = "80,443,8448"
      addresses {
        ipv4 = ["0.0.0.0/0"]
        ipv6 = ["::/0"]
      }
    }

    inbound_policy = "DROP"
    outbound_policy = "ACCEPT"
  }

  devices {
    linodes = [linode_instance.matrix.id]
  }
}

output "matrix_ip" {
  description = "IP address of the Matrix server"
  value       = linode_instance.matrix.ip_address
}