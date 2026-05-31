// Built-in roles. Custom roles created at runtime are also stored as strings.
export type BuiltInRole =
  | "director"
  | "marketing_manager"
  | "bd_manager"
  | "supervisor"
  | "senior_officer"
  | "junior_officer";

// Role accepts built-in keys plus any custom role key created by the director.
// The `string & {}` keeps autocomplete for built-ins while accepting any string.
export type Role = BuiltInRole | (string & {});

export const BUILT_IN_ROLES: BuiltInRole[] = [
  "director",
  "marketing_manager",
  "bd_manager",
  "supervisor",
  "senior_officer",
  "junior_officer",
];

export type Unit = "marketing" | "bd" | "both";

export type TaskStatus = "todo" | "in_progress" | "awaiting_approval" | "done";

export type TabKey =
  | "dashboard"
  | "tasks"
  | "external_requests"
  | "opportunities"
  | "routines"
  | "inventory"
  | "announcements"
  | "commercial_dashboard"
  | "users"
  | "roles"
  | "profile";

export type ProposalStage =
  | "opportunity"
  | "drafting"
  | "submitted"
  | "negotiation"
  | "won"
  | "lost";

export interface Proposal {
  id: string;
  title: string;
  client: string;
  description: string;
  stage: ProposalStage;
  value: number;
  currency: string;
  ownerId: string;
  createdBy: string;
  createdAt: string;
  expectedCloseDate: string;
  contactPerson?: string;
  notes?: string;
}

export const PROPOSAL_STAGES: ProposalStage[] = [
  "opportunity", "drafting", "submitted", "negotiation", "won", "lost",
];

export const PROPOSAL_STAGE_LABELS: Record<ProposalStage, string> = {
  opportunity: "Opportunity",
  drafting: "Drafting",
  submitted: "Submitted",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  unit: Unit;
  managerId: string | null;
  avatarColor: string;
  title: string;
  password: string;
  mustChangePassword: boolean;
  /** Optional override of accessible tabs. If undefined, role defaults apply. */
  visibleTabs?: TabKey[];
}

export interface CustomRole {
  id: string;
  /** Stable key stored on User.role. Lowercase, snake_case recommended. */
  key: string;
  /** Human label shown across the app. */
  label: string;
  /** Authority level. Higher rank = more permissions. Defaults to 1. */
  rank: number;
  /** Default tabs visible to users with this role. */
  defaultTabs: TabKey[];
  createdBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  attachment?: string | null;
  createdBy: string;
  /** Primary assignee (kept for backward compatibility). When `assignees` is set, this equals assignees[0]. */
  assignedTo: string;
  /** All co-assignees. When present and length > 1, the task is shown as one card with multiple owners. */
  assignees?: string[];
  crossFunctional?: boolean;
  comments: { id: string; userId: string; text: string; at: string }[];
  rejectionReason?: string | null;
}

export interface RoutineJob {
  id: string;
  title: string;
  description: string;
  cadence: "daily" | "weekly";
  unit: Unit;
  assignedRoleScope: Role[];
  createdBy: string;
  // checkIns: userId -> dateISO[]  (dates completed)
  checkIns: Record<string, string[]>;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  audience: Unit;
  urgency: "low" | "normal" | "high";
  createdAt: string;
}

export const ROLE_LABELS: Record<BuiltInRole, string> = {
  director: "M&C Director",
  marketing_manager: "Marketing Manager",
  bd_manager: "Business Development Manager",
  supervisor: "Supervisor",
  senior_officer: "Senior Officer",
  junior_officer: "Junior Officer",
};

export const ROLE_RANK: Record<BuiltInRole, number> = {
  director: 6,
  marketing_manager: 5,
  bd_manager: 5,
  supervisor: 4,
  senior_officer: 2,
  junior_officer: 1,
};

export type District =
  | "north_1"
  | "north_2"
  | "east"
  | "west"
  | "central"
  | "addis_ababa"
  | "gpo"
  | "south";

export const DISTRICTS: District[] = [
  "north_1",
  "north_2",
  "east",
  "west",
  "central",
  "addis_ababa",
  "gpo",
  "south",
];

export const DISTRICT_LABELS: Record<District, string> = {
  north_1: "North 1",
  north_2: "North 2",
  east: "East",
  west: "West",
  central: "Central",
  addis_ababa: "Addis Ababa",
  gpo: "GPO",
  south: "South",
};

export interface InventoryDistribution {
  id: string;
  district: District;
  quantity: number;
  date: string;
  recipient?: string;
  note?: string;
  byUserId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  totalQuantity: number;
  createdAt: string;
  createdBy: string;
  description?: string;
  distributions: InventoryDistribution[];
}

export type ExternalDepartment =
  | "supply_facility"
  | "commercial"
  | "ceo"
  | "operation"
  | "finance"
  | "hr"
  | "legal"
  | "audit"
  | "customer_service";

export const EXTERNAL_DEPARTMENTS: ExternalDepartment[] = [
  "supply_facility", "commercial", "ceo", "operation", "finance", "hr", "legal", "audit", "customer_service",
];

export const EXTERNAL_DEPARTMENT_LABELS: Record<ExternalDepartment, string> = {
  supply_facility: "Supply & Facility",
  commercial: "Commercial",
  ceo: "CEO Office",
  operation: "Operation",
  finance: "Finance",
  hr: "Human Resources",
  legal: "Legal",
  audit: "Audit",
  customer_service: "Customer Service",
};

export type ExternalRequestStatus = "pending" | "acknowledged" | "fulfilled" | "declined";

export interface ExternalRequest {
  id: string;
  title: string;
  description: string;
  department: ExternalDepartment;
  contactPerson?: string;
  requestedBy: string;
  requestedDate: string;
  dueDate: string;
  status: ExternalRequestStatus;
  responseNote?: string;
}

/** All assignees on a task (handles legacy single-assignee tasks). */
export function getTaskAssignees(t: Task): string[] {
  return t.assignees && t.assignees.length > 0 ? t.assignees : [t.assignedTo];
}

/** Whether the given user is one of the task's assignees. */
export function isTaskOwner(userId: string, t: Task): boolean {
  return getTaskAssignees(t).includes(userId);
}
