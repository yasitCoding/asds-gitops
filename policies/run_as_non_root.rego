package run_as_non_root

default allow = false

allow {
    input.manifest.spec.template.spec.securityContext.runAsNonRoot == true
}

allow {
    count(input.manifest.spec.template.spec.containers) > 0
    every container in input.manifest.spec.template.spec.containers {
        container.securityContext.runAsNonRoot == true
    }
}

violation[msg] {
    not input.manifest.spec.template.spec.securityContext.runAsNonRoot == true
    not every_container_is_non_root
    msg := "Pod or every container must set 'runAsNonRoot' to true"
}

every_container_is_non_root {
    count(input.manifest.spec.template.spec.containers) > 0
    every container in input.manifest.spec.template.spec.containers {
        container.securityContext.runAsNonRoot == true
    }
}
