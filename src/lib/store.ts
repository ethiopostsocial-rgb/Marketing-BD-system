import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Announcement, RoutineJob, Task, User, TaskStatus, Unit, InventoryItem, District, TabKey, ExternalRequest, ExternalRequestStatus, Proposal, ProposalStage, CustomRole, Role, BuiltInRole } from "./types";
import { ROLE_RANK, ROLE_LABELS, BUILT_IN_ROLES, getTaskAssignees, isTaskOwner } from "./types";
import { USERS, TASKS, ROUTINES, ANNOUNCEMENTS, INVENTORY, EXTERNAL_REQUESTS, PROPOSALS, CUSTOM_ROLES } from "./seed";

interface State {
  users: User[];
  tasks: Task[];
  routines: RoutineJob[];
  announcements: Announcement[];
  inventory: InventoryItem[];
  externalRequests: ExternalRequest[];
  proposals: Proposal[];
  customRoles: CustomRole[];
  currentUserId: string | null;

  login: (email: string, password: string) => User | null;
  logout: () => void;
  changePassword: (userId: string, newPassword: string) => void;

  createTask: (t: Omit<Task, "id" | "comments">) => void;
  updateTaskStatus: (id: string, status: TaskStatus, comment?: string) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "comments">>) => void;
  deleteTask: (id: string) => void;
  approveTask: (id: string) => void;
  rejectTask: (id: string, reason: string) => void;

  createRoutine: (r: Omit<RoutineJob, "id" | "checkIns">) => void;
  updateRoutine: (id: string, patch: Partial<Omit<RoutineJob, "id" | "checkIns">>) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutineCheckIn: (routineId: string, userId: string, dateISO: string) => void;

  createAnnouncement: (a: Omit<Announcement, "id" | "createdAt">) => void;
  updateAnnouncement: (id: string, patch: Partial<Omit<Announcement, "id" | "createdAt">>) => void;
  deleteAnnouncement: (id: string) => void;

  createUser: (u: Omit<User, "id" | "avatarColor"> & { avatarColor?: string }) => void;
  updateUser: (id: string, patch: Partial<Omit<User, "id">>) => void;
  deleteUser: (id: string) => void;

  createInventoryItem: (i: Omit<InventoryItem, "id" | "createdAt" | "createdBy" | "distributions">) => void;
  updateInventoryItem: (id: string, patch: Partial<Omit<InventoryItem, "id" | "distributions">>) => void;
  deleteInventoryItem: (id: string) => void;
  addDistribution: (itemId: string, dist: { district: District; quantity: number; date: string; recipient?: string; note?: string }) => { ok: boolean; error?: string };
  removeDistribution: (itemId: string, distId: string) => void;

  createExternalRequest: (r: Omit<ExternalRequest, "id" | "requestedDate" | "requestedBy" | "status">) => void;
  updateExternalRequest: (id: string, patch: Partial<Omit<ExternalRequest, "id">>) => void;
  setExternalRequestStatus: (id: string, status: ExternalRequestStatus, note?: string) => void;
  deleteExternalRequest: (id: string) => void;

  createProposal: (p: Omit<Proposal, "id" | "createdAt" | "createdBy">) => void;
  updateProposal: (id: string, patch: Partial<Omit<Proposal, "id" | "createdAt" | "createdBy">>) => void;
  setProposalStage: (id: string, stage: ProposalStage) => void;
  deleteProposal: (id: string) => void;

  createCustomRole: (r: Omit<CustomRole, "id" | "createdAt" | "createdBy">) => void;
  updateCustomRole: (id: string, patch: Partial<Omit<CustomRole, "id" | "createdAt" | "createdBy">>) => void;
  deleteCustomRole: (id: string) => void;
}

const AVATAR_COLORS = ["#4338ca", "#0ea5e9", "#16a34a", "#f59e0b", "#db2777", "#7c3aed", "#0891b2", "#9333ea", "#ea580c", "#0d9488"];

const uid = () => Math.random().toString(36).slice(2, 10);

