package cve_threshold

default allow = false

allow {
    count(deny_cve) == 0
}

deny_cve[cve] {
    some i
    cve := input.scan_results[i]
    cve.severity == "CRITICAL"
}

deny_cve[cve] {
    some i
    cve := input.scan_results[i]
    cve.severity == "HIGH"
}

violation[msg] {
    some i
    cve := input.scan_results[i]
    cve.severity == "CRITICAL"
    msg := sprintf("Critical vulnerability found: %s in package %s", [cve.cve_id, cve.package_name])
}

violation[msg] {
    some i
    cve := input.scan_results[i]
    cve.severity == "HIGH"
    msg := sprintf("High vulnerability found: %s in package %s", [cve.cve_id, cve.package_name])
}
