import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import ApiClient from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FolderTree,
  Search,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnalysisRecordsResponse, Family, Tag } from "@/types/api";
import Graph from "react-graph-vis";
import "vis-network/styles/vis-network.css";
import { Component } from "react";

// Error Boundary Component
class GraphErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-center py-8 text-destructive">Error rendering graph</div>;
    }
    return this.props.children;
  }
}

interface FamilyFormData {
  id?: number;
  name: string;
  description: string;
}

interface TagFormData {
  id?: number;
  name: string;
  description: string;
}

function ThreatTaxonomy() {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [familyDialog, setFamilyDialog] = useState<{ open: boolean; data: FamilyFormData | null }>({
    open: false,
    data: null,
  });
  const [tagDialog, setTagDialog] = useState<{ open: boolean; data: TagFormData | null }>({
    open: false,
    data: null,
  });

  // Fetch families, tags, and records
  const { data: familiesData, isLoading: isFamiliesLoading, error: familiesError } = useQuery({
    queryKey: ["families"],
    queryFn: () => apiClient.getFamilies(),
  });

  const { data: tagsData, isLoading: isTagsLoading, error: tagsError } = useQuery({
    queryKey: ["tags"],
    queryFn: () => apiClient.getTags(),
  });

  const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
    queryKey: ["analysis-records"],
    queryFn: () => apiClient.getAnalysisRecords(),
  });

  // Log input data for debugging
  useEffect(() => {
    console.log("Input data:", {
      families: familiesData?.families?.length,
      tags: tagsData?.tags?.length,
      records: recordsData?.records?.length,
    });
  }, [familiesData, tagsData, recordsData]);

  // Mutations for create/update
  const createFamilyMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => apiClient.createFamily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({ title: "Family created", description: "New family added successfully." });
      setFamilyDialog({ open: false, data: null });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create family", description: error.message, variant: "destructive" });
    },
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; description: string }) =>
      apiClient.updateFamily(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({ title: "Family updated", description: "Family details updated successfully." });
      setFamilyDialog({ open: false, data: null });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update family", description: error.message, variant: "destructive" });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => apiClient.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Tag created", description: "New tag added successfully." });
      setTagDialog({ open: false, data: null });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create tag", description: error.message, variant: "destructive" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; description: string }) =>
      apiClient.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Tag updated", description: "Tag details updated successfully." });
      setTagDialog({ open: false, data: null });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update tag", description: error.message, variant: "destructive" });
    },
  });

  // Filter families and tags
  const filteredFamilies = Array.isArray(familiesData?.families)
    ? familiesData.families.filter(
        (family) =>
          family.name.toLowerCase().includes(search.toLowerCase()) ||
          family.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const filteredTags = Array.isArray(tagsData?.tags)
    ? tagsData.tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(search.toLowerCase()) ||
          tag.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Get associated records with validation
  const getAssociatedRecords = useCallback(
    (familyId?: number, tagId?: number) => {
      if (!recordsData || !Array.isArray(recordsData.records)) {
        console.warn("recordsData.records is not an array:", recordsData?.records);
        return [];
      }

      const filtered = recordsData.records.filter((record) => {
        if (!record.sha256 || !record.file_name) {
          console.warn(`Invalid record:`, record);
          return false;
        }
        if (familyId) {
          if (typeof record.family_id !== "number") {
            console.warn(`Invalid family_id for record ${record.sha256}:`, record.family_id);
            return false;
          }
          const match = record.family_id === familyId;
          console.log(`Checking family_id ${familyId} for record ${record.sha256}: ${match}`);
          return match;
        }
        if (tagId) {
          if (!Array.isArray(record.tags)) {
            console.warn(`Tags for record ${record.sha256} is not an array:`, record.tags);
            return false;
          }
          const match = record.tags.some((tag) => tag.id === tagId);
          console.log(`Checking tag_id ${tagId} for record ${record.sha256}: ${match}`);
          return match;
        }
        return false;
      });

      console.log(`Associated records for familyId=${familyId}, tagId=${tagId}:`, filtered.length);
      return filtered;
    },
    [recordsData]
  );

  // Generate nodes and edges for vis.js
  const generateGraphData = useCallback(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Add family nodes with initial positions
    filteredFamilies.forEach((family: Family, index: number) => {
      nodes.push({
        id: `family-${family.id}`,
        label: family.name,
        shape: "box",
        color: { background: "#bfdbfe", border: "#3b82f6" },
        title: family.description,
        level: 0,
        x: 100 + index * 800, // Large spacing
        y: 100,
        fixed: { x: true, y: true }, // Fixed by default
        data: { type: "family", id: family.id, name: family.name, description: family.description },
      });
    });

    // Add tag nodes with initial positions
    filteredTags.forEach((tag: Tag, index: number) => {
      nodes.push({
        id: `tag-${tag.id}`,
        label: tag.name,
        shape: "box",
        color: { background: "#bbf7d0", border: "#16a34a" },
        title: tag.description,
        level: 1,
        x: 100 + index * 800, // Large spacing
        y: 400,
        fixed: { x: true, y: true }, // Fixed by default
        data: { type: "tag", id: tag.id, name: tag.name, description: tag.description },
      });
    });

    // Collect unique records
    const uniqueRecords = new Map<string, any>();
    filteredFamilies.forEach((family) => {
      getAssociatedRecords(family.id).forEach((record) => {
        if (!uniqueRecords.has(record.sha256)) {
          uniqueRecords.set(record.sha256, record);
        }
      });
    });
    filteredTags.forEach((tag) => {
      getAssociatedRecords(undefined, tag.id).forEach((record) => {
        if (!uniqueRecords.has(record.sha256)) {
          uniqueRecords.set(record.sha256, record);
        }
      });
    });

    // Add unique record nodes with initial positions
    Array.from(uniqueRecords.values()).forEach((record, index) => {
      nodes.push({
        id: `record-${record.sha256}`,
        label: `${record.file_name} (${record.sha256.substring(0, 12)}...)`,
        shape: "box",
        color: { background: "#e5e7eb", border: "#6b7280" },
        title: record.sha256,
        level: 2,
        x: 100 + index * 800, // Large spacing
        y: 700,
        fixed: { x: true, y: true }, // Fixed by default
        data: { type: "record", sha256: record.sha256 },
      });
    });

    // Add edges from families to records
    filteredFamilies.forEach((family: Family) => {
      getAssociatedRecords(family.id).forEach((record) => {
        const edge = {
          from: `family-${family.id}`,
          to: `record-${record.sha256}`,
          color: "#3b82f6",
          arrows: "to",
          length: 300,
          smooth: { type: "cubicBezier" },
        };
        console.log("Adding edge:", edge);
        edges.push(edge);
      });
    });

    // Add edges from tags to records
    filteredTags.forEach((tag: Tag) => {
      getAssociatedRecords(undefined, tag.id).forEach((record) => {
        const edge = {
          from: `tag-${tag.id}`,
          to: `record-${record.sha256}`,
          color: "#ff0072",
          arrows: "to",
          length: 300,
          smooth: { type: "cubicBezier" },
        };
        console.log("Adding edge:", edge);
        edges.push(edge);
      });
    });

    console.log("Generated graph data:", {
      nodes: nodes.length,
      edges: edges.length,
      nodePositions: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, level: n.level })),
    });
    return { nodes, edges };
  }, [filteredFamilies, filteredTags, getAssociatedRecords]);

  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  // Ref for the graph component
  const graphRef = useRef<any>(null);

  // Update graph data, preserving fixed positions
  useEffect(() => {
    if (isFamiliesLoading || isTagsLoading || isRecordsLoading) return;
    const newData = generateGraphData();
    setGraphData((prev) => {
      const updatedNodes = newData.nodes.map((newNode) => {
        const existingNode = prev.nodes.find((n) => n.id === newNode.id);
        if (existingNode?.fixed) {
          return {
            ...newNode,
            x: existingNode.x,
            y: existingNode.y,
            fixed: existingNode.fixed,
          };
        }
        return newNode;
      });
      return { nodes: updatedNodes, edges: newData.edges };
    });
  }, [isFamiliesLoading, isTagsLoading, isRecordsLoading, generateGraphData]);

  // vis.js options - Optimized for stability and clear visualization
  const options = useMemo(
    () => ({
      layout: {
        hierarchical: {
          enabled: true,
          direction: "LR",
          sortMethod: "directed",
          nodeSpacing: 800, // Large spacing for clarity
          levelSeparation: 500, // Large separation for clarity
          treeSpacing: 800, // Large spacing for clarity
          blockShifting: false,
          edgeMinimization: false,
          parentCentralization: false,
        },
      },
      nodes: {
        shape: "box",
        size: 25, // Larger nodes for better visibility
        font: { size: 14 }, // Larger font for readability
        scaling: {
          min: 10,
          max: 30,
        },
      },
      edges: {
        smooth: { type: "cubicBezier", forceDirection: "horizontal" },
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      },
      physics: {
        enabled: false, // Disabled for stability
      },
      interaction: {
        dragNodes: true, // Enable dragging
        zoomView: true,
        dragView: true,
        zoomSpeed: 0.2,
        zoomMin: 0.05, // Allow zooming out further
        zoomMax: 3.0, // Allow zooming in further
        hover: true,
        multiselect: false,
      },
      height: "100%",
    }),
    []
  );

  // Event handlers for node interactions
  const events = useMemo(
    () => ({
      selectNode: ({ nodes }: { nodes: string[] }) => {
        if (nodes.length === 0) return;
        const nodeId = nodes[0];
        const node = graphData.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        console.log("Node selected:", nodeId);
        if (node.data.type === "family") {
          setFamilyDialog({
            open: true,
            data: {
              id: node.data.id,
              name: node.data.name,
              description: node.data.description,
            },
          });
        } else if (node.data.type === "tag") {
          setTagDialog({
            open: true,
            data: {
              id: node.data.id,
              name: node.data.name,
              description: node.data.description,
            },
          });
        } else if (node.data.type === "record") {
          navigate(`/file/${node.data.sha256}`);
        }
      },
      dragStart: ({ nodes }: { nodes: string[] }) => {
        console.log("Dragging node:", nodes);
        setGraphData((prev) => ({
          ...prev,
          nodes: prev.nodes.map((node) =>
            nodes.includes(node.id) ? { ...node, fixed: false } : node
          ),
        }));
      },
      dragEnd: ({ nodes }: { nodes: string[] }) => {
        if (nodes.length === 0) return;
        const network = graphRef.current?.Network;
        if (network) {
          network.storePositions();
          const positions = network.getPositions(nodes);
          console.log("Node positions saved:", positions);
          setGraphData((prev) => {
            const updated = {
              ...prev,
              nodes: prev.nodes.map((node) =>
                nodes.includes(node.id)
                  ? {
                      ...node,
                      fixed: { x: true, y: true },
                      x: typeof positions[node.id]?.x === "number" ? positions[node.id].x : node.x ?? 0,
                      y: typeof positions[node.id]?.y === "number" ? positions[node.id].y : node.y ?? 0,
                    }
                  : node
              ),
            };
            console.log("Updated graphData with fixed nodes:", updated.nodes.filter((n) => nodes.includes(n.id)));
            return updated;
          });
        }
      },
    }),
    [graphData, navigate]
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FolderTree className="h-8 w-8 text-primary" />
            </div>
            Threat Taxonomy
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Visual representation of malware families, tags, and their relationships
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {filteredFamilies.length} Families
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {filteredTags.length} Tags
          </Badge>
          {(familiesError || tagsError || isRecordsLoading) && (
            <Badge variant="destructive" className="gap-2 px-3 py-1">
              <AlertTriangle className="h-4 w-4" />
              {isRecordsLoading ? "Loading Records" : "Connection Error"}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Taxonomy Graph
          </CardTitle>
          <CardDescription>Visualize malware families, tags, and their associated records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search families or tags by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setFamilyDialog({ open: true, data: { name: "", description: "" } })}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Family
              </Button>
              <Button
                onClick={() => setTagDialog({ open: true, data: { name: "", description: "" } })}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Tag
              </Button>
            </div>
          </div>
          {(isFamiliesLoading || isTagsLoading || isRecordsLoading) ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading taxonomy...</p>
            </div>
          ) : (familiesError || tagsError) ? (
            <div className="text-center py-8 text-destructive">Error loading taxonomy</div>
          ) : (filteredFamilies.length > 0 || filteredTags.length > 0) ? (
            <GraphErrorBoundary>
              <div className="rounded-md border" style={{ height: "80vh", minHeight: "600px" }}>
                <Graph
                  ref={graphRef}
                  graph={graphData}
                  options={options}
                  events={events}
                  key={JSON.stringify(graphData.nodes.map((n) => n.id))}
                />
              </div>
            </GraphErrorBoundary>
          ) : (
            <div className="text-center py-8">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No families or tags found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={familyDialog.open}
        onOpenChange={(open) => setFamilyDialog({ open, data: open ? familyDialog.data : null })}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {familyDialog.data?.id ? "Edit Family" : "Create Family"}
            </DialogTitle>
            <DialogDescription>
              {familyDialog.data?.id
                ? "Update the details of the malware family."
                : "Add a new malware family to organize analysis records."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="family_name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="family_name"
                value={familyDialog.data?.name || ""}
                onChange={(e) =>
                  setFamilyDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data!, name: e.target.value },
                  }))
                }
                placeholder="Enter family name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="family_description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="family_description"
                value={familyDialog.data?.description || ""}
                onChange={(e) =>
                  setFamilyDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data!, description: e.target.value },
                  }))
                }
                placeholder="Enter family description"
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFamilyDialog({ open: false, data: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!familyDialog.data?.name) {
                  toast({ title: "Name is required", variant: "destructive" });
                  return;
                }
                if (familyDialog.data?.id) {
                  updateFamilyMutation.mutate({
                    id: familyDialog.data.id,
                    name: familyDialog.data.name,
                    description: familyDialog.data.description,
                  });
                } else {
                  createFamilyMutation.mutate({
                    name: familyDialog.data.name,
                    description: familyDialog.data.description,
                  });
                }
              }}
              disabled={createFamilyMutation.isPending || updateFamilyMutation.isPending}
            >
              {familyDialog.data?.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={tagDialog.open}
        onOpenChange={(open) => setTagDialog({ open, data: open ? tagDialog.data : null })}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{tagDialog.data?.id ? "Edit Tag" : "Create Tag"}</DialogTitle>
            <DialogDescription>
              {tagDialog.data?.id
                ? "Update the details of the tag."
                : "Add a new tag to label analysis records."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="tag_name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="tag_name"
                value={tagDialog.data?.name || ""}
                onChange={(e) =>
                  setTagDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data!, name: e.target.value },
                  }))
                }
                placeholder="Enter tag name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tag_description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="tag_description"
                value={tagDialog.data?.description || ""}
                onChange={(e) =>
                  setTagDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data!, description: e.target.value },
                  }))
                }
                placeholder="Enter tag description"
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTagDialog({ open: false, data: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!tagDialog.data?.name) {
                  toast({ title: "Name is required", variant: "destructive" });
                  return;
                }
                if (tagDialog.data?.id) {
                  updateTagMutation.mutate({
                    id: tagDialog.data.id,
                    name: tagDialog.data.name,
                    description: tagDialog.data.description,
                  });
                } else {
                  createTagMutation.mutate({
                    name: tagDialog.data.name,
                    description: tagDialog.data.description,
                  });
                }
              }}
              disabled={createTagMutation.isPending || updateTagMutation.isPending}
            >
              {tagDialog.data?.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ThreatTaxonomy;