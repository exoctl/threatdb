import { useQuery } from "@tanstack/react-query";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import { useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Server,
  Eye,
  Search,
  Upload,
  Clock,
  Zap,
  Code,
  Settings,
  RefreshCw,
  BarChart3,
  PieChart
} from "lucide-react";
import { AnalysisRecord } from "@/types/api";

export default function Dashboard() {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);
  const navigate = useNavigate();

  const { data: recordsResponse, isLoading: recordsLoading, error: recordsError } = useQuery({
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

  const { data: engineStatus } = useQuery({
    queryKey: ['engine-status'],
    queryFn: () => apiClient.getEngineStatus(),
  });

  const { data: plugins } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => apiClient.getPlugins(),
  });

  // Defensive fallbacks
  const records = Array.isArray(recordsResponse?.records) ? recordsResponse.records : [];
  const totalFiles = records.length;
  const maliciousFiles = records.filter(r => r.is_malicious).length;
  const cleanFiles = totalFiles - maliciousFiles;
  const detectionRate = totalFiles > 0 ? ((maliciousFiles / totalFiles) * 100).toFixed(1) : "0.0";
  const isEngineConnected = !versionError && version;
  const yaraRulesCount = yaraRules?.count || 0;
  const pluginScriptsCount = plugins?.plugins?.lua?.scripts?.length || 0;
  const isEngineRunning = engineStatus?.engine?.is_running ?? false;

  // Recent analysis data
  const recentAnalyses = records.slice(0, 8);

  // Threat statistics
  const last24Hours = records.filter(r => {
    const recordDate = new Date(r.last_update_date);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return recordDate >= yesterday;
  });

  const recentMalicious = last24Hours.filter(r => r.is_malicious).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Real-time malware analysis and threat detection overview
        </p>
      </div>

      {/* System Status Alert */}
      {!isEngineConnected && (
        <Card className="border-malicious/50 bg-malicious/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-malicious" />
              <div>
                <p className="font-semibold text-malicious">Engine Connection Lost</p>
                <p className="text-sm text-muted-foreground">
                  Unable to connect to threat analysis engine at {config.baseUrl}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="ml-auto">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analysis</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recordsError ? "Connection error" : "Files analyzed"}
            </p>
            <div className="flex items-center pt-1">
              <TrendingUp className="h-3 w-3 text-clean mr-1" />
              <span className="text-xs text-clean">+{last24Hours.length} today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-malicious">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-malicious" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-malicious">{maliciousFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recordsError ? "Connection error" : `${detectionRate}% detection rate`}
            </p>
            <div className="flex items-center pt-1">
              <AlertTriangle className="h-3 w-3 text-malicious mr-1" />
              <span className="text-xs text-malicious">+{recentMalicious} today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-clean">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-clean" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-clean">{cleanFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recordsError ? "Connection error" : "Safe files"}
            </p>
            <div className="flex items-center pt-1">
              <CheckCircle className="h-3 w-3 text-clean mr-1" />
              <span className="text-xs text-clean">+{last24Hours.length - recentMalicious} today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YARA Rules</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{yaraRulesCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {yaraError ? "Connection error" : "Active detection rules"}
            </p>
            <div className="flex items-center pt-1">
              <Zap className="h-3 w-3 text-warning mr-1" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Detection Analysis
          </CardTitle>
          <CardDescription>
            File analysis distribution and threat detection performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Malicious</span>
                <span className="font-mono">{maliciousFiles} ({detectionRate}%)</span>
              </div>
              <Progress value={parseFloat(detectionRate)} className="h-2" />
              <p className="text-xs text-muted-foreground">Files detected as threats</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Clean</span>
                <span className="font-mono">{cleanFiles} ({(100 - parseFloat(detectionRate)).toFixed(1)}%)</span>
              </div>
              <Progress value={100 - parseFloat(detectionRate)} className="h-2" />
              <p className="text-xs text-muted-foreground">Files marked as safe</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analysis Rate</span>
                <span className="font-mono">{totalFiles > 0 ? "100%" : "0%"}</span>
              </div>
              <Progress value={totalFiles > 0 ? 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground">Files successfully analyzed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Analysis Activity
            </CardTitle>
            <CardDescription>
              Latest file analysis results and threat detections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {recentAnalyses.length > 0 ? (
                recentAnalyses.map((record: AnalysisRecord) => (
                  <div key={record.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${record.is_malicious ? 'bg-malicious' : 'bg-clean'}`} />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium truncate max-w-64" title={record.file_name}>
                            {record.file_name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {record.file_type.split(';')[0]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(record.last_update_date)}
                          </span>
                          <span>{formatFileSize(record.file_size)}</span>
                          <code className="text-xs bg-muted px-1 rounded">
                            {record.sha256.substring(0, 8)}...
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/file/${record.sha256}`)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-3">
                  {recordsError ? (
                    <>
                      <Server className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Engine not connected</p>
                      <Button variant="outline" onClick={() => navigate('/settings')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Connection
                      </Button>
                    </>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">No analysis activity yet</p>
                      <Button onClick={() => navigate('/scanner')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Start Analysis
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Engine status and system components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isEngineConnected ? 'bg-clean' : 'bg-malicious'}`} />
                  <span className="text-sm font-medium">Engine API</span>
                </div>
                <Badge variant={isEngineConnected ? "default" : "destructive"}>
                  {isEngineConnected ? "Online" : "Offline"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isEngineRunning ? 'bg-clean' : 'bg-warning'}`} />
                  <span className="text-sm font-medium">Analysis Engine</span>
                </div>
                <Badge variant={isEngineRunning ? "default" : "secondary"}>
                  {isEngineRunning ? "Running" : "Stopped"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${yaraRulesCount > 0 ? 'bg-clean' : 'bg-warning'}`} />
                  <span className="text-sm font-medium">YARA Rules</span>
                </div>
                <Badge variant="outline">
                  {yaraRulesCount} loaded
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${pluginScriptsCount > 0 ? 'bg-clean' : 'bg-warning'}`} />
                  <span className="text-sm font-medium">Plugins</span>
                </div>
                <Badge variant="outline">
                  {pluginScriptsCount} scripts
                </Badge>
              </div>
            </div>

            {version && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Engine Version:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{version.version}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-32">{config.baseUrl}</code>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={() => navigate('/status')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Full Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and system operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button onClick={() => navigate('/scanner')} className="h-20 flex-col gap-2">
              <Search className="h-6 w-6" />
              <span>Scan Files</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/records')} className="h-20 flex-col gap-2">
              <Database className="h-6 w-6" />
              <span>View Records</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/yara')} className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>YARA Rules</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')} className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}