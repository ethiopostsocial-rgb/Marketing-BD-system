import type { User, Task, RoutineJob, Announcement, InventoryItem, ExternalRequest, Proposal, CustomRole } from "./types";

export const CUSTOM_ROLES: CustomRole[] = [];

export const USERS: User[] = [
  { id: "u1", name: "Belayneh Mamush", email: "belayneh.mamush@ethio.post", role: "director", unit: "both", managerId: null, avatarColor: "#4338ca", title: "M&C Director", password: "ethiopost", mustChangePassword: true },
  { id: "u2", name: "Kirubel Misrak", email: "kirubel.misrak@ethio.post", role: "marketing_manager", unit: "marketing", managerId: "u1", avatarColor: "#0ea5e9", title: "Marketing Manager", password: "ethiopost", mustChangePassword: true },
  { id: "u3", name: "Feven Bekele", email: "feven.bekele@ethio.post", role: "bd_manager", unit: "bd", managerId: "u1", avatarColor: "#16a34a", title: "Business Development Manager", password: "ethiopost", mustChangePassword: true },
  { id: "u4", name: "Didimos Tadesse", email: "didimos.tadesse@ethio.post", role: "supervisor", unit: "marketing", managerId: "u2", avatarColor: "#f59e0b", title: "Marketing Supervisor", password: "ethiopost", mustChangePassword: true },
  { id: "u5", name: "Lily Tesfaye", email: "bd.supervisor@ethiopost.et", role: "supervisor", unit: "bd", managerId: "u3", avatarColor: "#db2777", title: "BD Supervisor", password: "ethiopost", mustChangePassword: true },
  { id: "u6", name: "Samuel Alemu", email: "mkt.senior@ethiopost.et", role: "senior_officer", unit: "marketing", managerId: "u4", avatarColor: "#7c3aed", title: "Senior Marketing Officer", password: "ethiopost", mustChangePassword: true },
  { id: "u7", name: "Mahlet Worku", email: "mkt.junior@ethiopost.et", role: "junior_officer", unit: "marketing", managerId: "u4", avatarColor: "#0891b2", title: "Junior Marketing Officer", password: "ethiopost", mustChangePassword: true },
  { id: "u8", name: "Daniel Haile", email: "bd.senior@ethiopost.et", role: "senior_officer", unit: "bd", managerId: "u5", avatarColor: "#9333ea", title: "Senior BD Officer", password: "ethiopost", mustChangePassword: true },
  { id: "u9", name: "Rahel Mekonnen", email: "bd.junior@ethiopost.et", role: "junior_officer", unit: "bd", managerId: "u5", avatarColor: "#ea580c", title: "Junior BD Officer", password: "ethiopost", mustChangePassword: true },
];

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const TASKS: Task[] = [
  { id: "t1", title: "Q3 Postal Service Campaign Brief", description: "Draft campaign brief for nationwide postal service awareness.", startDate: addDays(-5), dueDate: addDays(2), status: "in_progress", createdBy: "u2", assignedTo: "u6", comments: [] },
  { id: "t2", title: "Corporate Client Outreach — Banking Sector", description: "Identify 15 banking sector prospects for logistics partnership.", startDate: addDays(-7), dueDate: addDays(-1), status: "awaiting_approval", createdBy: "u3", assignedTo: "u8", comments: [] },
  { id: "t3", title: "Social Media Calendar — November", description: "Build content calendar for FB/X/IG across the month.", startDate: addDays(-3), dueDate: addDays(5), status: "todo", createdBy: "u4", assignedTo: "u7", comments: [] },
  { id: "t4", title: "Cross-Unit: E-commerce Partner Pitch", description: "Joint pitch deck combining marketing positioning + BD commercials.", startDate: addDays(-4), dueDate: addDays(7), status: "in_progress", createdBy: "u1", assignedTo: "u6", crossFunctional: true, comments: [] },
  { id: "t5", title: "Branch Visibility Audit — Addis Region", description: "Photograph and report on branding compliance at 8 branches.", startDate: addDays(-10), dueDate: addDays(-2), status: "awaiting_approval", createdBy: "u4", assignedTo: "u7", comments: [] },
  { id: "t6", title: "Lead Qualification — SME Segment", description: "Qualify 30 inbound SME leads and score them.", startDate: addDays(-2), dueDate: addDays(4), status: "in_progress", createdBy: "u5", assignedTo: "u9", comments: [] },
  { id: "t7", title: "Press Release — New EMS Service", description: "Draft, review, and distribute press release.", startDate: addDays(-15), dueDate: addDays(-5), status: "done", createdBy: "u2", assignedTo: "u6", comments: [] },
  { id: "t8", title: "Competitor Pricing Analysis", description: "Compare DHL/Aramex courier pricing for 6 SKUs.", startDate: addDays(-6), dueDate: addDays(1), status: "todo", createdBy: "u3", assignedTo: "u8", comments: [] },
];

