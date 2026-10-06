import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, FileText, MessageSquare, Settings, Trash2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/units/branding-communication")({
  component: BrandingCommunicationPage,
});

interface BrandingActivity {
  id: string;
  title: string;
  description: string;
  status: "draft" | "in_progress" | "completed";
  dueDate: string;
  createdBy: string;
  createdAt: string;
}

interface CommunicationPlan {
  id: string;
  type: "printed" | "digital" | "mainstream" | "btl";
  title: string;
  description: string;
  status: "draft" | "pending_approval" | "approved" | "live";
  attachment?: string;
  createdBy: string;
  createdAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  status: "draft" | "submitted" | "approved_manager" | "pending_director" | "approved_director" | "ready_to_post";
  createdBy: string;
  createdAt: string;
  comments: Array<{ userId: string; text: string; timestamp: string }>;
}

function BrandingCommunicationPage() {
  const user = useCurrentUser();
  if (!user) return null;

  const [brandingActivities, setBrandingActivities] = useState<BrandingActivity[]>([]);
  const [communicationPlans, setCommunicationPlans] = useState<CommunicationPlan[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  // Branding form state
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [brandingTitle, setBrandingTitle] = useState("");
  const [brandingDesc, setBrandingDesc] = useState("");
  const [brandingDue, setBrandingDue] = useState("");

  // Communication form state
  const [commOpen, setCommOpen] = useState(false);
  const [commType, setCommType] = useState<"printed" | "digital" | "mainstream" | "btl">("digital");
  const [commTitle, setCommTitle] = useState("");
  const [commDesc, setCommDesc] = useState("");

  // Content form state
  const [contentOpen, setContentOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentBody, setContentBody] = useState("");

  const addBrandingActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandingTitle.trim()) { toast.error("Title required"); return; }
    const newActivity: BrandingActivity = {
      id: Math.random().toString(36).slice(2),
      title: brandingTitle,
      description: brandingDesc,
      status: "draft",
      dueDate: brandingDue,
      createdBy: user.id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setBrandingActivities([...brandingActivities, newActivity]);
    setBrandingTitle("");
    setBrandingDesc("");
    setBrandingDue("");
    setBrandingOpen(false);
    toast.success("Branding activity added");
  };

  const addCommunicationPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle.trim()) { toast.error("Title required"); return; }
    const newPlan: CommunicationPlan = {
      id: Math.random().toString(36).slice(2),
      type: commType,
      title: commTitle,
      description: commDesc,
      status: "draft",
      createdBy: user.id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCommunicationPlans([...communicationPlans, newPlan]);
    setCommTitle("");
    setCommDesc("");
    setCommOpen(false);
    toast.success("Communication plan added");
  };

  const addContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) { toast.error("Title required"); return; }
    const newContent: ContentItem = {
      id: Math.random().toString(36).slice(2),
      title: contentTitle,
      content: contentBody,
      status: "draft",
      createdBy: user.id,
      createdAt: new Date().toISOString().slice(0, 10),
      comments: [],
    };
    setContentItems([...contentItems, newContent]);
    setContentTitle("");
    setContentBody("");
    setContentOpen(false);
    toast.success("Content added for review");
  };

  const updateContentStatus = (id: string, newStatus: ContentItem["status"]) => {
    setContentItems(contentItems.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
  };

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    pending_approval: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    live: "bg-purple-100 text-purple-700",
    submitted: "bg-orange-100 text-orange-700",
    approved_manager: "bg-green-100 text-green-700",
    pending_director: "bg-yellow-100 text-yellow-700",
    approved_director: "bg-green-100 text-green-700",
    ready_to_post: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branding"><FileText className="mr-1.5 h-3.5 w-3.5" />Branding Report</TabsTrigger>
          <TabsTrigger value="communication"><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Communication</TabsTrigger>
          <TabsTrigger value="content"><Settings className="mr-1.5 h-3.5 w-3.5" />Content Management</TabsTrigger>
        </TabsList>

        {/* BRANDING REPORT TAB */}
        <TabsContent value="branding" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Track and manage branding activities and inquiries.</p>
            <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Add Activity</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New branding activity</DialogTitle>
                  <DialogDescription>Encode branding activity and follow up.</DialogDescription>
                </DialogHeader>
                <form onSubmit={addBrandingActivity} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={brandingTitle} onChange={(e) => setBrandingTitle(e.target.value)} required placeholder="e.g. Logo redesign inquiry" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={brandingDesc} onChange={(e) => setBrandingDesc(e.target.value)} rows={3} placeholder="Details..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input type="date" value={brandingDue} onChange={(e) => setBrandingDue(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setBrandingOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Activity</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {brandingActivities.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No activities yet.</CardContent></Card>
            ) : (
              brandingActivities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{activity.title}</h3>
                        <Badge className={`text-[10px] ${statusColors[activity.status]}`}>{activity.status}</Badge>
                      </div>
                      {activity.description && <p className="mt-1 text-xs text-muted-foreground">{activity.description}</p>}
                      {activity.dueDate && <p className="mt-1 text-xs text-muted-foreground">Due: {activity.dueDate}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setBrandingActivities(brandingActivities.filter((a) => a.id !== activity.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* COMMUNICATION TAB */}
        <TabsContent value="communication" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Plan communications across channels: printed, digital, mainstream, BTL.</p>
            <Dialog open={commOpen} onOpenChange={setCommOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Add Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New communication plan</DialogTitle>
                  <DialogDescription>Plan and attach for approval.</DialogDescription>
                </DialogHeader>
                <form onSubmit={addCommunicationPlan} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Type *</Label>
                    <select value={commType} onChange={(e) => setCommType(e.target.value as any)} className="w-full rounded border px-3 py-2 text-sm">
                      <option value="printed">Printed</option>
                      <option value="digital">Digital</option>
                      <option value="mainstream">Mainstream</option>
                      <option value="btl">BTL</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={commTitle} onChange={(e) => setCommTitle(e.target.value)} required placeholder="e.g. Q4 Print Campaign" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={commDesc} onChange={(e) => setCommDesc(e.target.value)} rows={3} placeholder="Details..." />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setCommOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Plan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {communicationPlans.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No plans yet.</CardContent></Card>
            ) : (
              communicationPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{plan.type}</Badge>
                        <h3 className="font-semibold">{plan.title}</h3>
                        <Badge className={`text-[10px] ${statusColors[plan.status]}`}>{plan.status.replace(/_/g, " ")}</Badge>
                      </div>
                      {plan.description && <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setCommunicationPlans(communicationPlans.filter((p) => p.id !== plan.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* CONTENT MANAGEMENT TAB */}
        <TabsContent value="content" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Daily content uploads: manager approval → director approval → ready to post.</p>
            <Dialog open={contentOpen} onOpenChange={setContentOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Upload Content</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload content</DialogTitle>
                  <DialogDescription>Submit for manager and director approval.</DialogDescription>
                </DialogHeader>
                <form onSubmit={addContent} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required placeholder="e.g. Today's news post" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Content *</Label>
                    <Textarea value={contentBody} onChange={(e) => setContentBody(e.target.value)} required rows={5} placeholder="Paste content..." />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setContentOpen(false)}>Cancel</Button>
                    <Button type="submit">Upload for Review</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {contentItems.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No content uploaded yet.</CardContent></Card>
            ) : (
              contentItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Badge className={`text-[10px] ${statusColors[item.status]}`}>{item.status.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setContentItems(contentItems.filter((c) => c.id !== item.id))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Status workflow buttons */}
                    <div className="flex gap-2 border-t pt-2">
                      {item.status === "draft" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateContentStatus(item.id, "submitted")}>
                          <AlertCircle className="mr-1 h-3 w-3" />Submit to Manager
                        </Button>
                      )}
                      {item.status === "submitted" && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs text-green-600" onClick={() => updateContentStatus(item.id, "approved_manager")}>
                            <Check className="mr-1 h-3 w-3" />Manager Approve
                          </Button>
                        </>
                      )}
                      {item.status === "approved_manager" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateContentStatus(item.id, "pending_director")}>
                          <AlertCircle className="mr-1 h-3 w-3" />Send to Director
                        </Button>
                      )}
                      {item.status === "pending_director" && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs text-green-600" onClick={() => updateContentStatus(item.id, "ready_to_post")}>
                            <Check className="mr-1 h-3 w-3" />Director Approve
                          </Button>
                        </>
                      )}
                      {item.status === "ready_to_post" && (
                        <Badge className="text-xs bg-purple-100 text-purple-700">✓ Ready to Post</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
