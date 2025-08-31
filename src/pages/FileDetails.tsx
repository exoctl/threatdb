import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  FileText,
  Hash,
  Code,
  AlertTriangle,
  CheckCircle,
  Shield,
  Tag,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, formatDate } from "@/lib/utils";
import EditRecordForm from "@/pages/EditRecordForm";
import { AnalysisRecord } from "@/types/api";

export default function FileDetails() {
  const { sha256 } = useParams<{ sha256: string }>();
  const navigate = useNavigate();
  const { config } = useEngineConfig();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const apiClient = new ApiClient(config);

  const { data: recordsResponse, isLoading: recordsLoading, error: recordsError, refetch } = useQuery({
    queryKey: ["analysis-records"],
    queryFn: () => apiClient.getAnalysisRecords(),
  });

  const { data: threatsResponse, isLoading: threatsLoading, error: threatsError } = useQuery({
    queryKey: ["threats", sha256],
    queryFn: () => apiClient.getThreats(sha256!),
    enabled: !!sha256,
  });

  const record = recordsResponse?.records?.find((r) => r.sha256 === sha256);
  const threats = threatsResponse?.threats;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: `${text} copied to clipboard` });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEditSubmit = async (data: Partial<AnalysisRecord>) => {
    try {
      await apiClient.updateRecord(sha256!, data);
      toast({ title: "Success", description: "Record updated successfully" });
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const renderLoading = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        File Analysis
      </h1>
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading analysis data...</p>
      </div>
    </div>
  );

  const renderError = (message: string) => (
    <div className="p-6">
      <div className="text-center py-8 space-y-4">
        <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold mb-2">{message.split(":")[0]}</h2>
          <p className="text-muted-foreground mb-4">{message}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/records")}
          className="h-10 flex items-center gap-2 border-l-4 border-l-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Records
        </Button>
      </div>
    </div>
  );

  if (recordsLoading) return renderLoading();
  if (recordsError) return renderError("Connection Error: Cannot connect to threat intelligence engine.");
  if (!record) return renderError(`File Not Found: The requested file with SHA256 hash ${sha256} was not found.`);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/records")}
          className="h-10 flex items-center gap-2 border-l-4 border-l-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            File Analysis
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Detailed analysis for {record.file_name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditModalOpen(true)}
          className="h-10 flex items-center gap-2 border-l-4 border-l-primary ml-auto"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            File Overview
          </CardTitle>
          <CardDescription>Key file details and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">File Properties</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Badge
                  variant={record.is_malicious ? "destructive" : "default"}
                  className={record.is_malicious ? "" : "bg-clean text-white"}
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
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">File Type:</span>
                <Badge variant="outline">{record.file_type.split(";")[0]}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">File Size:</span>
                <span className="text-sm">{formatFileSize(record.file_size)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Entropy:</span>
                <span className="text-sm">{record.file_entropy.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Packed:</span>
                <Badge variant={record.is_packed ? "destructive" : "outline"}>
                  {record.is_packed ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Metadata</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">File Name:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code
                        className="text-xs bg-muted px-2 py-1 rounded break-all max-w-64 cursor-pointer hover:bg-muted/80"
                        onClick={() => copyToClipboard(record.file_name)}
                      >
                        {record.file_name}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent>Click to copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Path:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code
                        className="text-xs bg-muted px-2 py-1 rounded break-all max-w-64 cursor-pointer hover:bg-muted/80"
                        onClick={() => copyToClipboard(record.file_path)}
                      >
                        {record.file_path}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent>Click to copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Owner:</span>
                <span className="text-sm">{record.owner}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Created:</span>
                <span className="text-sm">{formatDate(record.creation_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Last Updated:</span>
                <span className="text-sm">{formatDate(record.last_update_date)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {record.description && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Description
            </CardTitle>
            <CardDescription>Additional information about this file</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{record.description}</p>
          </CardContent>
        </Card>
      )}

      {record.family && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Malware Family
            </CardTitle>
            <CardDescription>Classification and description of the threat family</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Family Name:</span>
                  <Badge variant="outline">{record.family.name}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Family ID:</span>
                  <span className="text-sm">{record.family.id}</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Description:</span>
                <p className="text-sm">{record.family.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {record.tags?.length > 0 && (
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Tag className="h-5 w-5 text-accent" />
              Tags
            </CardTitle>
            <CardDescription>Associated tags for this file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="px-3 py-1">
                  {tag.name}
                  {tag.description && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">ℹ️</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tag.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-l-4 border-l-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Hash className="h-5 w-5 text-accent" />
            File Hashes
          </CardTitle>
          <CardDescription>Cryptographic hashes for file identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "TLSH", value: record.tlsh },
            { label: "SHA256", value: record.sha256 },
            { label: "SHA1", value: record.sha1 },
            { label: "SHA512", value: record.sha512 },
            { label: "SHA224", value: record.sha224 },
            { label: "SHA384", value: record.sha384 },
            { label: "SHA3-256", value: record.sha3_256 },
            { label: "SHA3-512", value: record.sha3_512 },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center p-3 rounded-lg border">
              <span className="text-sm font-medium text-muted-foreground">{label}:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <code
                      className="text-xs bg-muted px-3 py-1 rounded font-mono break-all max-w-84 cursor-pointer hover:bg-muted/80"
                      onClick={() => copyToClipboard(value)}
                    >
                      {value}
                    </code>
                  </TooltipTrigger>
                  <TooltipContent>Click to copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </CardContent>
      </Card>

      {threatsLoading ? (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Threat Analysis
            </CardTitle>
            <CardDescription>Threat intelligence analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading threat analysis...</p>
            </div>
          </CardContent>
        </Card>
      ) : threatsError ? (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Threat Analysis
            </CardTitle>
            <CardDescription>Threat intelligence analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-2">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Unable to load threat analysis data</p>
            </div>
          </CardContent>
        </Card>
      ) : threats ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-primary" />
                ClamAV Analysis
              </CardTitle>
              <CardDescription>ClamAV antivirus engine results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Virus Name</th>
                      <th className="px-4 py-2 text-left font-medium">Match Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-2">{threats.clamav.virname || "Not detected"}</td>
                      <td className="px-4 py-2">
                        <Badge variant={threats.clamav.math_status === 0 ? "outline" : "destructive"}>
                          {threats.clamav.math_status === 0 ? "Clean" : "Detected"}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Code className="h-5 w-5 text-accent" />
                YARA Analysis
              </CardTitle>
              <CardDescription>YARA rule matching results</CardDescription>
            </CardHeader>
            <CardContent>
              {threats.yara.rules.length > 0 ? (
                <div className="max-h-64 overflow-y-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Rule</th>
                        <th className="px-4 py-2 text-left font-medium">Namespace</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threats.yara.rules.map((rule, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{rule.identifier}</td>
                          <td className="px-4 py-2">{rule.namespace}</td>
                          <td className="px-4 py-2">
                            <Badge variant="destructive">Match</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto text-clean mb-2" />
                  <p className="text-sm text-muted-foreground">No YARA rules matched</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Threat Analysis
            </CardTitle>
            <CardDescription>Threat intelligence analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-clean" />
              <p className="text-muted-foreground">No threat analysis data available</p>
            </div>
          </CardContent>
        </Card>
      )}

      <EditRecordForm
        record={record}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}