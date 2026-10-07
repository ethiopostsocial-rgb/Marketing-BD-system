import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Download } from "lucide-react";

export const Route = createFileRoute("/units/branding-communication")({
  component: BrandingCommunicationPage,
});

function BrandingCommunicationPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const kpis = [
    { label: "Brand Awareness", value: "78%", change: "+5%" },
    { label: "Brand Sentiment", value: "Positive", change: "+12%" },
    { label: "Message Consistency", value: "94%", change: "+3%" },
    { label: "Communications Sent", value: "245", change: "+18%" },
  ];

  const data = [
    { month: "Jan", awareness: 65, sentiment: 70 },
    { month: "Feb", awareness: 68, sentiment: 72 },
    { month: "Mar", awareness: 72, sentiment: 75 },
    { month: "Apr", awareness: 75, sentiment: 78 },
  ];

  const communicationChannels = [
    { channel: "Press Releases", count: 12, status: "Active" },
    { channel: "Social Media", count: 28, status: "Active" },
    { channel: "Newsletter", count: 8, status: "Scheduled" },
    { channel: "Internal Comms", count: 34, status: "Active" },
  ];

  const brandGuidelines = [
    "Logo Usage Guidelines",
    "Color Palette Standards",
    "Typography Rules",
    "Voice & Tone Guidelines",
    "Visual Style Standards",
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Branding & Communication Unit</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="comms">Comms</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="guide">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
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
              <CardTitle>Brand Metrics Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="awareness" stroke="#8884d8" name="Awareness %" />
                  <Line type="monotone" dataKey="sentiment" stroke="#82ca9d" name="Sentiment Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Report Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Brand Audit Report (PDF)
              </Button>
              <p className="text-sm text-gray-600">Includes: brand perception, messaging consistency, visual identity audit</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Brand Initiative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Initiative title" />
              <Textarea placeholder="Description" rows={3} />
              <Button className="w-full"><Plus className="h-4 w-4 mr-2" />Add Initiative</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {brandGuidelines.map((guide) => (
              <Card key={guide}>
                <CardContent className="pt-6">
                  <p className="font-semibold">{guide}</p>
                  <Button className="w-full mt-4" variant="outline">View</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comms" className="space-y-6">
          <div className="space-y-3">
            {communicationChannels.map((ch) => (
              <Card key={ch.channel}>
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{ch.channel}</p>
                    <p className="text-sm text-gray-600">{ch.count} communications</p>
                  </div>
                  <Badge>{ch.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">12 items scheduled for this month</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Logo Standards", "Color Palette", "Typography", "Tone of Voice"].map((item) => (
                <div key={item} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>{item}</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
