import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  Shield, 
  Loader2,
  X,
  Database,
  FileText,
  CheckCircle,
  AlertTriangle,
  Activity,
  Server,
  Search
} from "lucide-react";
import { ScanResponse, AnalysisRecord } from "@/types/api";

export default function Scanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Dashboard stats
  const { data: records, error: recordsError } = useQuery({
    queryKey: ['analysis-records'],
    queryFn: () => apiClient.getAnalysisRecords(),
  });

  const { data: version, error: versionError } = useQuery({
    queryKey: ['engine-version'],
    queryFn: () => apiClient.getVersion(),
  });

  const { data: yaraRules, error: yaraError } = useQuery({
    queryKey: ['yara-rules'],
    queryFn: () => apiClient.getYaraRules(),
  });

  // Defensive fallback for records
  const recordsArray = Array.isArray(records?.records)
    ? records.records
    : [];

  const totalFiles = recordsArray.length;
  const maliciousFiles = recordsArray.filter(r => r.is_malicious).length;
  const cleanFiles = totalFiles - maliciousFiles;
  const recentAnalyses = recordsArray.slice(0, 5);
  const isEngineConnected = !versionError && version;

  // Scanner mutation
  const scanMutation = useMutation({
    mutationFn: (file: File) => apiClient.scanFile(file),
    onSuccess: (result: ScanResponse) => {
      queryClient.invalidateQueries({ queryKey: ['analysis-records'] });
      toast({
        title: "Scan completed",
        description: `File submitted for analysis. SHA256: ${result.sha256}`,
      });
      setTimeout(() => {
        navigate(`/file/${result.sha256}`);
      }, 1200);
    },
    onError: (error) => {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to scan",
        variant: "destructive",
      });
      return;
    }
    scanMutation.mutate(selectedFile);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const removeFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Search className="h-8 w-8 text-primary" />
            </div>
            Binary Scanner
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Advanced malware analysis and threat detection engine
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={isEngineConnected ? "default" : "destructive"} className="gap-2 px-3 py-1">
            {isEngineConnected ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Engine Online
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Engine Offline
              </>
            )}
          </Badge>
          {version && (
            <Badge variant="outline" className="px-3 py-1">
              v{version.version}
            </Badge>
          )}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recordsError ? "Connection error" : "Files analyzed"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-malicious">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-malicious" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-malicious">{maliciousFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recordsError ? "Connection error" : "Detected threats"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-clean">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean</CardTitle>
            <CheckCircle className="h-4 w-4 text-clean" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-clean">{cleanFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recordsError ? "Connection error" : "Safe files"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YARA Rules</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{yaraRules?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {yaraError ? "Connection error" : "Active rules"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Scanner + Recent Analysis + Engine Status */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Scanner Card */}
        <Card className="border bg-gradient-to-br from-background to-muted/20 md:col-span-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center gap-3 justify-center text-3xl font-bold">
              Threat Analysis Engine
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Upload files for comprehensive malware analysis and threat detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 bg-background ${
                isDragOver 
                  ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                  : 'border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/10'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="*/*"
                tabIndex={-1}
                style={{ zIndex: 2 }}
              />
              {selectedFile ? (
                <div className="space-y-6 pointer-events-none">
                  <div className="flex items-center justify-center">
                    <div className="bg-clean/10 p-4 rounded-full border-2 border-clean/20">
                      <Upload className="h-12 w-12 text-clean" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-semibold break-all">{selectedFile.name}</p>
                    <div className="flex items-center justify-center gap-4 text-muted-foreground">
                      <span className="text-lg">{formatFileSize(selectedFile.size)}</span>
                      <Badge variant="outline" className="text-sm">
                        {selectedFile.type || 'Unknown type'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={removeFile}
                      className="mt-4 pointer-events-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pointer-events-none">
                  <div className="flex items-center justify-center">
                    <div className="bg-muted/50 p-4 rounded-full">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-2xl font-semibold">Drop your binary here</p>
                    <p className="text-lg text-muted-foreground">
                      or click to browse files from your computer
                    </p>
                    <div className="text-sm text-muted-foreground">
                      Supported formats: All file types • Max size: 500MB
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center space-y-2">
              <Button 
                onClick={handleScan} 
                disabled={scanMutation.isPending || !selectedFile}
                className="w-full"
                size="lg"
              >
                {scanMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing File...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Analyze File
                  </>
                )}
              </Button>
              {selectedFile && (
                <Badge variant="outline" className="mt-2">
                  Ready to scan: {selectedFile.name}
                </Badge>
              )}
              {scanMutation.isPending && (
                <Progress value={undefined} className="w-full mt-2" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Analysis
            </CardTitle>
            <CardDescription>
              Latest file analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.length > 0 ? (
                recentAnalyses.map((record: AnalysisRecord) => (
                  <div key={record.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        record.is_malicious ? 'bg-malicious' : 'bg-clean'
                      }`} />
                      <div>
                        <p className="text-sm font-medium truncate max-w-32">
                          {record.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.last_update_date}
                        </p>
                      </div>
                    </div>
                    <Badge variant={record.is_malicious ? "destructive" : "default"}>
                      {record.is_malicious ? "Malicious" : "Clean"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 space-y-2">
                  {recordsError ? (
                    <>
                      <Server className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Engine not connected
                      </p>
                    </>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No recent analysis found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upload files to see activity
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}