/** Normalise multi-assignee fields so `assignedTo` always equals `assignees[0]`. */
function normaliseTaskAssignees<T extends { assignedTo: string; assignees?: string[] }>(t: T): T {
  if (!t.assignees || t.assignees.length === 0) return t;
  // De-duplicate while preserving order
  const unique = Array.from(new Set(t.assignees));
  return { ...t, assignees: unique, assignedTo: unique[0] };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      users: USERS,
      tasks: TASKS,
      routines: ROUTINES,
      announcements: ANNOUNCEMENTS,
      inventory: INVENTORY,
      externalRequests: EXTERNAL_REQUESTS,
      proposals: PROPOSALS,
      customRoles: CUSTOM_ROLES,
      currentUserId: null,

      login: (email, password) => {
        const u = get().users.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!u) return null;
        if (u.password !== password) return null;
        set({ currentUserId: u.id });
        return u;
      },
      logout: () => set({ currentUserId: null }),
      changePassword: (userId, newPassword) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, password: newPassword, mustChangePassword: false } : u,
          ),
        })),

      createTask: (t) =>
        set((s) => ({ tasks: [{ ...normaliseTaskAssignees(t), id: uid(), comments: [] }, ...s.tasks] })),

      updateTaskStatus: (id, status, comment) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  comments: comment
                    ? [...t.comments, { id: uid(), userId: s.currentUserId ?? "", text: comment, at: new Date().toISOString() }]
                    : t.comments,
                }
              : t,
          ),
        })),

      approveTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "done" as TaskStatus, rejectionReason: null } : t)) })),

      rejectTask: (id, reason) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "in_progress" as TaskStatus,
                  rejectionReason: reason,
                  comments: [...t.comments, { id: uid(), userId: s.currentUserId ?? "", text: `Rejected: ${reason}`, at: new Date().toISOString() }],
                }
              : t,
          ),
        })),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch } as Task;
            return normaliseTaskAssignees(next);
          }),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      createRoutine: (r) => set((s) => ({ routines: [{ ...r, id: uid(), checkIns: {} }, ...s.routines] })),

      updateRoutine: (id, patch) =>
        set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      toggleRoutineCheckIn: (routineId, userId, dateISO) =>
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== routineId) return r;
            const current = r.checkIns[userId] ?? [];
            const exists = current.includes(dateISO);
            return {
              ...r,
              checkIns: { ...r.checkIns, [userId]: exists ? current.filter((d) => d !== dateISO) : [...current, dateISO] },
            };
          }),
        })),

      createAnnouncement: (a) =>
        set((s) => ({ announcements: [{ ...a, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }, ...s.announcements] })),

      updateAnnouncement: (id, patch) =>
        set((s) => ({ announcements: s.announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      deleteAnnouncement: (id) =>
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),

      createUser: (u) =>
        set((s) => ({
          users: [
            ...s.users,
            { ...u, id: uid(), avatarColor: u.avatarColor ?? AVATAR_COLORS[s.users.length % AVATAR_COLORS.length] },
          ],
        })),

      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      deleteUser: (id) =>
        set((s) => {
          const removed = s.users.find((u) => u.id === id);
          const newManagerId = removed?.managerId ?? null;
          return {
            users: s.users
              .filter((u) => u.id !== id)
              .map((u) => (u.managerId === id ? { ...u, managerId: newManagerId } : u)),
          };
        }),

      createInventoryItem: (i) =>
        set((s) => ({
          inventory: [
            {
              ...i,
              id: uid(),
              createdAt: new Date().toISOString().slice(0, 10),
              createdBy: s.currentUserId ?? "",
              distributions: [],
            },
            ...s.inventory,
          ],
        })),

      updateInventoryItem: (id, patch) =>
        set((s) => ({
          inventory: s.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      deleteInventoryItem: (id) =>
        set((s) => ({ inventory: s.inventory.filter((it) => it.id !== id) })),

      addDistribution: (itemId, dist) => {
        const state = get();
        const item = state.inventory.find((i) => i.id === itemId);
        if (!item) return { ok: false, error: "Item not found" };
        const distributed = item.distributions.reduce((a, d) => a + d.quantity, 0);
        const remaining = item.totalQuantity - distributed;
        if (dist.quantity <= 0) return { ok: false, error: "Quantity must be greater than 0" };
        if (dist.quantity > remaining) return { ok: false, error: `Only ${remaining} ${item.unit} available` };
        set((s) => ({
          inventory: s.inventory.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  distributions: [
                    ...it.distributions,
                    { id: uid(), byUserId: s.currentUserId ?? "", ...dist },
                  ],
                }
              : it,
          ),
        }));
        return { ok: true };
      },

      removeDistribution: (itemId, distId) =>
        set((s) => ({
          inventory: s.inventory.map((it) =>
            it.id === itemId
              ? { ...it, distributions: it.distributions.filter((d) => d.id !== distId) }
              : it,
          ),
        })),

      createExternalRequest: (r) =>
        set((s) => ({
          externalRequests: [
            { ...r, id: uid(), requestedBy: s.currentUserId ?? "", requestedDate: new Date().toISOString().slice(0, 10), status: "pending" },
            ...s.externalRequests,
          ],
        })),
      updateExternalRequest: (id, patch) =>
        set((s) => ({ externalRequests: s.externalRequests.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      setExternalRequestStatus: (id, status, note) =>
        set((s) => ({
          externalRequests: s.externalRequests.map((r) =>
            r.id === id ? { ...r, status, responseNote: note ?? r.responseNote } : r,
          ),
        })),
      deleteExternalRequest: (id) =>
        set((s) => ({ externalRequests: s.externalRequests.filter((r) => r.id !== id) })),

      createProposal: (p) =>
        set((s) => ({
          proposals: [
            { ...p, id: uid(), createdAt: new Date().toISOString().slice(0, 10), createdBy: s.currentUserId ?? "" },
            ...s.proposals,
          ],
        })),
      updateProposal: (id, patch) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setProposalStage: (id, stage) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, stage } : p)) })),
      deleteProposal: (id) =>
        set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) })),

      createCustomRole: (r) =>
        set((s) => ({
          customRoles: [
            { ...r, id: uid(), createdAt: new Date().toISOString().slice(0, 10), createdBy: s.currentUserId ?? "" },
            ...s.customRoles,
          ],
        })),
      updateCustomRole: (id, patch) =>
        set((s) => ({ customRoles: s.customRoles.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteCustomRole: (id) =>
        set((s) => ({ customRoles: s.customRoles.filter((r) => r.id !== id) })),
    }),

    {
      name: "ethiopost-mbd-store",
      version: 6,
      migrate: (persisted: unknown, _version: number) => {
        // Preserve any existing persisted data; only fill in missing keys with seed defaults.
        // This prevents wiping GitHub-synced data when the store version changes.
        const existing = (persisted ?? {}) as Partial<State>;
        return {
          users: existing.users?.length ? existing.users : USERS,
          tasks: existing.tasks?.length ? existing.tasks : TASKS,
          routines: existing.routines?.length ? existing.routines : ROUTINES,
          announcements: existing.announcements?.length ? existing.announcements : ANNOUNCEMENTS,
          inventory: existing.inventory?.length ? existing.inventory : INVENTORY,
          externalRequests: existing.externalRequests?.length ? existing.externalRequests : EXTERNAL_REQUESTS,
          proposals: existing.proposals?.length ? existing.proposals : PROPOSALS,
          customRoles: existing.customRoles?.length ? existing.customRoles : CUSTOM_ROLES,
          currentUserId: null,
        } as unknown as State;
      },
    },
  ),
);

