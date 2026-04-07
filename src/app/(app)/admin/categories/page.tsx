"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderTree, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadData() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const roots = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: (form.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
        description: form.get("description") || null,
        parentId: form.get("parentId") === "none" ? null : form.get("parentId"),
      }),
    });

    setDialogOpen(false);
    loadData();
  }

  if (isLoading) return <p className="text-muted-foreground">Loading categories...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Network Issues" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input id="description" name="description" placeholder="Brief description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <select
                  name="parentId"
                  defaultValue="none"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="none">None (root category)</option>
                  {roots.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full mt-2">Create Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {roots.map((root) => {
          const children = getChildren(root.id);
          return (
            <div key={root.id}>
              <Card>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-lg">
                      <FolderTree className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{root.name}</p>
                      {root.description ? (
                        <p className="text-sm text-muted-foreground">{root.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{root.slug}</Badge>
                    <Badge
                      variant="outline"
                      className={root.isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                    >
                      {root.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {children.length > 0 ? (
                <div className="ml-8 mt-1 space-y-1">
                  {children.map((child) => (
                    <Card key={child.id} className="border-l-2 border-indigo-500/30">
                      <CardContent className="pt-3 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm font-medium">{child.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono">{child.slug}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
