import { useQuery } from "@tanstack/react-query";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Activity,
  Database,
  Shield,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  Settings,
  Lock
} from "lucide-react";

export default function Status() {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);

  const { data: version, isLoading: versionLoading, refetch: refetchVersion, isError: versionError } = useQuery({
    queryKey: ['engine-version'],
    queryFn: () => apiClient.getVersion(),
    refetchInterval: 10000,
  });

  const { data: engineStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['engine-status'],
    queryFn: () => apiClient.getEngineStatus(),
    refetchInterval: 10000,
  });

  const { data: recordsData, isLoading: recordsLoading, error } = useQuery({
    queryKey: ['analysis-records'],
    queryFn: () => apiClient.getAnalysisRecords(),
  });

  // Defensive fallback for records
  const records = Array.isArray(recordsData?.records)
    ? recordsData.records
    : [];

  const { data: yaraRules, isLoading: yaraLoading } = useQuery({
    queryKey: ['yara-rules'],
    queryFn: () => apiClient.getYaraRules(),
  });

  const { data: plugins, isLoading: pluginsLoading } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => apiClient.getPlugins(),
  });

  // Defensive fallback for plugins
  const pluginScriptsCount = Array.isArray(plugins?.plugins?.lua?.scripts)
    ? plugins.plugins.lua.scripts.length
    : 0;

  // Defensive fallback for engineStatus
  const isEngineRunning = engineStatus?.engine?.is_running ?? false;

  // Defensive fallback for YARA rules
  const yaraRulesCount = typeof yaraRules?.count === "number" ? yaraRules.count : 0;

  // Defensive fallback for version
  const isOnline = !versionError && !!version;

  // Defensive fallback for records stats
  const totalFiles = records.length;
  const maliciousFiles = records.filter(r => r.is_malicious).length;

  const handleRefresh = () => {
    refetchVersion();
    refetchStatus();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            Status
          </h1>
        <Button onClick={handleRefresh} disabled={versionLoading || statusLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(versionLoading || statusLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-clean" />
            ) : (
              <WifiOff className="h-5 w-5 text-malicious" />
            )}
            Connection Status
          </CardTitle>
          <CardDescription>
            Engine connectivity and endpoint information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Endpoint:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                  {config.baseUrl}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Host:</span>
                <span className="text-sm">{config.host}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Port:</span>
                <span className="text-sm">{config.port}</span>
              </div>
            </div>
            
            {version && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Version:</span>
                  <Badge variant="outline">v{version.version}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Major:</span>
                  <span className="text-sm">{version.major}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Minor:</span>
                  <span className="text-sm">{version.minor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Patch:</span>
                  <span className="text-sm">{version.patch}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engine Configuration */}
      {engineStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Engine Configuration
            </CardTitle>
            <CardDescription>
              Current engine settings and configuration details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Server Configuration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Server className="h-4 w-4" />
                  Server
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Running:</span>
                    <Badge variant={isEngineRunning ? "default" : "destructive"}>
                      {isEngineRunning ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Port:</span>
                    <span>{engineStatus.engine.server.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bind Address:</span>
                    <span className="truncate max-w-[100px]">{engineStatus.engine.server.bindaddr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Threads:</span>
                    <span>{engineStatus.engine.server.concurrency}</span>
                  </div>
                </div>
              </div>

              {/* Database Configuration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Database className="h-4 w-4" />
                  Database
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{engineStatus.engine.database.type}</Badge>
                  </div>
                  {engineStatus.engine.configuration.database && (
                    <>
                      <div className="flex justify-between">
                        <span>File:</span>
                        <span className="truncate max-w-[100px]">
                          {engineStatus.engine.configuration.database.file}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Path:</span>
                        <span className="truncate max-w-[100px]">
                          {engineStatus.engine.configuration.database.path}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Security Configuration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4" />
                  Security
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>SSL Enabled:</span>
                    <Badge variant={engineStatus.engine.server.ssl_enable ? "default" : "secondary"}>
                      {engineStatus.engine.server.ssl_enable ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {engineStatus.engine.configuration.server?.middleware?.cors && (
                    <div className="flex justify-between">
                      <span>CORS:</span>
                      <Badge variant={engineStatus.engine.configuration.server.middleware.cors.enable ? "default" : "secondary"}>
                        {engineStatus.engine.configuration.server.middleware.cors.enable ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Analyzed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {recordsLoading ? "Loading..." : "Total files"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Found</CardTitle>
            <Shield className="h-4 w-4 text-malicious" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-malicious">{maliciousFiles}</div>
            <p className="text-xs text-muted-foreground">
              {recordsLoading ? "Loading..." : "Malicious files"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YARA Rules</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yaraRulesCount}</div>
            <p className="text-xs text-muted-foreground">
              {yaraLoading ? "Loading..." : "Active rules"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pluginScriptsCount}</div>
            <p className="text-xs text-muted-foreground">
              {pluginsLoading ? "Loading..." : "Lua scripts"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engine Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Engine Health
          </CardTitle>
          <CardDescription>
            System status and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isEngineRunning ? 'bg-clean' : 'bg-malicious'}`} />
                <div>
                  <p className="font-medium">Engine Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isEngineRunning ? "Engine is running and processing requests" : "Engine is not running"}
                  </p>
                </div>
              </div>
              <Badge variant={isEngineRunning ? "default" : "destructive"}>
                {isEngineRunning ? "Running" : "Stopped"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-clean' : 'bg-malicious'}`} />
                <div>
                  <p className="font-medium">API Connectivity</p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? "All endpoints responding" : "Connection failed"}
                  </p>
                </div>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "Healthy" : "Error"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${pluginScriptsCount ? 'bg-clean' : 'bg-warning'}`} />
                <div>
                  <p className="font-medium">Plugin System</p>
                  <p className="text-sm text-muted-foreground">
                    {pluginScriptsCount} plugins loaded
                  </p>
                </div>
              </div>
              <Badge variant={pluginScriptsCount ? "default" : "destructive"}>
                {pluginScriptsCount ? "Running" : "No Plugins"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Last Updated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Status information was last refreshed at {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}