const checkInDates = (n: number, skip = 0) =>
  Array.from({ length: n }, (_, i) => iso(new Date(today.getTime() - (i + skip) * 86400000)));

export const ROUTINES: RoutineJob[] = [
  {
    id: "r1",
    title: "Daily lead pipeline review",
    description: "Check CRM pipeline and update lead statuses.",
    cadence: "daily",
    unit: "bd",
    assignedRoleScope: ["senior_officer", "junior_officer", "supervisor"],
    createdBy: "u3",
    checkIns: { u8: checkInDates(4), u9: checkInDates(2, 1), u5: checkInDates(5) },
  },
  {
    id: "r2",
    title: "Social media monitoring",
    description: "Monitor mentions, respond to comments and DMs.",
    cadence: "daily",
    unit: "marketing",
    assignedRoleScope: ["senior_officer", "junior_officer"],
    createdBy: "u2",
    checkIns: { u6: checkInDates(5), u7: checkInDates(3) },
  },
  {
    id: "r3",
    title: "Weekly performance sync",
    description: "Submit weekly KPI summary to supervisor.",
    cadence: "weekly",
    unit: "both",
    assignedRoleScope: ["supervisor", "senior_officer"],
    createdBy: "u1",
    checkIns: { u4: checkInDates(1), u5: checkInDates(1), u6: [], u8: checkInDates(1) },
  },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "Q4 Strategy Kickoff — All Hands", body: "All Marketing and Business Development staff are required to attend the Q4 kickoff on Friday, 9:00 AM at the HQ auditorium.", authorId: "u1", audience: "both", urgency: "high", createdAt: addDays(-1) },
  { id: "a2", title: "New CRM rollout next week", body: "BD team — please complete onboarding modules before Monday.", authorId: "u3", audience: "bd", urgency: "normal", createdAt: addDays(-3) },
  { id: "a3", title: "Brand asset refresh available", body: "Updated Ethiopost brand kit is live on the shared drive. Please use the new logo across all materials.", authorId: "u2", audience: "marketing", urgency: "normal", createdAt: addDays(-5) },
  { id: "a4", title: "Holiday schedule reminder", body: "Office closes early on Friday for the national holiday.", authorId: "u1", audience: "both", urgency: "low", createdAt: addDays(-8) },
];

