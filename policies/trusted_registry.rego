package trusted_registry

default allow = false

allow {
    count(untrusted_containers) == 0
}

untrusted_containers[container_name] {
    some i
    container := input.manifest.spec.template.spec.containers[i]
    container_name := container.name
    not startswith(container.image, "docker.io/")
    not startswith(container.image, "ghcr.io/")
}

violation[msg] {
    some i
    container := input.manifest.spec.template.spec.containers[i]
    not startswith(container.image, "docker.io/")
    not startswith(container.image, "ghcr.io/")
    msg := sprintf("Container '%s' uses image from untrusted registry: %s", [container.name, container.image])
}
