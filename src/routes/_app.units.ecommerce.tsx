import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/units/ecommerce")({
  component: EcommercePage,
});

function EcommercePage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const sales = [
    { day: "Mon", sales: 450000, orders: 145 },
    { day: "Tue", sales: 520000, orders: 168 },
    { day: "Wed", sales: 480000, orders: 152 },
    { day: "Thu", sales: 590000, orders: 189 },
    { day: "Fri", sales: 720000, orders: 235 },
    { day: "Sat", sales: 850000, orders: 278 },
    { day: "Sun", sales: 680000, orders: 215 },
  ];

  const products = [
    { name: "Product A", sales: 45000, units: 120, rating: 4.8 },
    { name: "Product B", sales: 38000, units: 95, rating: 4.5 },
    { name: "Product C", sales: 52000, units: 165, rating: 4.9 },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">E-Commerce Unit</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Weekly Sales</p>
                <p className="text-2xl font-bold">ETB 4.39M</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">1,377</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">3.2%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">ETB 3,190</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales (ETB)" />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>E-Commerce Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Sales Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-3">
          {products.map((p) => (
            <Card key={p.name}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-600">{p.units} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">ETB {p.sales.toLocaleString()}</p>
                    <p className="text-yellow-500">⭐ {p.rating}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">1,377 orders this week</p>
              <Button className="mt-4">View All Orders</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
