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
  FileSearch,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, formatDate } from "@/lib/utils";
import EditRecordForm from "@/pages/EditRecordForm";
import { AnalysisRecord } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileSearch className="h-6 w-6 text-primary" />
        </div>
        Malware Analysis Report
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
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
        <div>
          <h2 className="text-xl font-semibold mb-2">{message.split(":")[0]}</h2>
          <p className="text-muted-foreground mb-4">{message}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/records")}
          className="h-10 flex items-center gap-2"
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/records")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Records
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Malware Analysis Report
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              SHA256: {record.sha256.substring(0, 16)}... | File: {record.file_name}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            File Analysis
          </CardTitle>
          <CardDescription>Comprehensive file analysis details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">File Overview</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <Badge
                      variant={record.is_malicious ? "destructive" : "success"}
                      className="items-center gap-1"
                    >
                      {record.is_malicious ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Malicious
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Clean
                        </>
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">File Type</TableCell>
                  <TableCell>{record.file_type.split(";")[0]}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">File Size</TableCell>
                  <TableCell>{formatFileSize(record.file_size)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Entropy</TableCell>
                  <TableCell>{record.file_entropy.toFixed(4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Packed</TableCell>
                  <TableCell>
                    <Badge variant={record.is_packed ? "destructive" : "outline"}>
                      {record.is_packed ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
                {record.description && (
                  <TableRow>
                    <TableCell className="font-medium">Description</TableCell>
                    <TableCell>{record.description}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Metadata</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">File Name</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code
                            className="cursor-pointer hover:underline"
                            onClick={() => copyToClipboard(record.file_name)}
                          >
                            {record.file_name}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>Click to copy</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Path</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code
                            className="cursor-pointer hover:underline"
                            onClick={() => copyToClipboard(record.file_path)}
                          >
                            {record.file_path}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>Click to copy</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Owner</TableCell>
                  <TableCell>{record.owner}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Created</TableCell>
                  <TableCell>{formatDate(record.creation_date)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Updated</TableCell>
                  <TableCell>{formatDate(record.last_update_date)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Cryptographic Hashes</h3>
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Hash Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code
                                className="font-mono text-xs break-all cursor-pointer hover:underline"
                                onClick={() => copyToClipboard(value)}
                              >
                                {value}
                              </code>
                            </TooltipTrigger>
                            <TooltipContent>Click to copy</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Threat Intelligence</h3>
            {threatsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading threat data...</p>
              </div>
            ) : threatsError ? (
              <div className="text-center py-8 space-y-2">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">Unable to load threat analysis</p>
              </div>
            ) : threats ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-md font-medium mb-2">ClamAV Results</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Virus Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{threats.clamav.virname || "None detected"}</TableCell>
                        <TableCell>
                          <Badge variant={threats.clamav.math_status === 0 ? "success" : "destructive"}>
                            {threats.clamav.math_status === 0 ? "Clean" : "Detected"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-2">YARA Rules</h4>
                  {threats.yara.rules.length > 0 ? (
                    <ScrollArea className="h-[300px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rule</TableHead>
                            <TableHead>Namespace</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {threats.yara.rules.map((rule, index) => (
                            <TableRow key={index}>
                              <TableCell>{rule.identifier}</TableCell>
                              <TableCell>{rule.namespace}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">Matched</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
                      <p className="text-sm text-muted-foreground">No YARA rules matched</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <CheckCircle className="h-12 w-12 mx-auto text-success" />
                <p className="text-muted-foreground">No threat data available</p>
              </div>
            )}
          </div>

          {(record.tags?.length > 0 || record.family) && (
            <div>
              <h3 className="text-lg font-medium mb-4">Tags & Malware Family</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {record.tags?.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Associated Tags</h4>
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
                  </div>
                )}

                {record.family && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Malware Family</h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Family Name</TableCell>
                          <TableCell>{record.family.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Family ID</TableCell>
                          <TableCell>{record.family.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Description</TableCell>
                          <TableCell>{record.family.description}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditRecordForm
        record={record}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}