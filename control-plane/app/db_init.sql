-- Migration Script for 7 Core Tables and Initial Seed Data
-- Database: PostgreSQL (Supabase)

-- 1. REPOSITORIES TABLE
CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    repo_url VARCHAR(255) NOT NULL,
    repo_name VARCHAR(100) NOT NULL,
    image_name VARCHAR(100) NOT NULL,
    namespace VARCHAR(50) NOT NULL,
    branch VARCHAR(50) DEFAULT 'main' NOT NULL,
    test_command VARCHAR(255),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    webhook_secret VARCHAR(100) NOT NULL
);

-- 2. PIPELINE RUNS TABLE
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id SERIAL PRIMARY KEY,
    repository_id INT REFERENCES repositories(id) ON DELETE CASCADE NOT NULL,
    commit_hash VARCHAR(40) NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    image_tag VARCHAR(50) NOT NULL,
    test_status VARCHAR(20),
    test_output TEXT,
    scan_summary JSONB
);

-- 3. SCAN RESULTS TABLE
CREATE TABLE IF NOT EXISTS scan_results (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INT REFERENCES pipeline_runs(id) ON DELETE CASCADE NOT NULL,
    scanner_name VARCHAR(50) DEFAULT 'Trivy' NOT NULL,
    severity VARCHAR(20) NOT NULL,
    cve_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    installed_version VARCHAR(50),
    fixed_version VARCHAR(50),
    description TEXT
);

-- 4. POLICY RULES TABLE
CREATE TABLE IF NOT EXISTS policy_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rego_code TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE NOT NULL
);

-- 5. POLICY VIOLATIONS TABLE
CREATE TABLE IF NOT EXISTS policy_violations (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INT REFERENCES pipeline_runs(id) ON DELETE CASCADE NOT NULL,
    policy_rule_id INT REFERENCES policy_rules(id) ON DELETE CASCADE,
    violation_detail TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. DEPLOYMENTS TABLE
CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INT REFERENCES pipeline_runs(id) ON DELETE CASCADE NOT NULL,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    argocd_app_name VARCHAR(100) NOT NULL,
    deployment_status VARCHAR(20) NOT NULL,
    cluster_namespace VARCHAR(50) NOT NULL
);

-- 7. NOTIFICATIONS LOG TABLE
CREATE TABLE IF NOT EXISTS notifications_log (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INT REFERENCES pipeline_runs(id) ON DELETE CASCADE NOT NULL,
    channel VARCHAR(50) DEFAULT 'Web Dashboard' NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message_content TEXT NOT NULL
);

-- ==========================================
-- SEED DATA FOR POLICY RULES
-- ==========================================
INSERT INTO policy_rules (rule_name, rego_code, description, enabled)
VALUES 
(
    'Unit Test Policy',
    'package main

default allow = false

allow {
    input.test_status == "passed"
}',
    'ผลลัพธ์ Unit Test ต้องเป็น passed',
    true
),
(
    'CVE Threshold Policy',
    'package main

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
}',
    'ห้ามมีช่องโหว่ระดับ CRITICAL หรือ HIGH จาก Trivy Scan',
    true
),
(
    'RunAsNonRoot Policy',
    'package main

default allow = false

allow {
    input.manifest.spec.template.spec.securityContext.runAsNonRoot == true
}',
    'คอนเทนเนอร์ในไฟล์ Manifest ต้องกำหนด runAsNonRoot: true',
    true
),
(
    'Resource Limits Policy',
    'package main

default allow = false

allow {
    some i
    container := input.manifest.spec.template.spec.containers[i]
    container.resources.limits.cpu
    container.resources.limits.memory
}',
    'คอนเทนเนอร์ทุกตัวต้องกำหนด resources.limits.cpu และ memory',
    true
),
(
    'Trusted Registry Policy',
    'package main

default allow = false

allow {
    some i
    container := input.manifest.spec.containers[i]
    startswith(container.image, "docker.io/")
}',
    'อิมเมจต้องดึงมาจาก Container Registry ที่อนุญาตเท่านั้น',
    true
)
ON CONFLICT DO NOTHING;
