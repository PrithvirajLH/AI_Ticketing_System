import { getSupabase } from "@/lib/db/supabase";
import type { ToolResult } from "../types";

interface DepartmentInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  assignmentStrategy: string;
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  children: CategoryNode[];
}

interface RoutingRuleInfo {
  id: string;
  name: string;
  keywords: string[];
  teamId: string;
  teamName: string;
  priority: number;
  assigneeId: string | null;
}

export async function getDepartments(): Promise<ToolResult<DepartmentInfo[]>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("Team")
      .select("id, name, slug, description, assignmentStrategy")
      .eq("isActive", true)
      .order("name");

    if (error) {
      return { success: false, error: `Failed to fetch departments: ${error.message}` };
    }

    return { success: true, data: data ?? [] };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch departments: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function getCategories(): Promise<ToolResult<CategoryNode[]>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("Category")
      .select("id, name, slug, description, parentId")
      .eq("isActive", true)
      .order("name");

    if (error) {
      return { success: false, error: `Failed to fetch categories: ${error.message}` };
    }

    // Build tree
    const categoryMap = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const cat of data ?? []) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    for (const node of categoryMap.values()) {
      if (node.parentId && categoryMap.has(node.parentId)) {
        categoryMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { success: true, data: roots };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch categories: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function getRoutingRules(): Promise<ToolResult<RoutingRuleInfo[]>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("RoutingRule")
      .select("id, name, keywords, teamId, priority, assigneeId, Team:teamId ( name )")
      .eq("isActive", true)
      .order("priority");

    if (error) {
      return { success: false, error: `Failed to fetch routing rules: ${error.message}` };
    }

    const rules: RoutingRuleInfo[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      keywords: r.keywords as string[],
      teamId: r.teamId as string,
      teamName: (r.Team as { name: string } | null)?.name ?? "Unknown",
      priority: r.priority as number,
      assigneeId: r.assigneeId as string | null,
    }));

    return { success: true, data: rules };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch routing rules: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
