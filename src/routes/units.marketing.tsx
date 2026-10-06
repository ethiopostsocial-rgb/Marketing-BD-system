import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Edit2, Calendar, DollarSign, Share2, Clock } from "lucide-react";

export const Route = createFileRoute("/units/marketing")({
  component: MarketingUnitPage,
});

type Tab = "dashboard" | "report" | "tasks" | "deals" | "digital" | "campaigns" | "pricing";

function MarketingUnitPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [placementPlan, setPlacementPlan] = useState("");
  const [implementation, setImplementation] = useState("");
  const [tariffRate, setTariffRate] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!user) return null;

  const calculateTariff = () => {
    return (tariffRate * quantity).toFixed(2);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing Unit</h1>
        <p className="mt-1 text-sm text-muted-foreground">Digital Marketing, Campaigns, and Pricing Management</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">$2.4M</div>
                <p className="text-xs text-muted-foreground">Budget Spent</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: "Jan", reach: 4000, engagement: 2400 },
                  { month: "Feb", reach: 5000, engagement: 2800 },
                  { month: "Mar", reach: 6200, engagement: 3200 },
                  { month: "Apr", reach: 7100, engagement: 3800 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reach" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="engagement" stroke="#ec4899" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Report Period</Label>
                  <Input type="month" />
                </div>
                <div>
                  <Label>Report Type</Label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annual</option>
                  </select>
                </div>
              </div>
              <Button className="w-full">Generate Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TASKS */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Marketing Tasks</CardTitle>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Task</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Create social media calendar</p>
                    <p className="text-xs text-muted-foreground">Due: 2026-10-15</p>
                  </div>
                  <Badge>In Progress</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Prepare email campaign</p>
                    <p className="text-xs text-muted-foreground">Due: 2026-10-20</p>
                  </div>
                  <Badge variant="secondary">To Do</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEALS */}
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Marketing Deals & Opportunities</CardTitle>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Deal</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Brand partnership with XYZ Corp</p>
                    <p className="text-xs text-muted-foreground">Value: $50,000</p>
                  </div>
                  <Badge>Negotiation</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIGITAL MARKETING */}
        <TabsContent value="digital" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Digital Marketing Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Social Media</h3>
                  <p className="text-sm text-muted-foreground mb-3">Facebook, Instagram, Twitter, LinkedIn</p>
                  <div className="text-2xl font-bold">45K</div>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Email Marketing</h3>
                  <p className="text-sm text-muted-foreground">Newsletter & Campaign emails</p>
                  <div className="text-2xl font-bold">28%</div>
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">SEO & Content</h3>
                  <p className="text-sm text-muted-foreground">Blog, Articles, Keywords</p>
                  <div className="text-2xl font-bold">1.2K</div>
                  <p className="text-xs text-muted-foreground">Monthly Visits</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Paid Ads</h3>
                  <p className="text-sm text-muted-foreground">Google Ads, Facebook Ads</p>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAMPAIGN MANAGEMENT */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PLACEMENT PLAN */}
              <div className="border-b pb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Placement Plan
                </h3>
                <Label className="mb-2 block">Channels & Distribution</Label>
                <textarea
                  placeholder="Define where campaigns will be placed... E.g., Social Media (Facebook, Instagram), Email newsletters, Print media, Billboards, Partner websites, TV/Radio"
                  value={placementPlan}
                  onChange={(e) => setPlacementPlan(e.target.value)}
                  className="w-full p-3 border rounded-md text-sm min-h-[120px]"
                />
              </div>

              {/* IMPLEMENTATION */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Implementation
                </h3>
                <Label className="mb-2 block">Timeline, Resources & Execution Steps</Label>
                <textarea
                  placeholder="Define how campaigns will be executed... E.g., Timeline (Start: Oct 15, End: Nov 30), Resources needed, Team assignments, Approval workflow, Go-live checklist"
                  value={implementation}
                  onChange={(e) => setImplementation(e.target.value)}
                  className="w-full p-3 border rounded-md text-sm min-h-[120px]"
                />
              </div>

              <Button className="w-full">Save Campaign Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING / TARIFF CALCULATOR */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Tariff Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Tariff Rate (per unit)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tariffRate}
                      onChange={(e) => setTariffRate(parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                    <span className="flex items-center px-3 py-2 bg-muted rounded-md">ETB</span>
                  </div>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Price:</span>
                  <span className="text-2xl font-bold text-blue-600">ETB {calculateTariff()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Pricing Tiers</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm p-2 border rounded">
                    <span>Bulk (100+ units)</span>
                    <span className="font-medium">-15% discount</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 border rounded">
                    <span>Standard (10-99 units)</span>
                    <span className="font-medium">-5% discount</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 border rounded">
                    <span>Retail (1-9 units)</span>
                    <span className="font-medium">Full price</span>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <DollarSign className="h-4 w-4 mr-2" />
                Generate Quote
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
