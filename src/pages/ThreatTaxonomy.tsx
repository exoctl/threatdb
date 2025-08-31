import { useState, startTransition } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Shield,
  Tag as TagIcon,
  FileText,
  Search,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnalysisRecordsResponse, Family, Tag } from "@/types/api";

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

export default function ThreatTaxonomy() {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [familySearch, setFamilySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [familyDialog, setFamilyDialog] = useState<{ open: boolean; data: FamilyFormData | null }>({
    open: false,
    data: null,
  });
  const [tagDialog, setTagDialog] = useState<{ open: boolean; data: TagFormData | null }>({
    open: false,
    data: null,
  });
  const [expandedFamilies, setExpandedFamilies] = useState<Set<number>>(new Set());
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());

  // Fetch families, tags, and records
  const { data: familiesData, isLoading: isFamiliesLoading, error: familiesError } = useQuery({
    queryKey: ['families'],
    queryFn: () => apiClient.getFamilies(),
  });

  const { data: tagsData, isLoading: isTagsLoading, error: tagsError } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(),
  });

  const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
    queryKey: ['analysis-records'],
    queryFn: () => apiClient.getAnalysisRecords(),
  });

  // Debug recordsData structure
  console.log("recordsData:", recordsData);

  // Mutations for create/update
  const createFamilyMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => apiClient.createFamily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
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
      queryClient.invalidateQueries({ queryKey: ['families'] });
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
      queryClient.invalidateQueries({ queryKey: ['tags'] });
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
      queryClient.invalidateQueries({ queryKey: ['tags'] });
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
          family.name.toLowerCase().includes(familySearch.toLowerCase()) ||
          family.description.toLowerCase().includes(familySearch.toLowerCase())
      )
    : [];

  const filteredTags = Array.isArray(tagsData?.tags)
    ? tagsData.tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
          tag.description.toLowerCase().includes(tagSearch.toLowerCase())
      )
    : [];

  // Get associated records
  const getAssociatedRecords = (familyId?: number, tagId?: number) => {
    // Ensure recordsData.records is an array
    if (!recordsData || !Array.isArray(recordsData.records)) {
      console.warn("recordsData.records is not an array:", recordsData?.records);
      return [];
    }

    return recordsData.records.filter((record) => {
      // Debug record.tags
      console.log(`Record ${record.sha256} tags:`, record.tags);

      if (familyId) return record.family_id === familyId;
      if (tagId) {
        // Ensure tags is an array before calling .some
        if (!Array.isArray(record.tags)) {
          console.warn(`Tags for record ${record.sha256} is not an array:`, record.tags);
          return false;
        }
        return record.tags.some((tag) => tag.id === tagId);
      }
      return false;
    });
  };

  const toggleExpandFamily = (id: number) => {
    setExpandedFamilies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleExpandTag = (id: number) => {
    setExpandedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleNavigate = (path: string) => {
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FolderTree className="h-8 w-8 text-primary" />
            </div>
            Threat Taxonomy
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Manage malware families and tags for analysis records
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

      {/* Families Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Malware Families
          </CardTitle>
          <CardDescription>Organize analysis records by malware family</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search families by name or description..."
                  value={familySearch}
                  onChange={(e) => setFamilySearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            <Button
              onClick={() => setFamilyDialog({ open: true, data: { name: "", description: "" } })}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Family
            </Button>
          </div>
          {isFamiliesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading families...</p>
            </div>
          ) : familiesError ? (
            <div className="text-center py-8 text-destructive">Error loading families</div>
          ) : filteredFamilies.length > 0 ? (
            <div className="rounded-md border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Associated Binaries</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilies.map((family: Family) => {
                    const associatedRecords = getAssociatedRecords(family.id);
                    return (
                      <>
                        <TableRow key={family.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              {family.name}
                            </div>
                          </TableCell>
                          <TableCell>{family.description || "N/A"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandFamily(family.id)}
                            >
                              {associatedRecords.length} Binaries
                              {expandedFamilies.has(family.id) ? (
                                <ChevronUp className="h-4 w-4 ml-2" />
                              ) : (
                                <ChevronDown className="h-4 w-4 ml-2" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFamilyDialog({
                                  open: true,
                                  data: { id: family.id, name: family.name, description: family.description },
                                })
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedFamilies.has(family.id) && (
                          <TableRow key={`expanded-family-${family.id}`}>
                            <TableCell colSpan={4}>
                              <div className="pl-6 py-2">
                                {associatedRecords.length > 0 ? (
                                  <ul className="list-disc text-sm text-muted-foreground">
                                    {associatedRecords.map((record) => (
                                      <li
                                        key={record.sha256}
                                        className="cursor-pointer hover:text-primary"
                                        onClick={() => handleNavigate(`/file/${record.sha256}`)}
                                      >
                                        {record.file_name} ({record.sha256.substring(0, 12)}...)
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No associated binaries</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No families found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Tags
          </CardTitle>
          <CardDescription>Label analysis records with descriptive tags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tags by name or description..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            <Button
              onClick={() => setTagDialog({ open: true, data: { name: "", description: "" } })}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          </div>
          {isTagsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading tags...</p>
            </div>
          ) : tagsError ? (
            <div className="text-center py-8 text-destructive">Error loading tags</div>
          ) : filteredTags.length > 0 ? (
            <div className="rounded-md border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Associated Binaries</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map((tag: Tag) => {
                    const associatedRecords = getAssociatedRecords(undefined, tag.id);
                    return (
                      <>
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <TagIcon className="h-4 w-4 text-muted-foreground" />
                              {tag.name}
                            </div>
                          </TableCell>
                          <TableCell>{tag.description || "N/A"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandTag(tag.id)}
                            >
                              {associatedRecords.length} Binaries
                              {expandedTags.has(tag.id) ? (
                                <ChevronUp className="h-4 w-4 ml-2" />
                              ) : (
                                <ChevronDown className="h-4 w-4 ml-2" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTagDialog({
                                  open: true,
                                  data: { id: tag.id, name: tag.name, description: tag.description },
                                })
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedTags.has(tag.id) && (
                          <TableRow key={`expanded-tag-${tag.id}`}>
                            <TableCell colSpan={4}>
                              <div className="pl-6 py-2">
                                {associatedRecords.length > 0 ? (
                                  <ul className="list-disc text-sm text-muted-foreground">
                                    {associatedRecords.map((record) => (
                                      <li
                                        key={record.sha256}
                                        className="cursor-pointer hover:text-primary"
                                        onClick={() => handleNavigate(`/file/${record.sha256}`)}
                                      >
                                        {record.file_name} ({record.sha256.substring(0, 12)}...)
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No associated binaries</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <TagIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No tags found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Dialog */}
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

      {/* Tag Dialog */}
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