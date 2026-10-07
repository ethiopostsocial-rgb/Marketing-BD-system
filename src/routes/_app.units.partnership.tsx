import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/units/partnership")({
  component: PartnershipPage,
});

function PartnershipPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const partners = [
    { name: "TechCorp Africa", type: "Technology", status: "Active", value: 2500000, since: "2023" },
    { name: "Global Supply Co", type: "Logistics", status: "Active", value: 1800000, since: "2022" },
    { name: "Finance Solutions", type: "Financial", status: "Inactive", value: 950000, since: "2021" },
  ];

  const data = [
    { quarter: "Q1", revenue: 800000, opportunities: 5 },
    { quarter: "Q2", revenue: 950000, opportunities: 7 },
    { quarter: "Q3", revenue: 1100000, opportunities: 9 },
    { quarter: "Q4", revenue: 1300000, opportunities: 12 },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Partnership Unit</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Active Partnerships</p>
                <p className="text-3xl font-bold">12</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Annual Revenue</p>
                <p className="text-3xl font-bold">ETB 4.15B</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">In Negotiation</p>
                <p className="text-3xl font-bold">5</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Partnership Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue (ETB)" />
                  <Bar dataKey="opportunities" fill="#82ca9d" name="Opportunities" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Partnership Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Annual Partnership Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-3">
          {partners.map((partner) => (
            <Card key={partner.name}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{partner.name}</h4>
                    <p className="text-sm text-gray-600">{partner.type}</p>
                    <p className="text-xs text-gray-500">Since {partner.since}</p>
                  </div>
                  <div className="text-right">
                    <Badge>{partner.status}</Badge>
                    <p className="mt-2 font-semibold">ETB {(partner.value / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>Partnership Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Prospecting</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded">
                  <p className="text-sm text-gray-600">In Discussion</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Finalized</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
