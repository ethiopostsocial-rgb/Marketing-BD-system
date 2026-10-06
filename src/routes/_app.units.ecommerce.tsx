import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/units/ecommerce")({
  component: EcommercePage,
});

export default function EcommercePage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Ecommerce Unit</h1>
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><Card><CardContent className="pt-6">Dashboard</CardContent></Card></TabsContent>
        <TabsContent value="report"><Card><CardContent className="pt-6">Report</CardContent></Card></TabsContent>
        <TabsContent value="tasks"><Card><CardContent className="pt-6">Tasks</CardContent></Card></TabsContent>
        <TabsContent value="deals"><Card><CardContent className="pt-6">Deals</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
