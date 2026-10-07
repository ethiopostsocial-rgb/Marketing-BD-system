import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/units/philately-museum")({
  component: PhilatelyMuseumPage,
});

function PhilatelyMuseumPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const exhibits = [
    { name: "Ethiopian Stamps Through History", type: "Permanent", visitors: 45000, status: "Active" },
    { name: "Postal Heritage Collection", type: "Permanent", visitors: 32000, status: "Active" },
    { name: "Modern Philately", type: "Rotating", visitors: 8500, status: "Active" },
  ];

  const collections = [
    { category: "Stamp Collection", items: 8450, value: "ETB 2.1M", condition: "Excellent" },
    { category: "Postal Artifacts", items: 1240, value: "ETB 1.8M", condition: "Good" },
    { category: "Historical Documents", items: 3560, value: "ETB 950K", condition: "Fair" },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Philately & Museum Unit</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="exhibits">Exhibits</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Annual Visitors</p>
                <p className="text-2xl font-bold">85.5K</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Museum Revenue</p>
                <p className="text-2xl font-bold">ETB 4.95M</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Active Exhibits</p>
                <p className="text-2xl font-bold">3</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Collections</p>
                <p className="text-2xl font-bold">13.2K</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Visitor Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>This Month</span>
                  <span className="font-semibold">7,240 visitors</span>
                </div>
                <div className="flex justify-between">
                  <span>This Year</span>
                  <span className="font-semibold">85,500 visitors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Museum Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Annual Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exhibits" className="space-y-3">
          {exhibits.map((exhibit) => (
            <Card key={exhibit.name}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{exhibit.name}</h4>
                    <p className="text-sm text-gray-600">{exhibit.type}</p>
                    <p className="text-xs text-gray-500">{exhibit.visitors.toLocaleString()} visitors</p>
                  </div>
                  <Badge>{exhibit.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="collection" className="space-y-3">
          {collections.map((item) => (
            <Card key={item.category}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{item.category}</h4>
                    <p className="text-sm text-gray-600">{item.items.toLocaleString()} items</p>
                  </div>
                  <Badge>{item.condition}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Value</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
