import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Shield,
  Hash,
  Search,
  Code,
  Filter,
  Database,
  Upload,
  Plus,
  Power,
  PowerOff,
  Download,
  Eye,
  AlertTriangle
} from "lucide-react";
import { YaraRuleDetails } from "@/types/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function YaraRules() {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [newRuleContent, setNewRuleContent] = useState("");
  const [newRuleNamespace, setNewRuleNamespace] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const { data: yaraResponse, error, isLoading } = useQuery({
    queryKey: ["yara-rules"],
    queryFn: () => apiClient.getYaraRules(),
  });

  const rules: YaraRuleDetails[] = yaraResponse?.rules || [];

  const filteredRules = rules.filter(
    (rule) =>
      rule.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.namespace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enableRuleMutation = useMutation({
    mutationFn: (ruleName: string) => apiClient.enableYaraRule(ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yara-rules"] });
      toast({ title: "Success", description: "Rule enabled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to enable rule", variant: "destructive" });
    },
  });

  const disableRuleMutation = useMutation({
    mutationFn: (ruleName: string) => apiClient.disableYaraRule(ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yara-rules"] });
      toast({ title: "Success", description: "Rule disabled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disable rule", variant: "destructive" });
    },
  });

  const loadRuleMutation = useMutation({
    mutationFn: ({ rule, namespace }: { rule: string; namespace: string }) =>
      apiClient.loadYaraRule(rule, namespace),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yara-rules'] });
      toast({ title: "Success", description: "Rule compiled successfully" });
      setNewRuleContent("");
      setNewRuleNamespace("");
      setSelectedFile(null);
      setShowNewRuleDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to compile rule",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewRuleContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmitRule = () => {
    if (!newRuleContent.trim() || !newRuleNamespace.trim()) {
      toast({
        title: "Error",
        description: "Please provide both rule content and namespace",
        variant: "destructive"
      });
      return;
    }

    loadRuleMutation.mutate({
      rule: newRuleContent,
      namespace: newRuleNamespace
    });
  };

  const downloadCompiledRules = async () => {
    try {
      const response = await apiClient.getCompiledYaraRules();
      const blob = new Blob([response], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const linkElement = document.createElement("a");
      linkElement.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      linkElement.download = `yaragate_rules_${timestamp}.yarac`;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download compiled rules",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            Yara Rules
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Manage and monitor active YARA detection rules
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {filteredRules.length} of {rules.length} rules
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
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{yaraResponse?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Loaded YARA rules</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Namespaces</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(rules.map((r) => r.namespace)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique namespaces</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Atoms</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {rules.reduce((sum, r) => sum + r.num_atoms, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pattern atoms</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by rule name or namespace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rule Definitions
          </CardTitle>
          <CardDescription>
            Enable, disable, or view detailed YARA rules
          </CardDescription>
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 ml-auto">
            <Dialog open={showNewRuleDialog} onOpenChange={setShowNewRuleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New YARA Rule</DialogTitle>
                  <DialogDescription>
                    Upload a rule file or write a custom rule to compile
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="write">Write Rule</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="space-y-4">
                    <div>
                      <Label htmlFor="file">Upload YARA Rule File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".yar,.yara,.txt"
                        onChange={handleFileUpload}
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="namespace-upload">Namespace</Label>
                      <Input
                        id="namespace-upload"
                        value={newRuleNamespace}
                        onChange={(e) => setNewRuleNamespace(e.target.value)}
                        placeholder="e.g., webshell"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="write" className="space-y-4">
                    <div>
                      <Label htmlFor="rule-content">Rule Content</Label>
                      <Textarea
                        id="rule-content"
                        value={newRuleContent}
                        onChange={(e) => setNewRuleContent(e.target.value)}
                        placeholder="rule RuleName {
    strings:
        $text = &quot;malicious&quot;
    condition:
        $text
}"
                        className="h-40 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="namespace-write">Namespace</Label>
                      <Input
                        id="namespace-write"
                        value={newRuleNamespace}
                        onChange={(e) => setNewRuleNamespace(e.target.value)}
                        placeholder="e.g., webshell"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowNewRuleDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitRule}
                    disabled={loadRuleMutation.isPending}
                  >
                    {loadRuleMutation.isPending ? "Compiling..." : "Compile Rule"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={downloadCompiledRules}>
              <Download className="h-4 w-4 mr-2" />
              Download Compiled Rules
            </Button>
          </div>

        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading YARA rules...</p>
            </div>
          ) : filteredRules.length > 0 ? (
            <div className="rounded-md border overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Atoms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.identifier}>
                      <TableCell className="font-medium">{rule.identifier}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.namespace}</Badge>
                      </TableCell>
                      <TableCell>{rule.num_atoms}</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/yara/${encodeURIComponent(rule.identifier)}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => enableRuleMutation.mutate(rule.identifier)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => disableRuleMutation.mutate(rule.identifier)}
                          >
                            <PowerOff className="h-4 w-4" />
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
                {error
                  ? "Engine may not be running or unreachable"
                  : searchQuery
                    ? "No rules match your current filters"
                    : "No YARA rules found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
