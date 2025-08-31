import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, Shield, FileText } from "lucide-react";
import { AnalysisRecord, FamiliesResponse, TagsResponse } from "@/types/api";
import ApiClient from "@/lib/api";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import { toast } from "@/hooks/use-toast";

interface EditRecordFormProps {
    record: AnalysisRecord;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<AnalysisRecord>) => Promise<void>;
}

export default function EditRecordForm({ record, isOpen, onClose, onSubmit }: EditRecordFormProps) {
    const { config } = useEngineConfig();
    const apiClient = new ApiClient(config);

    // Safely handle record.tags in initial state
    const initialTags = Array.isArray(record?.tags) ? record.tags.map(tag => tag.id.toString()) : [];

    const [editForm, setEditForm] = useState({
        file_name: record?.file_name || "",
        description: record?.description || "",
        family_id: record?.family?.id?.toString() || "none",
        tags: initialTags,
    });

    const { data: familiesData, isLoading: isFamiliesLoading, error: familiesError } = useQuery({
        queryKey: ['families'],
        queryFn: () => apiClient.getFamilies(),
    });

    const { data: tagsData, isLoading: isTagsLoading, error: tagsError } = useQuery({
        queryKey: ['tags'],
        queryFn: () => apiClient.getTags(),
    });

    const handleEditFormChange = (field: string, value: string | string[]) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleTagToggle = (tagId: string) => {
        setEditForm((prev) => ({
            ...prev,
            tags: prev.tags.includes(tagId)
                ? prev.tags.filter(id => id !== tagId)
                : [...prev.tags, tagId],
        }));
    };

    const handleSubmit = async () => {
        try {
            const familiesArray = Array.isArray(familiesData)
                ? familiesData
                : Array.isArray(familiesData?.families)
                    ? familiesData.families
                    : [];

            const selectedFamily = editForm.family_id === "none"
                ? undefined
                : familiesArray.find(f => f.id.toString() === editForm.family_id);

            const selectedTags = Array.isArray(tagsData?.tags)
                ? tagsData.tags.filter(t => editForm.tags.includes(t.id.toString()))
                : [];

            const payload: Partial<AnalysisRecord> = {
                file_name: editForm.file_name,
                description: editForm.description,
                family: selectedFamily ? { id: selectedFamily.id, name: selectedFamily.name, description: selectedFamily.description } : undefined,
                tags: selectedTags,
                family_id: selectedFamily ? selectedFamily.id : undefined,
            };

            await onSubmit(payload);
            toast({ title: "Record updated successfully", description: `Changes to ${editForm.file_name} saved.` });
            onClose();
        } catch (error: any) {
            toast({
                title: "Failed to update record",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Normalize families to avoid map errors
    const familiesArray = Array.isArray(familiesData)
        ? familiesData
        : Array.isArray(familiesData?.families)
            ? familiesData.families
            : [];

    const tagsArray = Array.isArray(tagsData?.tags) ? tagsData.tags : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Edit Analysis Record
                    </DialogTitle>
                    <DialogDescription>
                        Modify the details of the analysis record, including file name, family, tags, and description.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {record ? (
                        <div className="grid gap-6">
                            {/* File Name */}
                            <div>
                                <Label htmlFor="file_name" className="text-sm font-medium flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    File Name
                                </Label>
                                <Input
                                    id="file_name"
                                    value={editForm.file_name}
                                    onChange={(e) => handleEditFormChange("file_name", e.target.value)}
                                    placeholder="Enter file name"
                                    className="mt-1"
                                />
                            </div>

                            {/* Family Selection */}
                            <div>
                                <Label htmlFor="family_id" className="text-sm font-medium flex items-center gap-1">
                                    <Shield className="h-4 w-4" />
                                    Family
                                </Label>
                                {isFamiliesLoading ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading families...</span>
                                    </div>
                                ) : familiesError ? (
                                    <div className="text-destructive text-sm mt-1">Error loading families</div>
                                ) : (
                                    <Select
                                        value={editForm.family_id}
                                        onValueChange={(value) => handleEditFormChange("family_id", value)}
                                    >
                                        <SelectTrigger id="family_id" className="mt-1">
                                            <SelectValue placeholder="Select a family" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key="none" value="none">No Family</SelectItem>
                                            {familiesArray.map((family) => (
                                                <SelectItem key={family.id} value={family.id.toString()}>
                                                    {family.name} {family.description && `(${family.description})`}
                                                </SelectItem>
                                            ))}
                                            {familiesArray.length === 0 && (
                                                <div className="text-muted-foreground text-sm px-2">No families available</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Tags Selection */}
                            <div>
                                <Label className="text-sm font-medium flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    Tags
                                </Label>
                                {isTagsLoading ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading tags...</span>
                                    </div>
                                ) : tagsError ? (
                                    <div className="text-destructive text-sm mt-1">Error loading tags</div>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {tagsArray.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant={editForm.tags.includes(tag.id.toString()) ? "default" : "outline"}
                                                className="cursor-pointer px-3 py-1"
                                                onClick={() => handleTagToggle(tag.id.toString())}
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                        {tagsArray.length === 0 && (
                                            <div className="text-muted-foreground text-sm">No tags available</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={editForm.description}
                                    onChange={(e) => handleEditFormChange("description", e.target.value)}
                                    placeholder="Enter description"
                                    className="mt-1 min-h-[100px]"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No record data available
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isFamiliesLoading || isTagsLoading || !!familiesError || !!tagsError || !record}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
