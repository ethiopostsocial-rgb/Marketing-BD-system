import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Calendar, Send, CheckCircle2, Clock, AlertCircle, Edit2, Trash2, MessageSquare, Download, Eye } from "lucide-react";

export const Route = createFileRoute("/units/marketing")({
  component: MarketingUnitPage,
});

// ============ DATA TYPES ============

interface ContentItem {
  id: string;
  date: string; // YYYY-MM-DD
  headline: string;
  content: string;
  seoKeywords: string[];
  artwork: {
    name: string;
    url: string;
    uploadedAt: string;
  };
  channel: "social_media" | "email" | "blog" | "web";
  createdBy: string;
  createdAt: string;
  status: "draft" | "pending_manager" | "manager_approved" | "pending_chief" | "approved" | "rejected";
  comments: Comment[];
  managerReview?: Review;
  chiefReview?: Review;
}

interface Comment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  type: "comment" | "track_change";
}

interface Review {
  reviewer: string;
  status: "approved" | "rejected";
  comments: string;
  timestamp: string;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  budget: number;
  channels: string[];
  contentItems: number;
  status: "planning" | "active" | "completed";
  approval: {
    managerStatus: "pending" | "approved" | "rejected";
    chiefStatus: "pending" | "approved" | "rejected";
  };
  createdBy: string;
  createdAt: string;
}

interface PricingTier {
  id: string;
  service: string;
  baseRate: number;
  description: string;
  minQuantity: number;
  maxQuantity: number;
  discount: number; // percentage
  status: "draft" | "pending_manager" | "manager_approved" | "pending_chief" | "approved";
  managerApproval?: { approvedBy: string; date: string };
  chiefApproval?: { approvedBy: string; date: string };
}

// ============ CONTENT CALENDAR TAB (Monthly Calendar) ============

