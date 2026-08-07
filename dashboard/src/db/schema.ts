import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. REPOSITORIES
// ==========================================
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  repoUrl: varchar("repo_url", { length: 255 }).notNull(),
  repoName: varchar("repo_name", { length: 100 }).notNull(),
  imageName: varchar("image_name", { length: 100 }).notNull(),
  namespace: varchar("namespace", { length: 50 }).notNull(),
  branch: varchar("branch", { length: 50 }).default("main").notNull(),
  testCommand: varchar("test_command", { length: 255 }),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  webhookSecret: varchar("webhook_secret", { length: 100 }).notNull(),
});

// ==========================================
// 2. PIPELINE RUNS
// ==========================================
export const pipelineRuns = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  commitHash: varchar("commit_hash", { length: 40 }).notNull(),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  imageTag: varchar("image_tag", { length: 50 }).notNull(),
  testStatus: varchar("test_status", { length: 20 }),
  testOutput: text("test_output"),
  scanSummary: jsonb("scan_summary"),
});

// ==========================================
// 3. SCAN RESULTS
// ==========================================
export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id")
    .references(() => pipelineRuns.id, { onDelete: "cascade" })
    .notNull(),
  scannerName: varchar("scanner_name", { length: 50 })
    .default("Trivy")
    .notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  cveId: varchar("cve_id", { length: 50 }).notNull(),
  packageName: varchar("package_name", { length: 100 }).notNull(),
  installedVersion: varchar("installed_version", { length: 50 }),
  fixedVersion: varchar("fixed_version", { length: 50 }),
  description: text("description"),
});

// ==========================================
// 4. POLICY RULES
// ==========================================
export const policyRules = pgTable("policy_rules", {
  id: serial("id").primaryKey(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  regoCode: text("rego_code").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true).notNull(),
});

// ==========================================
// 5. POLICY VIOLATIONS
// ==========================================
export const policyViolations = pgTable("policy_violations", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id")
    .references(() => pipelineRuns.id, { onDelete: "cascade" })
    .notNull(),
  policyRuleId: integer("policy_rule_id").references(() => policyRules.id, {
    onDelete: "cascade",
  }),
  violationDetail: text("violation_detail").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 6. DEPLOYMENTS
// ==========================================
export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id")
    .references(() => pipelineRuns.id, { onDelete: "cascade" })
    .notNull(),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  argocdAppName: varchar("argocd_app_name", { length: 100 }).notNull(),
  deploymentStatus: varchar("deployment_status", { length: 20 }).notNull(),
  clusterNamespace: varchar("cluster_namespace", { length: 50 }).notNull(),
});

// ==========================================
// 7. NOTIFICATIONS LOG
// ==========================================
export const notificationsLog = pgTable("notifications_log", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id")
    .references(() => pipelineRuns.id, { onDelete: "cascade" })
    .notNull(),
  channel: varchar("channel", { length: 50 })
    .default("Web Dashboard")
    .notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  messageContent: text("message_content").notNull(),
});

// ==========================================
// RELATIONS
// ==========================================
export const repositoriesRelations = relations(repositories, ({ many }) => ({
  pipelineRuns: many(pipelineRuns),
}));

export const pipelineRunsRelations = relations(
  pipelineRuns,
  ({ one, many }) => ({
    repository: one(repositories, {
      fields: [pipelineRuns.repositoryId],
      references: [repositories.id],
    }),
    scanResults: many(scanResults),
    policyViolations: many(policyViolations),
    deployments: many(deployments),
    notificationsLog: many(notificationsLog),
  }),
);

export const scanResultsRelations = relations(scanResults, ({ one }) => ({
  pipelineRun: one(pipelineRuns, {
    fields: [scanResults.pipelineRunId],
    references: [pipelineRuns.id],
  }),
}));

export const policyRulesRelations = relations(policyRules, ({ many }) => ({
  violations: many(policyViolations),
}));

export const policyViolationsRelations = relations(
  policyViolations,
  ({ one }) => ({
    pipelineRun: one(pipelineRuns, {
      fields: [policyViolations.pipelineRunId],
      references: [pipelineRuns.id],
    }),
    policyRule: one(policyRules, {
      fields: [policyViolations.policyRuleId],
      references: [policyRules.id],
    }),
  }),
);

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  pipelineRun: one(pipelineRuns, {
    fields: [deployments.pipelineRunId],
    references: [pipelineRuns.id],
  }),
}));

export const notificationsLogRelations = relations(
  notificationsLog,
  ({ one }) => ({
    pipelineRun: one(pipelineRuns, {
      fields: [notificationsLog.pipelineRunId],
      references: [pipelineRuns.id],
    }),
  }),
);

// Types
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type NewPipelineRun = typeof pipelineRuns.$inferInsert;

export type ScanResult = typeof scanResults.$inferSelect;
export type NewScanResult = typeof scanResults.$inferInsert;

export type PolicyRule = typeof policyRules.$inferSelect;
export type NewPolicyRule = typeof policyRules.$inferInsert;

export type PolicyViolation = typeof policyViolations.$inferSelect;
export type NewPolicyViolation = typeof policyViolations.$inferInsert;

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;

export type NotificationLog = typeof notificationsLog.$inferSelect;
export type NewNotificationLog = typeof notificationsLog.$inferInsert;