// ---- Selectors / authorization helpers ----

export function useCurrentUser(): User | null {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
}

export function getSubordinateIds(userId: string, users: User[]): string[] {
  const direct = users.filter((u) => u.managerId === userId).map((u) => u.id);
  return direct.flatMap((id) => [id, ...getSubordinateIds(id, users)]);
}

export function getVisibleUserIds(user: User, users: User[]): string[] {
  if (user.role === "director") return users.map((u) => u.id);
  if (user.role === "marketing_manager" || user.role === "bd_manager") {
    return [user.id, ...getSubordinateIds(user.id, users)];
  }
  if (user.role === "supervisor") return [user.id, ...getSubordinateIds(user.id, users)];
  return [user.id];
}

/** Look up a role's label (built-in or custom). Falls back to the raw key. */
export function roleLabel(role: Role, customRoles: CustomRole[]): string {
  if (role in ROLE_LABELS) return ROLE_LABELS[role as BuiltInRole];
  const custom = customRoles.find((r) => r.key === role);
  return custom?.label ?? role;
}

/** Authority level for a role (built-in or custom). Custom roles default to their stored rank. */
export function roleRank(role: Role, customRoles: CustomRole[]): number {
  if (role in ROLE_RANK) return ROLE_RANK[role as BuiltInRole];
  const custom = customRoles.find((r) => r.key === role);
  return custom?.rank ?? 1;
}

