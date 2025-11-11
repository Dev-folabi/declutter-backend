export const ROLES = [
  "super_admin",
  "admin",
  "support_agent",
  "account_officer",
  "logistics_agent",
];

export const ADMIN_ONLY_ROLES = ["super_admin", "admin"] as string[];
export const LOGISTIC_ONLY_ROLES = [
  "super_admin",
  "admin",
  "logistics_agent",
] as string[];

export const ACCOUNT_OFFICER_ONLY_ROLES = [
  "super_admin",
  "admin",
  "account_officer",
] as string[];
