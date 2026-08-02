package unit_test

default allow = false

allow {
    input.test_status == "passed"
}

violation[msg] {
    input.test_status != "passed"
    msg := sprintf("Unit test status is '%s', expected 'passed'", [input.test_status])
}
