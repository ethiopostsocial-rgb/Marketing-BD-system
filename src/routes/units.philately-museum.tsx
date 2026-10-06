import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, BarChart3, FileText, CheckSquare, Handshake, TrendingUp, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/units/philately-museum")({
  component: PhilatelyMuseumPage,
});

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed";
  assignee: string;
  dueDate: string;
  createdAt: string;
}

interface Deal {
  id: string;
  partnerName: string;
  description: string;
  value: number;
  stage: "prospecting" | "proposal" | "negotiation" | "won" | "lost";
  dueDate: string;
  owner: string;
  createdAt: string;
}

interface UnitReport {
  id: string;
  title: string;
  period: string;
  content: string;
  metrics: Record<string, number>;
  createdAt: string;
}

function PhilatelyMuseumPage() {
  const user = useCurrentUser();
  if (!user) return null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reports, setReports] = useState<UnitReport[]>([]);

  // Task form
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // Deal form
  const [dealOpen, setDealOpen] = useState(false);
  const [dealPartner, setDealPartner] = useState("");
  const [dealDesc, setDealDesc] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealStage, setDealStage] = useState<"prospecting" | "proposal" | "negotiation" | "won" | "lost">("prospecting");
  const [dealDue, setDealDue] = useState("");

  // Report form
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportPeriod, setReportPeriod] = useState("");
  const [reportContent, setReportContent] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) { toast.error("Title required"); return; }
    const newTask: Task = {
      id: Math.random().toString(36).slice(2),
      title: taskTitle,
      description: taskDesc,
      status: "todo",
      assignee: user.id,
      dueDate: taskDue,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTasks([...tasks, newTask]);
    setTaskTitle("");
    setTaskDesc("");
    setTaskDue("");
    setTaskOpen(false);
    toast.success("Task created");
  };

  const addDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealPartner.trim()) { toast.error("Partner name required"); return; }
    const newDeal: Deal = {
      id: Math.random().toString(36).slice(2),
      partnerName: dealPartner,
      description: dealDesc,
      value: Number(dealValue) || 0,
      stage: dealStage,
      dueDate: dealDue,
      owner: user.id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDeals([...deals, newDeal]);
    setDealPartner("");
    setDealDesc("");
    setDealValue("");
    setDealStage("prospecting");
    setDealDue("");
    setDealOpen(false);
    toast.success("Deal added");
  };

  const addReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) { toast.error("Title required"); return; }
    const newReport: UnitReport = {
      id: Math.random().toString(36).slice(2),
      title: reportTitle,
      period: reportPeriod,
      content: reportContent,
      metrics: {},
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setReports([...reports, newReport]);
    setReportTitle("");
    setReportPeriod("");
    setReportContent("");
    setReportOpen(false);
    toast.success("Report created");
  };

  const updateTaskStatus = (id: string, status: Task["status"]) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const updateDealStage = (id: string, stage: Deal["stage"]) => {
    setDeals(deals.map((d) => (d.id === id ? { ...d, stage } : d)));
  };

  const stageColors: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-700",
    proposal: "bg-blue-100 text-blue-700",
    negotiation: "bg-yellow-100 text-yellow-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
    todo: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard"><BarChart3 className="mr-1.5 h-3.5 w-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="report"><FileText className="mr-1.5 h-3.5 w-3.5" />Report</TabsTrigger>
          <TabsTrigger value="tasks"><CheckSquare className="mr-1.5 h-3.5 w-3.5" />Tasks</TabsTrigger>
          <TabsTrigger value="deals"><Handshake className="mr-1.5 h-3.5 w-3.5" />Deals</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Partnership Unit Overview</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Active Deals</div>
                <div className="mt-2 text-2xl font-bold">{deals.filter((d) => ["prospecting", "proposal", "negotiation"].includes(d.stage)).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Won Deals</div>
                <div className="mt-2 text-2xl font-bold text-green-600">{deals.filter((d) => d.stage === "won").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Pending Tasks</div>
                <div className="mt-2 text-2xl font-bold">{tasks.filter((t) => t.status !== "completed").length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REPORT TAB */}
        <TabsContent value="report" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unit performance and insights</p>
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />New Report</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create report</DialogTitle>
                </DialogHeader>
                <form onSubmit={addReport} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Period</Label>
                    <Input value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} placeholder="e.g. Q4 2024" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Content</Label>
                    <Textarea value={reportContent} onChange={(e) => setReportContent(e.target.value)} rows={4} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {reports.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No reports yet.</CardContent></Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{report.title}</h3>
                      {report.period && <p className="text-xs text-muted-foreground">Period: {report.period}</p>}
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{report.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setReports(reports.filter((r) => r.id !== report.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Team tasks and project management</p>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />New Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create task</DialogTitle>
                </DialogHeader>
                <form onSubmit={addTask} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {tasks.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No tasks yet.</CardContent></Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={`text-[10px] ${stageColors[task.status]}`}>{task.status.replace(/_/g, " ")}</Badge>
                      </div>
                      {task.description && <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>}
                      {task.dueDate && <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{task.dueDate}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => updateTaskStatus(task.id, "in_progress")}>Start</Button>
                      <Button size="sm" variant="outline" className="text-xs text-green-600" onClick={() => updateTaskStatus(task.id, "completed")}>Done</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* DEALS TAB */}
        <TabsContent value="deals" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Opportunity and deal management</p>
            <Dialog open={dealOpen} onOpenChange={setDealOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />New Deal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create deal</DialogTitle>
                </DialogHeader>
                <form onSubmit={addDeal} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Partner Name *</Label>
                    <Input value={dealPartner} onChange={(e) => setDealPartner(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={dealDesc} onChange={(e) => setDealDesc(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deal Value (ETB)</Label>
                    <Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stage</Label>
                    <select value={dealStage} onChange={(e) => setDealStage(e.target.value as any)} className="w-full rounded border px-3 py-2 text-sm">
                      <option value="prospecting">Prospecting</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expected Close Date</Label>
                    <Input type="date" value={dealDue} onChange={(e) => setDealDue(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setDealOpen(false)}>Cancel</Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {deals.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No deals yet.</CardContent></Card>
            ) : (
              deals.map((deal) => (
                <Card key={deal.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{deal.partnerName}</h3>
                        <Badge className={`text-[10px] ${stageColors[deal.stage]}`}>{deal.stage}</Badge>
                      </div>
                      {deal.description && <p className="mt-1 text-xs text-muted-foreground">{deal.description}</p>}
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        {deal.value > 0 && <span>Value: ETB {deal.value.toLocaleString()}</span>}
                        {deal.dueDate && <span>Close: {deal.dueDate}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => updateDealStage(deal.id, deal.stage === "won" ? "negotiation" : deal.stage === "negotiation" ? "proposal" : "prospecting")}>← Back</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => updateDealStage(deal.id, deal.stage === "prospecting" ? "proposal" : deal.stage === "proposal" ? "negotiation" : deal.stage === "negotiation" ? "won" : deal.stage)}>Advance →</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
