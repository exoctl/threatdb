import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText,
  Shield,
  Hash,
  Code,
  ArrowLeft,
  Database,
  CheckCircle,
} from "lucide-react";
import { YaraRuleDetails, YaraRulesResponse } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

export default function YaraRuleDetails() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: yaraResponse, isLoading } = useQuery({
    queryKey: ['yara-rules'],
    queryFn: () => apiClient.getYaraRules() as Promise<YaraRulesResponse>,
  });

  const rule = yaraResponse?.rules?.find((r: YaraRuleDetails) => r.identifier === identifier);

  const enableRuleMutation = useMutation({
    mutationFn: (ruleName: string) => apiClient.enableYaraRule(ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yara-rules'] });
      toast({ title: "Success", description: "Rule enabled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to enable rule", variant: "destructive" });
    },
  });

  const disableRuleMutation = useMutation({
    mutationFn: (ruleName: string) => apiClient.disableYaraRule(ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yara-rules'] });
      toast({ title: "Success", description: "Rule disabled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disable rule", variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: "Text copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            YARA Rule Details
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Loading rule data...</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading rule details...</p>
        </div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="p-6">
        <div className="text-center py-8 space-y-4">
          <Database className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Rule Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The YARA rule "{identifier}" could not be found or the engine may not be running.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/yara')} className="h-10 flex items-center gap-2 border-l-4 border-l-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to YARA Rules
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/yara')}
          className="h-10 flex items-center gap-2 border-l-4 border-l-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            YARA Rule Details
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Detailed information about {rule.identifier}
          </p>
        </div>
      </div>

      {/* Rule Overview */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Rule Overview
          </CardTitle>
          <CardDescription>Basic rule information and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Badge
                  variant="default"
                  className="bg-clean text-white hover:bg-clean/90"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Identifier:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code
                        className="text-xs bg-muted px-2 py-1 rounded break-all max-w-64 cursor-pointer hover:bg-muted/80"
                        onClick={() => copyToClipboard(rule.identifier)}
                      >
                        {rule.identifier}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Atoms:</span>
                <span className="text-sm font-semibold">{rule.num_atoms}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Namespace:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code
                        className="text-xs bg-muted px-2 py-1 rounded break-all max-w-64 cursor-pointer hover:bg-muted/80"
                        onClick={() => copyToClipboard(rule.namespace)}
                      >
                        {rule.namespace}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Details */}
      <Card className="border-l-4 border-l-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Code className="h-5 w-5 text-accent" />
            Rule Details
          </CardTitle>
          <CardDescription>Detailed YARA rule specifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadata */}
          {rule.meta && Object.keys(rule.meta).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Metadata
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(rule.meta).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-medium text-sm text-muted-foreground min-w-24">
                        {key}:
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <code
                              className="font-mono text-sm bg-background px-2 py-1 rounded break-all cursor-pointer hover:bg-muted/80"
                              onClick={() => copyToClipboard(String(value))}
                            >
                              {String(value)}
                            </code>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to copy</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Strings */}
          {rule.strings && rule.strings.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Strings
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                {rule.strings.map((s, i) => (
                  <div
                    key={i}
                    className="border rounded-lg bg-background p-3 shadow-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Identifier:</span>{" "}
                        <code className="font-mono">{s.identifier}</code>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Length:</span>{" "}
                        <span className="font-mono">{s.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Index:</span>{" "}
                        <span className="font-mono">{s.index}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Flags:</span>{" "}
                        <span className="font-mono">{s.flags}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-muted-foreground">String:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <code
                              className="font-mono text-sm bg-muted px-2 py-1 rounded break-all mt-1 block cursor-pointer hover:bg-muted/80"
                              onClick={() => copyToClipboard(s.string)}
                            >
                              {s.string}
                            </code>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to copy</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Flags
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <code
                    className="font-mono text-sm bg-muted p-2 rounded break-all cursor-pointer hover:bg-muted/80"
                    onClick={() => copyToClipboard(String(rule.flags))}
                  >
                    {rule.flags}
                  </code>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to copy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Tags */}
          {rule.tags && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(rule.tags) ? (
                  rule.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="hover:bg-secondary/80">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  Object.keys(rule.tags).length === 0 ? (
                    <span className="text-sm text-muted-foreground">No tags defined</span>
                  ) : (
                    Object.entries(rule.tags).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="hover:bg-secondary/80">
                        {k}: {String(v)}
                      </Badge>
                    ))
                  )
                )}
              </div>
            </div>
          )}

          {/* Atoms Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Pattern Atoms
            </h3>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">{rule.num_atoms}</span>
              <span className="text-sm text-muted-foreground">atoms detected</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pattern atoms are the building blocks used by YARA for pattern matching and rule evaluation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}