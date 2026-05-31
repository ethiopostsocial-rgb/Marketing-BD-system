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
  const unique = Array.from(new Set(t.assignees));
  return { ...t, assignees: unique, assignedTo: unique[0] };
}

/** Push state directly to GitHub — used for critical updates like password changes. */
async function forceSyncToGitHub(state: Omit<State, keyof ReturnType<typeof createActions>>) {
  try {
    const payload = {
      users: state.users,
      tasks: state.tasks,
      routines: state.routines,
      announcements: state.announcements,
      inventory: state.inventory,
      externalRequests: state.externalRequests,
      proposals: state.proposals,
      customRoles: state.customRoles,
    };
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: payload }),
    });
  } catch (e) {
    console.error("Force sync failed:", e);
  }
}

function createActions(set: any, get: any) {
  return {
    login: (email: string, password: string) => {
      const u = get().users.find((x: User) => x.email.toLowerCase() === email.toLowerCase());
      if (!u) return null;
      if (u.password !== password) return null;
      set({ currentUserId: u.id });
      return u;
    },
    logout: () => set({ currentUserId: null }),

    changePassword: (userId: string, newPassword: string) => {
      // 1. Update local state immediately
      set((s: State) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, password: newPassword, mustChangePassword: false } : u,
        ),
      }));
      // 2. Force push to GitHub immediately — don't wait for SyncProvider debounce
      const updatedState = get();
      forceSyncToGitHub(updatedState);
    },
  };
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

      ...createActions(set, get),

      createTask: (t) =>
        set((s: State) => ({ tasks: [{ ...normaliseTaskAssignees(t), id: uid(), comments: [] }, ...s.tasks] })),

      updateTaskStatus: (id, status, comment) =>
        set((s: State) => ({
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
        set((s: State) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "done" as TaskStatus, rejectionReason: null } : t)) })),

      rejectTask: (id, reason) =>
        set((s: State) => ({
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
        set((s: State) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch } as Task;
            return normaliseTaskAssignees(next);
          }),
        })),

      deleteTask: (id) => set((s: State) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      createRoutine: (r) => set((s: State) => ({ routines: [{ ...r, id: uid(), checkIns: {} }, ...s.routines] })),

      updateRoutine: (id, patch) =>
        set((s: State) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      deleteRoutine: (id) => set((s: State) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      toggleRoutineCheckIn: (routineId, userId, dateISO) =>
        set((s: State) => ({
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
        set((s: State) => ({ announcements: [{ ...a, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }, ...s.announcements] })),

      updateAnnouncement: (id, patch) =>
        set((s: State) => ({ announcements: s.announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      deleteAnnouncement: (id) =>
        set((s: State) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),

      createUser: (u) =>
        set((s: State) => ({
          users: [
            ...s.users,
            { ...u, id: uid(), avatarColor: u.avatarColor ?? AVATAR_COLORS[s.users.length % AVATAR_COLORS.length] },
          ],
        })),

      updateUser: (id, patch) =>
        set((s: State) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      deleteUser: (id) =>
        set((s: State) => {
          const removed = s.users.find((u) => u.id === id);
          const newManagerId = removed?.managerId ?? null;
          return {
            users: s.users
              .filter((u) => u.id !== id)
              .map((u) => (u.managerId === id ? { ...u, managerId: newManagerId } : u)),
          };
        }),

      createInventoryItem: (i) =>
        set((s: State) => ({
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
        set((s: State) => ({
          inventory: s.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      deleteInventoryItem: (id) =>
        set((s: State) => ({ inventory: s.inventory.filter((it) => it.id !== id) })),

      addDistribution: (itemId, dist) => {
        const state = get();
        const item = state.inventory.find((i: InventoryItem) => i.id === itemId);
        if (!item) return { ok: false, error: "Item not found" };
        const distributed = item.distributions.reduce((a: number, d: any) => a + d.quantity, 0);
        const remaining = item.totalQuantity - distributed;
        if (dist.quantity <= 0) return { ok: false, error: "Quantity must be greater than 0" };
        if (dist.quantity > remaining) return { ok: false, error: `Only ${remaining} ${item.unit} available` };
        set((s: State) => ({
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
        set((s: State) => ({
          inventory: s.inventory.map((it) =>
            it.id === itemId
              ? { ...it, distributions: it.distributions.filter((d) => d.id !== distId) }
              : it,
          ),
        })),

      createExternalRequest: (r) =>
        set((s: State) => ({
          externalRequests: [
            { ...r, id: uid(), requestedBy: s.currentUserId ?? "", requestedDate: new Date().toISOString().slice(0, 10), status: "pending" },
            ...s.externalRequests,
          ],
        })),
      updateExternalRequest: (id, patch) =>
        set((s: State) => ({ externalRequests: s.externalRequests.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      setExternalRequestStatus: (id, status, note) =>
        set((s: State) => ({
          externalRequests: s.externalRequests.map((r) =>
            r.id === id ? { ...r, status, responseNote: note ?? r.responseNote } : r,
          ),
        })),
      deleteExternalRequest: (id) =>
        set((s: State) => ({ externalRequests: s.externalRequests.filter((r) => r.id !== id) })),

      createProposal: (p) =>
        set((s: State) => ({
          proposals: [
            { ...p, id: uid(), createdAt: new Date().toISOString().slice(0, 10), createdBy: s.currentUserId ?? "" },
            ...s.proposals,
          ],
        })),
      updateProposal: (id, patch) =>
        set((s: State) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setProposalStage: (id, stage) =>
        set((s: State) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, stage } : p)) })),
      deleteProposal: (id) =>
        set((s: State) => ({ proposals: s.proposals.filter((p) => p.id !== id) })),

      createCustomRole: (r) =>
        set((s: State) => ({
          customRoles: [
            { ...r, id: uid(), createdAt: new Date().toISOString().slice(0, 10), createdBy: s.currentUserId ?? "" },
            ...s.customRoles,
          ],
        })),
      updateCustomRole: (id, patch) =>
        set((s: State) => ({ customRoles: s.customRoles.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteCustomRole: (id) =>
        set((s: State) => ({ customRoles: s.customRoles.filter((r) => r.id !== id) })),
    }),

    {
      name: "ethiopost-mbd-store",
      version: 7,
      migrate: (_persisted: unknown, _version: number) => {
        return {
          users: USERS,
          tasks: TASKS,
          routines: ROUTINES,
          announcements: ANNOUNCEMENTS,
          inventory: INVENTORY,
          externalRequests: EXTERNAL_REQUESTS,
          proposals: PROPOSALS,
          customRoles: CUSTOM_ROLES,
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
  const actorRank = actor.role in ROLE_RANK ? ROLE_RANK[actor.role as BuiltInRole] : 1;
  if (actorRank < 4) return false;
  if (actor.role === "director") return true;
  const subs = getSubordinateIds(actor.id, users);
  if (subs.includes(target.id)) return true;
  if (actor.role === "marketing_manager" || actor.role === "bd_manager") {
    return actorRank >= 5;
  }
  return false;
}

export function canApproveTask(actor: User, task: Task, users: User[]): boolean {
  if (isTaskOwner(actor.id, task)) return false;
  const primary = users.find((u) => u.id === task.assignedTo);
  if (!primary) return false;
  if (primary.managerId && actor.id === primary.managerId) return true;
  if (actor.role === "director" && !primary.managerId) return true;
  return false;
}

export function unitOf(user: User): Unit {
  return user.unit;
}

export function canChangeTaskStatus(actor: User, task: Task): boolean {
  return isTaskOwner(actor.id, task);
}

export { getTaskAssignees, isTaskOwner, BUILT_IN_ROLES };

export const ALL_TABS: TabKey[] = [
  "dashboard", "tasks", "external_requests", "opportunities", "routines", "inventory", "announcements", "users", "roles", "profile",
];

export const TAB_LABELS: Record<TabKey, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  external_requests: "External Requests",
  opportunities: "Opportunities & Proposals",
  routines: "Routine Check-ups",
  inventory: "Marketing Inventory",
  announcements: "Announcements",
  users: "User Management",
  roles: "Roles",
  profile: "Profile Settings",
};

export function defaultTabsForRole(user: User, customRoles: CustomRole[] = []): TabKey[] {
  if (!(user.role in ROLE_LABELS)) {
    const custom = customRoles.find((r) => r.key === user.role);
    if (custom) return custom.defaultTabs;
  }

  const base: TabKey[] = ["dashboard", "tasks", "external_requests", "routines", "announcements", "profile"];
  const inventoryAllowed =
    user.role === "director" ||
    user.role === "marketing_manager" ||
    (user.role === "senior_officer" && (user.unit === "marketing" || user.unit === "both"));
  if (inventoryAllowed) base.push("inventory");
  const opportunitiesAllowed =
    user.role === "director" || user.unit === "bd" || user.unit === "both";
  if (opportunitiesAllowed) base.push("opportunities");
  if (user.role === "director" || user.role === "marketing_manager" || user.role === "bd_manager") {
    base.push("commercial_dashboard");
  }
  if (user.role === "director" || user.role === "marketing_manager" || user.role === "bd_manager") {
    base.push("users");
  }
  if (user.role === "director") base.push("roles");
  return base;
}

export function canAccessTab(user: User, tab: TabKey, customRoles: CustomRole[] = []): boolean {
  const tabs = user.visibleTabs ?? defaultTabsForRole(user, customRoles);
  return tabs.includes(tab);
}
