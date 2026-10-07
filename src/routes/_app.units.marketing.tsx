import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, Trash2, Edit2, Calendar, DollarSign, Share2, Clock, TrendingUp, AlertCircle, Download } from "lucide-react";

export const Route = createFileRoute("/units/marketing")({
  component: MarketingUnitPage,
});

type Tab = "dashboard" | "report" | "tasks" | "deals" | "digital" | "campaigns" | "pricing";

// ============ DATA TYPES ============

interface MarketingTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  dueDate: string;
  createdBy: string;
  createdAt: string;
  budget?: number;
  campaign?: string;
}

interface MarketingDeal {
  id: string;
  dealName: string;
  client: string;
  value: number;
  currency: string;
  stage: "prospect" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  closingDate: string;
  owner: string;
  notes: string;
  createdAt: string;
}

interface DigitalMetrics {
  channel: "social_media" | "email" | "seo" | "paid_ads";
  name: string;
  reach: number;
  engagement: number;
  conversionRate: number;
  costPerClick: number;
  roi: number;
  lastUpdated: string;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed" | "paused";
  channels: string[];
  roi: number;
  notes: string;
}

// ============ DASHBOARD TAB ============

function DashboardTab() {
  const dashboardData = [
    { month: "Jan", campaigns: 4, revenue: 24000 },
    { month: "Feb", campaigns: 5, revenue: 32000 },
    { month: "Mar", campaigns: 6, revenue: 28000 },
    { month: "Apr", campaigns: 7, revenue: 39000 },
    { month: "May", campaigns: 8, revenue: 45000 },
    { month: "Jun", campaigns: 9, revenue: 52000 },
  ];

  const kpis = [
    { label: "Active Campaigns", value: "12", change: "+2.5%" },
    { label: "Completed Campaigns", value: "34", change: "+15%" },
    { label: "Total Budget Spent", value: "ETB 850,000", change: "+8.3%" },
    { label: "Avg ROI", value: "325%", change: "+12%" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-sm text-gray-600">{kpi.label}</p>
              <p className="text-xs text-green-600 mt-2">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="campaigns" stroke="#8884d8" name="Campaigns" />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (ETB)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ REPORT TAB ============

function ReportTab() {
  const [reportType, setReportType] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [period, setPeriod] = useState("2024-06");

  const generateReport = () => {
    const reportData = {
      type: reportType,
      period,
      timestamp: new Date().toISOString(),
      sections: {
        executive_summary: "Campaign overview and key achievements",
        performance_metrics: { campaigns_run: 12, total_reach: 450000, conversions: 2850, roi: 325 },
        budget_analysis: { allocated: 850000, spent: 825000, saved: 25000 },
        channel_performance: ["Social Media: 45%", "Email: 25%", "SEO: 18%", "Paid Ads: 12%"],
        recommendations: ["Increase social media budget by 20%", "Optimize email subject lines", "Scale successful campaigns"],
      },
    };
    alert(`Report generated: ${reportType} report for ${period}\n\nReport would be downloaded as PDF`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period</Label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
          </div>
          <Button onClick={generateReport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Generate Report (PDF)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Reach</p>
              <p className="text-2xl font-bold">450K</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl font-bold">2,850</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average ROI</p>
              <p className="text-2xl font-bold">325%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TASKS TAB ============

function TasksTab() {
  const [tasks, setTasks] = useState<MarketingTask[]>([
    {
      id: "t1",
      title: "Create Social Media Campaign",
      description: "Develop 30-day social media strategy",
      assignee: "Ahmed Hassan",
      status: "in_progress",
      priority: "high",
      dueDate: "2024-12-15",
      createdBy: "Belayneh",
      createdAt: "2024-11-01",
      budget: 50000,
      campaign: "Q4 Social Blitz",
    },
  ]);

  const [newTask, setNewTask] = useState({ title: "", assignee: "", priority: "medium" });

  const addTask = () => {
    if (newTask.title) {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          title: newTask.title,
          description: "",
          assignee: newTask.assignee,
          status: "todo",
          priority: newTask.priority as any,
          dueDate: new Date().toISOString().split("T")[0],
          createdBy: "Current User",
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewTask({ title: "", assignee: "", priority: "medium" });
    }
  };

  const statusColors = {
    todo: "bg-gray-100",
    in_progress: "bg-blue-100",
    review: "bg-yellow-100",
    completed: "bg-green-100",
  };

  const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign New Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Task Title</Label>
            <Input
              placeholder="e.g., Create Q4 campaign brief"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assign To</Label>
              <Select value={newTask.assignee} onValueChange={(v) => setNewTask({ ...newTask, assignee: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ahmed Hassan">Ahmed Hassan</SelectItem>
                  <SelectItem value="Fatima Ali">Fatima Ali</SelectItem>
                  <SelectItem value="Kebede Tekle">Kebede Tekle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addTask} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Marketing Tasks</h3>
        {tasks.map((task) => (
          <Card key={task.id} className={statusColors[task.status]}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex gap-2 items-center mb-2">
                    <h4 className="font-semibold">{task.title}</h4>
                    <Badge className={`${priorityColors[task.priority]} text-white`}>{task.priority}</Badge>
                    <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Assigned to: {task.assignee}</p>
                  <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                </div>
                <div className="flex gap-2">
                  <Edit2 className="h-4 w-4 cursor-pointer" />
                  <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ DEALS TAB ============

function DealsTab() {
  const [deals, setDeals] = useState<MarketingDeal[]>([
    {
      id: "d1",
      dealName: "Nike Ethiopia Campaign",
      client: "Nike",
      value: 500000,
      currency: "ETB",
      stage: "negotiation",
      probability: 75,
      closingDate: "2024-12-31",
      owner: "Ahmed Hassan",
      notes: "Multi-channel campaign",
      createdAt: "2024-10-01",
    },
    {
      id: "d2",
      dealName: "Local Bank Partnership",
      client: "Dashen Bank",
      value: 250000,
      currency: "ETB",
      stage: "proposal",
      probability: 60,
      closingDate: "2024-11-30",
      owner: "Fatima Ali",
      notes: "Social media + email campaign",
      createdAt: "2024-09-15",
    },
  ]);

  const stageColors = {
    prospect: "bg-gray-500",
    qualification: "bg-blue-500",
    proposal: "bg-indigo-500",
    negotiation: "bg-yellow-500",
    won: "bg-green-500",
    lost: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { stage: "proposal", label: "Proposals", count: 3 },
          { stage: "negotiation", label: "Negotiating", count: 2 },
          { stage: "won", label: "Won", count: 5 },
        ].map((item) => (
          <Card key={item.stage}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-3xl font-bold">{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Active Deals Pipeline</h3>
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold">{deal.dealName}</h4>
                  <p className="text-sm text-gray-600">Client: {deal.client}</p>
                </div>
                <Badge className={`${stageColors[deal.stage]} text-white`}>{deal.stage.replace("_", " ")}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Value</p>
                  <p className="font-semibold">{deal.value.toLocaleString()} {deal.currency}</p>
                </div>
                <div>
                  <p className="text-gray-600">Probability</p>
                  <p className="font-semibold">{deal.probability}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Owner</p>
                  <p className="font-semibold">{deal.owner}</p>
                </div>
                <div>
                  <p className="text-gray-600">Close Date</p>
                  <p className="font-semibold">{deal.closingDate}</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${deal.probability}%` }}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ DIGITAL MARKETING TAB ============

function DigitalMarketingTab() {
  const [metrics] = useState<DigitalMetrics[]>([
    {
      channel: "social_media",
      name: "Social Media",
      reach: 125000,
      engagement: 8500,
      conversionRate: 4.2,
      costPerClick: 2.5,
      roi: 450,
      lastUpdated: "2024-06-15",
    },
    {
      channel: "email",
      name: "Email Marketing",
      reach: 45000,
      engagement: 6200,
      conversionRate: 6.8,
      costPerClick: 0.85,
      roi: 520,
      lastUpdated: "2024-06-15",
    },
    {
      channel: "seo",
      name: "SEO/Organic",
      reach: 280000,
      engagement: 18500,
      conversionRate: 2.3,
      costPerClick: 0.0,
      roi: 680,
      lastUpdated: "2024-06-15",
    },
    {
      channel: "paid_ads",
      name: "Paid Ads",
      reach: 95000,
      engagement: 5200,
      conversionRate: 5.1,
      costPerClick: 4.2,
      roi: 280,
      lastUpdated: "2024-06-15",
    },
  ]);

  const chartData = metrics.map((m) => ({
    name: m.name.split(" ")[0],
    roi: m.roi,
    conversions: m.conversionRate,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Channel ROI Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
              <Bar dataKey="conversions" fill="#82ca9d" name="Conversion %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.channel}>
            <CardHeader>
              <CardTitle className="text-lg">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Reach</p>
                  <p className="font-semibold">{(metric.reach / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-gray-600">Engagement</p>
                  <p className="font-semibold">{metric.engagement}</p>
                </div>
                <div>
                  <p className="text-gray-600">Conversion Rate</p>
                  <p className="font-semibold">{metric.conversionRate}%</p>
                </div>
                <div>
                  <p className="text-gray-600">ROI</p>
                  <p className="font-semibold text-green-600">{metric.roi}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Cost/Click</p>
                  <p className="font-semibold">ETB {metric.costPerClick}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-semibold text-xs">{metric.lastUpdated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ CAMPAIGNS TAB ============

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "c1",
      name: "Q4 Social Blitz",
      objective: "Increase brand awareness by 40%",
      budget: 300000,
      startDate: "2024-10-01",
      endDate: "2024-12-31",
      status: "active",
      channels: ["Social Media", "Email"],
      roi: 450,
      notes: "Multi-platform campaign focusing on engagement",
    },
    {
      id: "c2",
      name: "Email nurture sequence",
      objective: "Convert leads to customers",
      budget: 50000,
      startDate: "2024-11-15",
      endDate: "2025-02-15",
      status: "active",
      channels: ["Email"],
      roi: 520,
      notes: "8-week nurture sequence",
    },
  ]);

  const statusColors = {
    planning: "bg-gray-500",
    active: "bg-green-500",
    completed: "bg-blue-500",
    paused: "bg-yellow-500",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { status: "planning", label: "Planning", count: 2 },
          { status: "active", label: "Active", count: campaigns.filter((c) => c.status === "active").length },
          { status: "completed", label: "Completed", count: 8 },
          { status: "paused", label: "Paused", count: 1 },
        ].map((item) => (
          <Card key={item.status}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-3xl font-bold">{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">All Campaigns</h3>
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold">{campaign.name}</h4>
                  <p className="text-sm text-gray-600">{campaign.objective}</p>
                </div>
                <Badge className={`${statusColors[campaign.status]} text-white`}>{campaign.status}</Badge>
              </div>
              <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-600">Budget</p>
                  <p className="font-semibold">ETB {campaign.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Channels</p>
                  <p className="font-semibold">{campaign.channels.join(", ")}</p>
                </div>
                <div>
                  <p className="text-gray-600">ROI</p>
                  <p className="font-semibold text-green-600">{campaign.roi}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Start</p>
                  <p className="font-semibold">{campaign.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">End</p>
                  <p className="font-semibold">{campaign.endDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ PRICING CALCULATOR TAB ============

function PricingTab() {
  const [pricing, setPricing] = useState({ serviceType: "", rate: 0, quantity: 0, notes: "" });
  const total = pricing.rate * pricing.quantity;

  const pricingTiers = [
    { service: "Email Campaign", rate: 50000, unit: "per 10K recipients" },
    { service: "Social Media Post", rate: 25000, unit: "per post" },
    { service: "Banner Design", rate: 15000, unit: "per banner" },
    { service: "Video Production", rate: 150000, unit: "per minute" },
    { service: "Influencer Partnership", rate: 200000, unit: "per campaign" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Service Type</Label>
            <Select value={pricing.serviceType} onValueChange={(v) => setPricing({ ...pricing, serviceType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {pricingTiers.map((tier) => (
                  <SelectItem key={tier.service} value={tier.service}>
                    {tier.service} - ETB {tier.rate.toLocaleString()} {tier.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rate (ETB)</Label>
              <Input
                type="number"
                value={pricing.rate}
                onChange={(e) => setPricing({ ...pricing, rate: parseFloat(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={pricing.quantity}
                onChange={(e) => setPricing({ ...pricing, quantity: parseFloat(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={pricing.notes}
              onChange={(e) => setPricing({ ...pricing, notes: e.target.value })}
              placeholder="Any special requirements or terms"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total Price:</span>
              <span className="text-2xl font-bold text-green-600">ETB {total.toLocaleString()}</span>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Quote
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standard Pricing Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pricingTiers.map((tier) => (
              <div key={tier.service} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">{tier.service}</p>
                  <p className="text-sm text-gray-600">{tier.unit}</p>
                </div>
                <p className="text-lg font-bold">ETB {tier.rate.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ MAIN COMPONENT ============

function MarketingUnitPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Unit</h1>
        <p className="text-gray-600">Manage campaigns, tasks, deals, and digital marketing</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="report">
          <ReportTab />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>
        <TabsContent value="deals">
          <DealsTab />
        </TabsContent>
        <TabsContent value="digital">
          <DigitalMarketingTab />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="pricing">
          <PricingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
