import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/units/branding-communication")({
  component: BrandingCommunicationPage,
});

export default function BrandingCommunicationPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Branding & Communication Unit</h1>
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><Card><CardContent className="pt-6">Branding Dashboard</CardContent></Card></TabsContent>
        <TabsContent value="report"><Card><CardContent className="pt-6">Branding Report</CardContent></Card></TabsContent>
        <TabsContent value="tasks"><Card><CardContent className="pt-6">Branding Tasks</CardContent></Card></TabsContent>
        <TabsContent value="deals"><Card><CardContent className="pt-6">Branding Deals</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
