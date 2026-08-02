package resource_limits

default allow = false

allow {
    count(missing_limits) == 0
}

missing_limits[container_name] {
    some i
    container := input.manifest.spec.template.spec.containers[i]
    container_name := container.name
    not container.resources.limits.cpu
}

missing_limits[container_name] {
    some i
    container := input.manifest.spec.template.spec.containers[i]
    container_name := container.name
    not container.resources.limits.memory
}

violation[msg] {
    some name
    missing_limits[name]
    msg := sprintf("Container '%s' is missing CPU or memory resource limits", [name])
}
