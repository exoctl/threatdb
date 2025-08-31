import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import { useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Calendar,
  RefreshCw,
  Tag,
  Shield,
  Trash2,
} from "lucide-react";
import { AnalysisRecord } from "@/types/api";
import { toast } from "@/hooks/use-toast";

export default function Records() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "malicious" | "clean">("all");
  const [rescanningFiles, setRescanningFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recordsData, error, isLoading } = useQuery({
    queryKey: ['analysis-records'],
    queryFn: () => apiClient.getAnalysisRecords(),
  });

  const rescanMutation = useMutation({
    mutationFn: (sha256: string) => apiClient.rescanFile(sha256),
    onSuccess: (data, sha256) => {
      setRescanningFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(sha256);
        return newSet;
      });

      toast({ title: "Rescan started successfully", description: `File ${sha256} being worked.` });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['analysis-records'] });
      }, 2000);
    },
    onError: (error, sha256) => {
      setRescanningFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(sha256);
        return newSet;
      });

      toast({
        title: `Failed to start rescan: ${error.message}`, variant: "destructive",
        description: `Unable to start rescan of file ${sha256}.`
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (sha256: string) => apiClient.deleteRecord(sha256),
    onSuccess: (data, sha256) => {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(sha256);
        return newSet;
      });

      toast({ title: "Record deleted successfully", description: `File ${sha256} removed from database.` });

      queryClient.invalidateQueries({ queryKey: ['analysis-records'] });
    },
    onError: (error, sha256) => {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(sha256);
        return newSet;
      });

      toast({
        title: `Failed to delete record: ${error.message}`, variant: "destructive",
        description: `Unable to delete file ${sha256} from database.`
      });
    }
  });

  const handleRescan = (sha256: string) => {
    setRescanningFiles(prev => new Set(prev).add(sha256));
    rescanMutation.mutate(sha256);
  };

  const handleDelete = (sha256: string) => {
    setDeletingFiles(prev => new Set(prev).add(sha256));
    deleteMutation.mutate(sha256);
  };

  const records = Array.isArray(recordsData?.records)
    ? recordsData.records
    : [];

  // Filter and search records
  const filteredRecords = records.filter((record: AnalysisRecord) => {
    const matchesSearch = record.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sha256.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.file_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "malicious" && record.is_malicious) ||
      (filterStatus === "clean" && !record.is_malicious);

    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Database className="h-8 w-8 text-primary" />
            </div>
            Analysis Records
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Comprehensive file analysis history and threat intelligence database
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {filteredRecords.length} of {records.length} records
          </Badge>
          {error && (
            <Badge variant="destructive" className="gap-2 px-3 py-1">
              <AlertTriangle className="h-4 w-4" />
              Connection Error
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Files analyzed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-malicious">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-malicious" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-malicious">{records.filter(r => r.is_malicious).length}</div>
            <p className="text-xs text-muted-foreground">Malicious files</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-clean">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-clean" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-clean">{records.filter(r => !r.is_malicious).length}</div>
            <p className="text-xs text-muted-foreground">Safe files</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {records.length > 0 ? ((records.filter(r => r.is_malicious).length / records.length) * 100).toFixed(1) : "0.0"}%
            </div>
            <p className="text-xs text-muted-foreground">Threat detection</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by filename, hash, or file type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className={filterStatus === "all" ? "" : "border-muted-foreground/50"}
              >
                All Files
                <Badge variant="secondary" className="ml-2">
                  {records.length}
                </Badge>
              </Button>
              <Button
                variant={filterStatus === "malicious" ? "destructive" : "outline"}
                onClick={() => setFilterStatus("malicious")}
                className={filterStatus !== "malicious" ? "border-malicious/50 text-malicious hover:bg-malicious/10" : ""}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Threats
                <Badge variant="destructive" className="ml-2">
                  {records.filter(r => r.is_malicious).length}
                </Badge>
              </Button>
              <Button
                variant={filterStatus === "clean" ? "default" : "outline"}
                onClick={() => setFilterStatus("clean")}
                className={filterStatus === "clean" ? "bg-clean text-white hover:bg-clean/90" : "border-clean/50 text-clean hover:bg-clean/10"}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Clean
                <Badge variant={filterStatus === "clean" ? "secondary" : "outline"} className="ml-2">
                  {records.filter(r => !r.is_malicious).length}
                </Badge>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results Table */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Analysis Results
          </CardTitle>
          <CardDescription>
            Detailed view of all analyzed files with threat detection results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="rounded-md border overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>SHA256</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: AnalysisRecord) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge
                          variant={record.is_malicious ? "destructive" : "default"}
                          className={!record.is_malicious ? "bg-clean text-white hover:bg-clean/90" : ""}
                        >
                          {record.is_malicious ? (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Malicious
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Clean
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-48" title={record.file_name}>
                            {record.file_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.file_type.split(';')[0]}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(record.file_size)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {record.sha256.substring(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {record.family.id > 0 ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {record.family.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(record.creation_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/file/${record.sha256}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRescan(record.sha256)}
                            disabled={rescanningFiles.has(record.sha256) || deletingFiles.has(record.sha256)}
                            title="Rescan file"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${rescanningFiles.has(record.sha256) ? 'animate-spin' : ''}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.sha256)}
                            disabled={deletingFiles.has(record.sha256) || rescanningFiles.has(record.sha256)}
                            title="Delete record"
                          >
                            <Trash2
                              className={`h-4 w-4 ${deletingFiles.has(record.sha256) ? 'animate-pulse' : ''}`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Database className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {error ? "Engine may not be running or unreachable" :
                  searchQuery || filterStatus !== "all"
                    ? "No files match your current filters"
                    : "No analysis records found"
                }
              </p>
              {records.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Upload files in the Scanner to see analysis results here
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}