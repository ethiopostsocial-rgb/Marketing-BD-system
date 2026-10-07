import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/units/mail-service")({
  component: MailServicePage,
});

function MailServicePage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const data = [
    { type: "Domestic", volume: 125000, revenue: 3750000 },
    { type: "International", volume: 45000, revenue: 2250000 },
    { type: "Express", volume: 85000, revenue: 4250000 },
    { type: "Parcel", volume: 62000, revenue: 1860000 },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Mail Service Unit</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Items Processed</p>
                <p className="text-2xl font-bold">317K</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">ETB 12.1M</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold">99.2%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold">24</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Revenue by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="volume" fill="#8884d8" name="Volume" />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (ETB)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Mail Service Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Service Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Addis Ababa Metro", "Regional Centers", "Rural Routes", "Express Network"].map((route) => (
                  <div key={route} className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>{route}</span>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">12,450 active customers</p>
              <Button className="mt-4">View All</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
