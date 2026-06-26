import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore, canAccessTab } from "@/lib/store";
import { DISTRICTS, DISTRICT_LABELS, type District, type InventoryItem, type DistributionPlace } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Package, Send, Search, Trash2, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({
  component: InventoryPage,
});

function totals(it: InventoryItem) {
  const distributed = it.distributions.reduce((a, d) => a + d.quantity, 0);
  return { distributed, remaining: it.totalQuantity - distributed };
}

function byDistrict(it: InventoryItem): Record<District, number> {
  const map: Record<string, number> = {};
  for (const d of DISTRICTS) map[d] = 0;
  for (const d of it.distributions) map[d.district] = (map[d.district] ?? 0) + d.quantity;
  return map as Record<District, number>;
}

function InventoryPage() {
  const user = useCurrentUser();
  const inventory = useStore((s) => s.inventory);
  const users = useStore((s) => s.users);
  const createItem = useStore((s) => s.createInventoryItem);
  const deleteItem = useStore((s) => s.deleteInventoryItem);
  const addDist = useStore((s) => s.addDistribution);
  const removeDist = useStore((s) => s.removeDistribution);
  const distributionPlaces = useStore((s) => s.distributionPlaces);
  const createPlace = useStore((s) => s.createDistributionPlace);
  const updatePlace = useStore((s) => s.updateDistributionPlace);
  const deletePlace = useStore((s) => s.deleteDistributionPlace);

  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [distItem, setDistItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  // form state — create
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Print");
  const [unit, setUnit] = useState("pcs");
  const [total, setTotal] = useState<number>(0);
  const [desc, setDesc] = useState("");

  // form state — distribute
  const [district, setDistrict] = useState<District>("addis_ababa");
  const [qty, setQty] = useState<number>(0);
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");

  // form state — distribution place
  const [placeOpen, setPlaceOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<DistributionPlace | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [placeDistrict, setPlaceDistrict] = useState<District>("addis_ababa");
  const [placeAddress, setPlaceAddress] = useState("");
  const [placeContact, setPlaceContact] = useState("");
  const [placePhone, setPlacePhone] = useState("");
  const [placeNote, setPlaceNote] = useState("");
  const [placeSearch, setPlaceSearch] = useState("");

  if (!user) return null;
  if (!canAccessTab(user, "inventory")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-8">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Restricted</h2>
              <p className="text-sm text-muted-foreground">Marketing inventory is restricted to the M&amp;C Director, Marketing Manager, and Senior Marketing Officer.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const canManage = user.role === "director" || user.role === "marketing_manager" ||
  (user.role === "senior_officer" && (user.unit === "marketing" || user.unit === "both"));
  const canDelete = user.role === "director";

  const [fCategory, setFCategory] = useState<string>("all");
  const [fDistrict, setFDistrict] = useState<string>("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const categories = useMemo(() => Array.from(new Set(inventory.map((i) => i.category))).sort(), [inventory]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return inventory.filter((i) => {
      if (term && !(i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term) || (i.description?.toLowerCase().includes(term) ?? false))) return false;
      if (fCategory !== "all" && i.category !== fCategory) return false;
      if (fDistrict !== "all" && !i.distributions.some((d) => d.district === fDistrict)) return false;
      if (fFrom && i.createdAt < fFrom) return false;
      if (fTo && i.createdAt > fTo) return false;
      return true;
    });
  }, [inventory, q, fCategory, fDistrict, fFrom, fTo]);


  const resetCreate = () => {
    setName(""); setCategory("Print"); setUnit("pcs"); setTotal(0); setDesc("");
  };
  const resetDist = () => {
    setDistrict("addis_ababa"); setQty(0); setRecipient(""); setNote("");
  };

  const resetPlace = () => {
    setPlaceName(""); setPlaceDistrict("addis_ababa"); setPlaceAddress("");
    setPlaceContact(""); setPlacePhone(""); setPlaceNote(""); setEditingPlace(null);
  };

  const openEditPlace = (p: DistributionPlace) => {
    setEditingPlace(p);
    setPlaceName(p.name); setPlaceDistrict(p.district); setPlaceAddress(p.address ?? "");
    setPlaceContact(p.contactPerson ?? ""); setPlacePhone(p.contactPhone ?? ""); setPlaceNote(p.note ?? "");
    setPlaceOpen(true);
  };

  const submitPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) { toast.error("Name is required"); return; }
    const payload = {
      name: placeName.trim(),
      district: placeDistrict,
      address: placeAddress.trim() || undefined,
      contactPerson: placeContact.trim() || undefined,
      contactPhone: placePhone.trim() || undefined,
      note: placeNote.trim() || undefined,
    };
    if (editingPlace) {
      updatePlace(editingPlace.id, payload);
      toast.success("Distribution place updated");
    } else {
      createPlace(payload);
      toast.success("Distribution place added");
    }
    resetPlace();
    setPlaceOpen(false);
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || total <= 0) {
      toast.error("Name and total quantity are required");
      return;
    }
    createItem({ name: name.trim(), category, unit, totalQuantity: total, description: desc.trim() || undefined });
    toast.success("Inventory item added");
    resetCreate();
    setCreateOpen(false);
  };

  const submitDist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distItem) return;
    const res = addDist(distItem.id, {
      district,
      quantity: qty,
      date: new Date().toISOString().slice(0, 10),
      recipient: recipient.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (!res.ok) { toast.error(res.error ?? "Failed"); return; }
    toast.success(`Distributed to ${DISTRICT_LABELS[district]}`);
    resetDist();
    setDistItem(null);
  };

  // aggregate totals across all items by district
  const aggregate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of DISTRICTS) map[d] = 0;
    for (const it of inventory) {
      for (const d of it.distributions) map[d.district] += d.quantity;
    }
    return map as Record<District, number>;
  }, [inventory]);

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory"><Package className="mr-1.5 h-3.5 w-3.5" />Inventory</TabsTrigger>
          {user.role === "director" && (
            <TabsTrigger value="places"><MapPin className="mr-1.5 h-3.5 w-3.5" />Distribution Places</TabsTrigger>
          )}
        </TabsList>

        {/* ── INVENTORY TAB ── */}
        <TabsContent value="inventory" className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Track marketing materials and their distribution across all Ethiopost districts.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="pl-8 w-64" />
          </div>
          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Add Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New inventory item</DialogTitle>
                  <DialogDescription>Add a marketing material to stock.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submitCreate} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="iname">Name</Label>
                    <Input id="iname" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Print", "Display", "Giveaway", "Apparel", "Digital", "Other"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pcs", "box", "roll", "set", "pack"].map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="itot">Total qty</Label>
                      <Input id="itot" type="number" min={1} value={total || ""} onChange={(e) => setTotal(Number(e.target.value))} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="idesc">Description</Label>
                    <Textarea id="idesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Category</Label>
            <Select value={fCategory} onValueChange={setFCategory}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">District</Label>
            <Select value={fDistrict} onValueChange={setFDistrict}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{DISTRICT_LABELS[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Added from</Label>
            <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Added to</Label>
            <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="h-9 w-40" />
          </div>
          {(fCategory !== "all" || fDistrict !== "all" || fFrom || fTo) && (
            <Button size="sm" variant="ghost" onClick={() => { setFCategory("all"); setFDistrict("all"); setFFrom(""); setFTo(""); }}>Clear</Button>
          )}
        </CardContent>
      </Card>


      {/* District summary strip */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-accent" /> Distribution by district (all items)
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {DISTRICTS.map((d) => (
              <div key={d} className="rounded-lg border border-border bg-card p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{DISTRICT_LABELS[d]}</div>
                <div className="mt-1 text-xl font-bold text-foreground">{aggregate[d].toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((it) => {
          const { distributed, remaining } = totals(it);
          const pct = it.totalQuantity > 0 ? Math.round((distributed / it.totalQuantity) * 100) : 0;
          const bd = byDistrict(it);
          return (
            <Card key={it.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <Badge variant="secondary" className="text-[10px]">{it.category}</Badge>
                    </div>
                    <h3 className="mt-1.5 truncate text-base font-semibold text-foreground">{it.name}</h3>
                    {it.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{it.description}</p>
                    )}
                  </div>
                  {canDelete && (
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => { if (confirm(`Delete "${it.name}"?`)) { deleteItem(it.id); toast.success("Deleted"); } }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Total</div>
                    <div className="text-sm font-bold text-foreground">{it.totalQuantity.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md bg-chart-3/10 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Distributed</div>
                    <div className="text-sm font-bold text-chart-3">{distributed.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md bg-success/10 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Remaining</div>
                    <div className="text-sm font-bold text-success">{remaining.toLocaleString()}</div>
                  </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-muted-foreground">{pct}% distributed · {it.unit}</div>

                <div className="mt-1 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
                  {DISTRICTS.map((d) => (
                    <div key={d} className="flex items-center justify-between rounded border border-border/60 px-1.5 py-1">
                      <span className="truncate text-muted-foreground">{DISTRICT_LABELS[d]}</span>
                      <span className="font-semibold text-foreground">{bd[d]}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetailItem(it)}>
                    View log
                  </Button>
                  {canManage && (
                    <Button size="sm" className="flex-1 gap-1.5" disabled={remaining <= 0} onClick={() => { resetDist(); setDistItem(it); }}>
                      <Send className="h-3.5 w-3.5" /> Distribute
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No inventory items found.</CardContent></Card>
        )}
      </div>

      {/* Distribute dialog */}
      <Dialog open={!!distItem} onOpenChange={(o) => !o && setDistItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute material</DialogTitle>
            <DialogDescription>{distItem?.name}</DialogDescription>
          </DialogHeader>
          {distItem && (
            <form onSubmit={submitDist} className="space-y-3">
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                Remaining stock: <span className="font-semibold text-foreground">{totals(distItem).remaining.toLocaleString()} {distItem.unit}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>District</Label>
                  <Select value={district} onValueChange={(v) => setDistrict(v as District)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>{DISTRICT_LABELS[d]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" type="number" min={1} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec">Recipient (branch / person)</Label>
                <Input id="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Mekelle hub manager" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dnote">Note (optional)</Label>
                <Textarea id="dnote" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDistItem(null)}>Cancel</Button>
                <Button type="submit">Record distribution</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail / log dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailItem?.name}</DialogTitle>
            <DialogDescription>Distribution log</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {detailItem.distributions.length === 0 && (
                <p className="text-sm text-muted-foreground">No distributions recorded yet.</p>
              )}
              {[...detailItem.distributions].reverse().map((d) => {
                const u = users.find((x) => x.id === d.byUserId);
                return (
                  <div key={d.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge>{DISTRICT_LABELS[d.district]}</Badge>
                        <span className="font-semibold text-foreground">{d.quantity} {detailItem.unit}</span>
                        <span className="text-xs text-muted-foreground">{d.date}</span>
                      </div>
                      {d.recipient && <div className="mt-1 text-xs text-foreground">To: {d.recipient}</div>}
                      {d.note && <div className="mt-0.5 text-xs text-muted-foreground">{d.note}</div>}
                      {u && <div className="mt-1 text-[11px] text-muted-foreground">By {u.name}</div>}
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { removeDist(detailItem.id, d.id); toast.success("Removed"); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* ── DISTRIBUTION PLACES TAB (director only) ── */}
        {user.role === "director" && (
          <TabsContent value="places" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Manage the places where marketing materials are distributed.</p>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={placeSearch} onChange={(e) => setPlaceSearch(e.target.value)} placeholder="Search places…" className="pl-8 w-56" />
                </div>
                <Dialog open={placeOpen} onOpenChange={(o) => { if (!o) { resetPlace(); } setPlaceOpen(o); }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="h-4 w-4" />Add Place</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingPlace ? "Edit distribution place" : "New distribution place"}</DialogTitle>
                      <DialogDescription>A location where marketing materials are sent.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitPlace} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="pname">Name *</Label>
                        <Input id="pname" value={placeName} onChange={(e) => setPlaceName(e.target.value)} required placeholder="e.g. Mekelle Hub" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>District *</Label>
                        <Select value={placeDistrict} onValueChange={(v) => setPlaceDistrict(v as District)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{DISTRICT_LABELS[d]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="paddr">Address</Label>
                        <Input id="paddr" value={placeAddress} onChange={(e) => setPlaceAddress(e.target.value)} placeholder="Street / kebele" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="pcontact">Contact person</Label>
                          <Input id="pcontact" value={placeContact} onChange={(e) => setPlaceContact(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pphone">Phone</Label>
                          <Input id="pphone" value={placePhone} onChange={(e) => setPlacePhone(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pnote">Note</Label>
                        <Textarea id="pnote" value={placeNote} onChange={(e) => setPlaceNote(e.target.value)} rows={2} />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => { resetPlace(); setPlaceOpen(false); }}>Cancel</Button>
                        <Button type="submit">{editingPlace ? "Save changes" : "Add place"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Places grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {distributionPlaces
                .filter((p) => !placeSearch.trim() || p.name.toLowerCase().includes(placeSearch.toLowerCase()) || DISTRICT_LABELS[p.district].toLowerCase().includes(placeSearch.toLowerCase()))
                .map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <Badge variant="secondary" className="text-[10px]">{DISTRICT_LABELS[p.district]}</Badge>
                          </div>
                          <h3 className="mt-1.5 text-base font-semibold text-foreground">{p.name}</h3>
                          {p.address && <p className="mt-0.5 text-xs text-muted-foreground">{p.address}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPlace(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Delete "${p.name}"?`)) { deletePlace(p.id); toast.success("Deleted"); } }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {(p.contactPerson || p.contactPhone) && (
                        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                          {p.contactPerson && <div>Contact: <span className="font-medium text-foreground">{p.contactPerson}</span></div>}
                          {p.contactPhone && <div>Phone: <span className="font-medium text-foreground">{p.contactPhone}</span></div>}
                        </div>
                      )}
                      {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                    </CardContent>
                  </Card>
                ))}
              {distributionPlaces.length === 0 && (
                <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No distribution places added yet.</CardContent></Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
