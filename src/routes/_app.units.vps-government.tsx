import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/units/vps-government")({
  component: VpsGovernmentPage,
});

function VpsGovernmentPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const services = [
    { name: "Government Mail", uptime: "99.9%", users: 2400, revenue: "ETB 840K" },
    { name: "Secure Cloud", uptime: "99.95%", users: 1850, revenue: "ETB 920K" },
    { name: "Data Center", uptime: "99.8%", users: 950, revenue: "ETB 475K" },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">VPS & Government Unit</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Active Servers</p>
                <p className="text-2xl font-bold">28</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">ETB 2.24M</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">45</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Technical Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-3">
          {services.map((service) => (
            <Card key={service.name}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.users} users</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">Uptime: {service.uptime}</Badge>
                    <p className="mt-2 font-semibold">{service.revenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Government Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">45 government institutions served</p>
              <Button className="mt-4">Manage Clients</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