export function canAssignTo(actor: User, target: User, users: User[]): boolean {
  if (actor.id === target.id) return true;
  // Use built-in rank for assignment privileges; custom roles default to rank 1 (cannot assign others).
  const actorRank = actor.role in ROLE_RANK ? ROLE_RANK[actor.role as BuiltInRole] : 1;
  if (actorRank < 4) return false; // only supervisor+
  if (actor.role === "director") return true;
  const subs = getSubordinateIds(actor.id, users);
  if (subs.includes(target.id)) return true;
  if (actor.role === "marketing_manager" || actor.role === "bd_manager") {
    return actorRank >= 5;
  }
  return false;
}

export function canApproveTask(actor: User, task: Task, users: User[]): boolean {
  // Assignees cannot approve their own task
  if (isTaskOwner(actor.id, task)) return false;
  const primary = users.find((u) => u.id === task.assignedTo);
  if (!primary) return false;
  // Approval routes to the primary assignee's direct line manager.
  if (primary.managerId && actor.id === primary.managerId) return true;
  if (actor.role === "director" && !primary.managerId) return true;
  return false;
}

export function unitOf(user: User): Unit {
  return user.unit;
}

/** Whether the current user can mutate the status of a task.
 *  Directors and managers (marketing_manager, bd_manager) can change
 *  any task status without waiting for sequential line-manager approval.
 */
export function canChangeTaskStatus(actor: User, task: Task): boolean {
  if (actor.role === "director" || actor.role === "marketing_manager" || actor.role === "bd_manager") return true;
  return isTaskOwner(actor.id, task);
}

export { getTaskAssignees, isTaskOwner, BUILT_IN_ROLES };

export const ALL_TABS: TabKey[] = [
  "dashboard", "commercial_dashboard", "tasks", "external_requests", "opportunities", "routines", "inventory", "announcements", "users", "roles", "profile",
];

export const TAB_LABELS: Record<TabKey, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  external_requests: "External Requests",
  opportunities: "Opportunities & Proposals",
  routines: "Routine Check-ups",
  inventory: "Marketing Inventory",
  announcements: "Announcements",
  commercial_dashboard: "Commercial Dashboard",
  users: "User Management",
  roles: "Roles",
  profile: "Profile Settings",
};

/** Default tab access by role when a user has no explicit visibleTabs override. */
export function defaultTabsForRole(user: User, customRoles: CustomRole[] = []): TabKey[] {
  // Custom roles use their stored defaultTabs.
  if (!(user.role in ROLE_LABELS)) {
    const custom = customRoles.find((r) => r.key === user.role);
    if (custom) return custom.defaultTabs;
  }

  const base: TabKey[] = ["dashboard", "commercial_dashboard", "tasks", "external_requests", "routines", "announcements", "profile"];
  // Inventory: only Director, Marketing Manager, and Marketing Senior Officer
  const inventoryAllowed =
    user.role === "director" ||
    user.role === "marketing_manager" ||
    (user.role === "senior_officer" && (user.unit === "marketing" || user.unit === "both"));
  if (inventoryAllowed) base.push("inventory");
  // Opportunities & Proposals: M&C Director + all BD unit members
  const opportunitiesAllowed =
    user.role === "director" || user.unit === "bd" || user.unit === "both";
  if (opportunitiesAllowed) base.push("opportunities");
  // User Management: director + managers
  if (user.role === "director" || user.role === "marketing_manager" || user.role === "bd_manager") {
    base.push("users");
  }
  // Roles section: director only
  if (user.role === "director") base.push("roles");
  return base;
}

export function canAccessTab(user: User, tab: TabKey, customRoles: CustomRole[] = []): boolean {
  const tabs = user.visibleTabs ?? defaultTabsForRole(user, customRoles);
  return tabs.includes(tab);
}