export const INVENTORY: InventoryItem[] = [
  {
    id: "i1",
    name: "EMS Promotional Brochure (A4, Tri-fold)",
    category: "Print",
    unit: "pcs",
    totalQuantity: 10000,
    createdAt: addDays(-30),
    createdBy: "u2",
    description: "Tri-fold brochure highlighting EMS services and rates.",
    distributions: [
      { id: "d1", district: "addis_ababa", quantity: 2000, date: addDays(-20), recipient: "GPO branch lead", byUserId: "u2" },
      { id: "d2", district: "gpo", quantity: 1500, date: addDays(-18), recipient: "GPO counter", byUserId: "u4" },
      { id: "d3", district: "north_1", quantity: 800, date: addDays(-12), recipient: "Bahir Dar hub", byUserId: "u4" },
      { id: "d4", district: "south", quantity: 700, date: addDays(-9), recipient: "Hawassa hub", byUserId: "u6" },
    ],
  },
  {
    id: "i2",
    name: "Branded Roll-up Banner (2m)",
    category: "Display",
    unit: "pcs",
    totalQuantity: 80,
    createdAt: addDays(-45),
    createdBy: "u2",
    description: "Pull-up banners for branch and event activations.",
    distributions: [
      { id: "d5", district: "east", quantity: 6, date: addDays(-25), recipient: "Dire Dawa branch", byUserId: "u4" },
      { id: "d6", district: "west", quantity: 5, date: addDays(-22), recipient: "Nekemte branch", byUserId: "u4" },
      { id: "d7", district: "central", quantity: 8, date: addDays(-14), recipient: "Adama hub", byUserId: "u2" },
      { id: "d8", district: "addis_ababa", quantity: 10, date: addDays(-10), recipient: "HQ lobby", byUserId: "u2" },
    ],
  },
  {
    id: "i3",
    name: "Corporate Gift Pack",
    category: "Giveaway",
    unit: "box",
    totalQuantity: 200,
    createdAt: addDays(-15),
    createdBy: "u3",
    description: "Branded notebook + pen + USB for client meetings.",
    distributions: [
      { id: "d9", district: "addis_ababa", quantity: 40, date: addDays(-8), recipient: "BD team — banking outreach", byUserId: "u3" },
      { id: "d10", district: "north_2", quantity: 15, date: addDays(-5), recipient: "Mekelle BD officer", byUserId: "u5" },
    ],
  },
  {
    id: "i4",
    name: "Outdoor Vinyl Poster (A1)",
    category: "Print",
    unit: "pcs",
    totalQuantity: 500,
    createdAt: addDays(-20),
    createdBy: "u4",
    distributions: [
      { id: "d11", district: "south", quantity: 60, date: addDays(-7), recipient: "Arba Minch branch", byUserId: "u6" },
      { id: "d12", district: "gpo", quantity: 80, date: addDays(-6), recipient: "GPO facade", byUserId: "u4" },
    ],
  },
];



export const EXTERNAL_REQUESTS: ExternalRequest[] = [
  { id: "er1", title: "Booth setup for trade expo", description: "Need facility team to set up branded booth at Millennium Hall.", department: "supply_facility", contactPerson: "Facility Desk", requestedBy: "u2", requestedDate: addDays(-6), dueDate: addDays(3), status: "acknowledged" },
  { id: "er2", title: "Budget approval — Q4 campaign", description: "Approval for ETB 850,000 media spend.", department: "finance", requestedBy: "u1", requestedDate: addDays(-3), dueDate: addDays(2), status: "pending" },
  { id: "er3", title: "Legal review of partnership MoU", description: "Review draft MoU with logistics partner.", department: "legal", requestedBy: "u3", requestedDate: addDays(-10), dueDate: addDays(-2), status: "fulfilled", responseNote: "Approved with minor changes." },
];


export const PROPOSALS: Proposal[] = [
  { id: "p1", title: "Logistics partnership — CBE", client: "Commercial Bank of Ethiopia", description: "Nationwide document distribution agreement.", stage: "negotiation", value: 4500000, currency: "ETB", ownerId: "u8", createdBy: "u3", createdAt: addDays(-25), expectedCloseDate: addDays(14), contactPerson: "Ato Yonas (Procurement)" },
  { id: "p2", title: "EMS bulk contract — Awash Insurance", client: "Awash Insurance", description: "Monthly EMS pickup and delivery contract.", stage: "submitted", value: 1200000, currency: "ETB", ownerId: "u9", createdBy: "u5", createdAt: addDays(-12), expectedCloseDate: addDays(10), contactPerson: "W/ro Hanna" },
  { id: "p3", title: "E-commerce fulfillment — Qefira", client: "Qefira", description: "Last-mile fulfillment proposal.", stage: "drafting", value: 800000, currency: "ETB", ownerId: "u8", createdBy: "u3", createdAt: addDays(-5), expectedCloseDate: addDays(20) },
  { id: "p4", title: "Government printing tender", client: "Ministry of Education", description: "Bid for textbook distribution tender.", stage: "opportunity", value: 9000000, currency: "ETB", ownerId: "u5", createdBy: "u1", createdAt: addDays(-2), expectedCloseDate: addDays(45) },
];

export const DISTRIBUTION_PLACES: import("./types").DistributionPlace[] = [];
