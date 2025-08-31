import { useState } from "react";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Server,
  Save,
  RotateCcw,
  TestTube,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";

export default function Settings() {
  const { config, updateConfig } = useEngineConfig();
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(config.port);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Test connection with current settings
  const testConfig = { ...config, host, port, baseUrl: `http://${host}:${port}` };
  const testApiClient = new ApiClient(testConfig);

  const handleSave = () => {
    updateConfig({ host, port });
    toast({
      title: "Settings saved",
      description: "Engine configuration has been updated successfully.",
    });
  };

  const handleReset = () => {
    const defaultHost = '127.0.0.1';
    const defaultPort = '8081';
    setHost(defaultHost);
    setPort(defaultPort);
    updateConfig({ host: defaultHost, port: defaultPort });
    toast({
      title: "Settings reset",
      description: "Configuration has been reset to default values.",
    });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testApiClient.getVersion();
      toast({
        title: "Connection successful",
        description: "Successfully connected to the engine.",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `Unable to connect to engine: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const hasChanges = host !== config.host || port !== config.port;
  const isValidConfig = host.trim() && port.trim() && !isNaN(Number(port));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure engine connection and system preferences
        </p>
      </div>

      {/* Cards lado a lado */}
      <div className="flex gap-6">
        {/* Engine Configuration */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Engine Configuration
            </CardTitle>
            <CardDescription>
              Configure the connection to your threat analysis engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="host">Host Address</Label>
                <Input
                  id="host"
                  placeholder="127.0.0.1"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  IP address or hostname of the engine server
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="8081"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Port number where the engine is listening
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Endpoint:</span>
                <Badge variant="outline" className="font-mono">
                  {config.baseUrl}
                </Badge>
              </div>
              {hasChanges && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">New Endpoint:</span>
                  <Badge variant="secondary" className="font-mono">
                    http://{host}:{port}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || !isValidConfig}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>

              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !isValidConfig}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Current Status
            </CardTitle>
            <CardDescription>
              System configuration and connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Engine Host:</span>
                  <span className="text-sm font-mono">{config.host}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Engine Port:</span>
                  <span className="text-sm font-mono">{config.port}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Base URL:</span>
                  <span className="text-sm font-mono">{config.baseUrl}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Configuration:</span>
                  <Badge variant={isValidConfig ? "default" : "destructive"}>
                    {isValidConfig ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Unsaved Changes:</span>
                  <Badge variant={hasChanges ? "destructive" : "default"}>
                    {hasChanges ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Storage:</span>
                  <Badge variant="outline">Local Storage</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

}