package run_as_non_root

default allow = false

allow {
    input.manifest.spec.template.spec.securityContext.runAsNonRoot == true
}

violation[msg] {
    not input.manifest.spec.template.spec.securityContext.runAsNonRoot
    msg := "Security context 'runAsNonRoot' must be set to true"
}

violation[msg] {
    input.manifest.spec.template.spec.securityContext.runAsNonRoot == false
    msg := "Container is configured to run as root ('runAsNonRoot' is false)"
}