function ContentCalendarTab() {
  const user = useCurrentUser();
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 5)); // June 2024
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: "c1",
      date: "2024-06-15",
      headline: "New Product Launch Announcement",
      content: "Exciting launch of our new service...",
      seoKeywords: ["product launch", "announcement", "new service"],
      artwork: { name: "launch-banner.jpg", url: "#", uploadedAt: "2024-06-10" },
      channel: "social_media",
      createdBy: "Ahmed Hassan",
      createdAt: "2024-06-01",
      status: "manager_approved",
      comments: [
        {
          id: "cm1",
          author: "Fatima Ali",
          role: "Manager",
          text: "Great content. Please adjust color contrast in artwork.",
          timestamp: "2024-06-05",
          type: "comment",
        },
      ],
      managerReview: {
        reviewer: "Fatima Ali",
        status: "approved",
        comments: "Approved with minor artwork adjustments",
        timestamp: "2024-06-05",
      },
      chiefReview: undefined,
    },
    {
      id: "c2",
      date: "2024-06-20",
      headline: "Customer Success Story",
      content: "How XYZ company benefited from our services...",
      seoKeywords: ["customer success", "case study", "roi"],
      artwork: { name: "success-story.jpg", url: "#", uploadedAt: "2024-06-15" },
      channel: "blog",
      createdBy: "Kebede Tekle",
      createdAt: "2024-06-10",
      status: "pending_manager",
      comments: [],
      managerReview: undefined,
      chiefReview: undefined,
    },
  ]);

  const [newContent, setNewContent] = useState({
    date: "",
    headline: "",
    content: "",
    seoKeywords: "",
    channel: "social_media",
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Get days in month
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getContentForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return contentItems.filter((item) => item.date === dateStr);
  };

  const addContent = () => {
    if (newContent.headline && newContent.date) {
      const content: ContentItem = {
        id: Date.now().toString(),
        date: newContent.date,
        headline: newContent.headline,
        content: newContent.content,
        seoKeywords: newContent.seoKeywords.split(",").map((k) => k.trim()),
        artwork: { name: "", url: "", uploadedAt: "" },
        channel: newContent.channel as any,
        createdBy: user?.name || "Unknown",
        createdAt: new Date().toISOString(),
        status: "draft",
        comments: [],
      };
      setContentItems([...contentItems, content]);
      setNewContent({ date: "", headline: "", content: "", seoKeywords: "", channel: "social_media" });
    }
  };

  const statusColors = {
    draft: "bg-gray-500",
    pending_manager: "bg-yellow-500",
    manager_approved: "bg-blue-500",
    pending_chief: "bg-orange-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
  };

  const isManager = user?.role === "manager" || user?.role === "director";
  const isChief = user?.role === "director";

  return (
    <div className="space-y-6">
      {/* NEW CONTENT FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Add Content to Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Content Date</Label>
              <Input type="date" value={newContent.date} onChange={(e) => setNewContent({ ...newContent, date: e.target.value })} />
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={newContent.channel} onValueChange={(v) => setNewContent({ ...newContent, channel: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="web">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Headline</Label>
            <Input
              placeholder="Content headline"
              value={newContent.headline}
              onChange={(e) => setNewContent({ ...newContent, headline: e.target.value })}
            />
          </div>

          <div>
            <Label>Content</Label>
            <Textarea
              placeholder="Full content/body text"
              value={newContent.content}
              onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <Label>SEO Keywords (comma-separated)</Label>
            <Input
              placeholder="keyword1, keyword2, keyword3"
              value={newContent.seoKeywords}
              onChange={(e) => setNewContent({ ...newContent, seoKeywords: e.target.value })}
            />
          </div>

          <div>
            <Label>Artwork/Image</Label>
            <Input type="file" accept="image/*" />
            <p className="text-xs text-gray-600 mt-2">Upload banner, image, or thumbnail</p>
          </div>

          <Button onClick={addContent} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
        </CardContent>
      </Card>

      {/* MONTHLY CALENDAR VIEW */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 bg-gray-50 rounded min-h-24"></div>
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const content = getContentForDate(day);
              return (
                <div
                  key={day}
                  className="p-2 border rounded min-h-24 bg-white hover:bg-gray-50"
                  onClick={() => {
                    setSelectedDate(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
                  }}
                >
                  <p className="font-semibold text-sm mb-2">{day}</p>
                  <div className="space-y-1">
                    {content.map((item) => (
                      <div
                        key={item.id}
                        className={`text-xs p-1 rounded text-white cursor-pointer ${statusColors[item.status]}`}
                        onClick={() => {
                          setSelectedContent(item);
                          setShowDetailModal(true);
                        }}
                      >
                        <p className="font-semibold truncate">{item.headline}</p>
                        <p className="text-xs opacity-90">{item.status.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CONTENT DETAIL MODAL */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContent?.headline}</DialogTitle>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-6">
              {/* CONTENT DETAILS */}
              <div>
                <h4 className="font-semibold mb-2">Content Details</h4>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Headline</p>
                    <p className="font-semibold">{selectedContent.headline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Content</p>
                    <p>{selectedContent.content}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SEO Keywords</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedContent.seoKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Channel</p>
                    <p className="font-semibold capitalize">{selectedContent.channel.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p>{selectedContent.createdBy}</p>
                  </div>
                </div>
              </div>

              {/* APPROVAL WORKFLOW */}
              <div>
                <h4 className="font-semibold mb-2">Approval Status</h4>
                <div className="space-y-2">
                  {/* MANAGER APPROVAL */}
                  <div className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">Manager Review</p>
                      {selectedContent.managerReview ? (
                        <Badge className={selectedContent.managerReview.status === "approved" ? "bg-green-500" : "bg-red-500"}>
                          {selectedContent.managerReview.status}
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500">Pending</Badge>
                      )}
                    </div>
                    {selectedContent.managerReview && (
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">Reviewed by: {selectedContent.managerReview.reviewer}</p>
                        <p>{selectedContent.managerReview.comments}</p>
                        <p className="text-xs text-gray-500">{selectedContent.managerReview.timestamp}</p>
                      </div>
                    )}

                    {isManager && !selectedContent.managerReview && (
                      <div className="mt-3 space-y-2">
                        <Textarea placeholder="Manager comments" rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CHIEF APPROVAL */}
                  {selectedContent.managerReview?.status === "approved" && (
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">Chief Approval</p>
                        {selectedContent.chiefReview ? (
                          <Badge className={selectedContent.chiefReview.status === "approved" ? "bg-green-500" : "bg-red-500"}>
                            {selectedContent.chiefReview.status}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500">Pending</Badge>
                        )}
                      </div>
                      {selectedContent.chiefReview && (
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">Approved by: {selectedContent.chiefReview.reviewer}</p>
                          <p>{selectedContent.chiefReview.comments}</p>
                          <p className="text-xs text-gray-500">{selectedContent.chiefReview.timestamp}</p>
                        </div>
                      )}

                      {isChief && !selectedContent.chiefReview && (
                        <div className="mt-3 space-y-2">
                          <Textarea placeholder="Chief comments" rows={2} />
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Final Approve
                            </Button>
                            <Button size="sm" variant="destructive">
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* COMMENTS & TRACK CHANGES */}
              <div>
                <h4 className="font-semibold mb-2">Comments & Track Changes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {selectedContent.comments.map((comment) => (
                    <div key={comment.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between mb-1">
                        <p className="font-semibold">{comment.author}</p>
                        <Badge variant="outline">{comment.type.replace("_", " ")}</Badge>
                      </div>
                      <p>{comment.text}</p>
                      <p className="text-xs text-gray-500">{comment.timestamp}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="Add comment..." rows={2} className="flex-1" />
                  <Button className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CALENDAR LEGEND */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Pending Manager</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Manager Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Pending Chief</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Rejected</span>
        </div>
      </div>
    </div>
  );
}

// ============ CAMPAIGN TAB (Multi-level Approval) ============

function CampaignTab() {
  const user = useCurrentUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "camp1",
      name: "Q4 Social Blitz",
      objective: "Increase brand awareness by 40%",
      startDate: "2024-10-01",
      endDate: "2024-12-31",
      budget: 300000,
      channels: ["Social Media", "Email"],
      contentItems: 24,
      status: "active",
      approval: {
        managerStatus: "approved",
        chiefStatus: "approved",
      },
      createdBy: "Ahmed Hassan",
      createdAt: "2024-08-15",
    },
  ]);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    objective: "",
    startDate: "",
    endDate: "",
    budget: "",
    channels: [] as string[],
  });

  const isManager = user?.role === "manager" || user?.role === "director";
  const isChief = user?.role === "director";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Campaign Name" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
          <Textarea
            placeholder="Campaign Objective"
            value={newCampaign.objective}
            onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newCampaign.startDate}
                onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={newCampaign.endDate}
                onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Budget (ETB)</Label>
            <Input
              type="number"
              value={newCampaign.budget}
              onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
            />
          </div>
          <div>
            <Label>Channels</Label>
            <div className="flex gap-2 mt-2">
              {["Social Media", "Email", "Blog", "Paid Ads"].map((ch) => (
                <Button
                  key={ch}
                  size="sm"
                  variant={newCampaign.channels.includes(ch) ? "default" : "outline"}
                  onClick={() => {
                    setNewCampaign({
                      ...newCampaign,
                      channels: newCampaign.channels.includes(ch)
                        ? newCampaign.channels.filter((c) => c !== ch)
                        : [...newCampaign.channels, ch],
                    });
                  }}
                >
                  {ch}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{campaign.name}</h4>
                  <p className="text-sm text-gray-600">{campaign.objective}</p>
                </div>
                <div className="text-right">
                  <Badge>{campaign.status}</Badge>
                  <p className="text-sm mt-2">Budget: ETB {campaign.budget.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm mb-3 py-3 border-y">
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-semibold">{campaign.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">End Date</p>
                  <p className="font-semibold">{campaign.endDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Channels</p>
                  <p className="font-semibold">{campaign.channels.join(", ")}</p>
                </div>
                <div>
                  <p className="text-gray-600">Content Items</p>
                  <p className="font-semibold">{campaign.contentItems}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Manager Approval</span>
                  <Badge className={campaign.approval.managerStatus === "approved" ? "bg-green-500" : "bg-yellow-500"}>
                    {campaign.approval.managerStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Chief Approval</span>
                  <Badge className={campaign.approval.chiefStatus === "approved" ? "bg-green-500" : "bg-yellow-500"}>
                    {campaign.approval.chiefStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ PRICING TAB (Detailed Pricing with Approval) ============

function PricingTab() {
  const user = useCurrentUser();
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    {
      id: "pt1",
      service: "Email Campaign",
      baseRate: 50000,
      description: "Per 10,000 recipients",
      minQuantity: 1,
      maxQuantity: 100,
      discount: 0,
      status: "approved",
      managerApproval: { approvedBy: "Fatima Ali", date: "2024-05-20" },
      chiefApproval: { approvedBy: "Belayneh Mamush", date: "2024-05-22" },
    },
    {
      id: "pt2",
      service: "Social Media Content",
      baseRate: 25000,
      description: "Per post with design",
      minQuantity: 1,
      maxQuantity: 50,
      discount: 5,
      status: "pending_manager",
      managerApproval: undefined,
      chiefApproval: undefined,
    },
  ]);

  const [newPricing, setNewPricing] = useState({
    service: "",
    baseRate: "",
    description: "",
    minQuantity: "",
    maxQuantity: "",
    discount: "",
  });

  const isManager = user?.role === "manager" || user?.role === "director";
  const isChief = user?.role === "director";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Pricing Tier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Service Name" value={newPricing.service} onChange={(e) => setNewPricing({ ...newPricing, service: e.target.value })} />
          <Input
            placeholder="Description (e.g., per unit)"
            value={newPricing.description}
            onChange={(e) => setNewPricing({ ...newPricing, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Base Rate (ETB)</Label>
              <Input
                type="number"
                value={newPricing.baseRate}
                onChange={(e) => setNewPricing({ ...newPricing, baseRate: e.target.value })}
              />
            </div>
            <div>
              <Label>Min Quantity</Label>
              <Input
                type="number"
                value={newPricing.minQuantity}
                onChange={(e) => setNewPricing({ ...newPricing, minQuantity: e.target.value })}
              />
            </div>
            <div>
              <Label>Max Quantity</Label>
              <Input
                type="number"
                value={newPricing.maxQuantity}
                onChange={(e) => setNewPricing({ ...newPricing, maxQuantity: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Volume Discount (%)</Label>
            <Input
              type="number"
              value={newPricing.discount}
              onChange={(e) => setNewPricing({ ...newPricing, discount: e.target.value })}
            />
          </div>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{tier.service}</h4>
                  <p className="text-sm text-gray-600">{tier.description}</p>
                </div>
                <Badge className={tier.status === "approved" ? "bg-green-500" : tier.status === "pending_manager" ? "bg-yellow-500" : "bg-orange-500"}>
                  {tier.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm mb-4 py-3 border-y">
                <div>
                  <p className="text-gray-600">Base Rate</p>
                  <p className="font-semibold">ETB {tier.baseRate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Min Order</p>
                  <p className="font-semibold">{tier.minQuantity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Max Order</p>
                  <p className="font-semibold">{tier.maxQuantity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Volume Discount</p>
                  <p className="font-semibold">{tier.discount}%</p>
                </div>
              </div>

              {/* APPROVAL WORKFLOW */}
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Manager Approval</span>
                    {tier.managerApproval ? (
                      <div className="text-right">
                        <Badge className="bg-green-500">Approved</Badge>
                        <p className="text-xs text-gray-600 mt-1">{tier.managerApproval.approvedBy}</p>
                      </div>
                    ) : (
                      <Badge className="bg-yellow-500">Pending</Badge>
                    )}
                  </div>
                  {!tier.managerApproval && isManager && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" className="bg-green-600">
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {tier.managerApproval && (
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Chief Approval</span>
                      {tier.chiefApproval ? (
                        <div className="text-right">
                          <Badge className="bg-green-500">Approved</Badge>
                          <p className="text-xs text-gray-600 mt-1">{tier.chiefApproval.approvedBy}</p>
                        </div>
                      ) : (
                        <Badge className="bg-yellow-500">Pending</Badge>
                      )}
                    </div>
                    {!tier.chiefApproval && isChief && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="bg-green-600">
                          Final Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

function MarketingUnitPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Unit - Professional Workflows</h1>
        <p className="text-gray-600">Manage content, campaigns, and pricing with approval workflows</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Dashboard metrics and KPIs</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <ContentCalendarTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignTab />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingTab />
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardContent className="pt-6">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="pt-6">Tasks management</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardContent className="pt-6">Deals pipeline</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
