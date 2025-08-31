import { useQuery } from "@tanstack/react-query";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import ApiClient from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Code, 
  FileText, 
  Folder,
  HardDrive,
  Cpu,
  Database
} from "lucide-react";
import { PluginsResponse, LuaScript } from "@/types/api";

export default function Plugins() {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);

  const { data: pluginsResponse, isLoading, error } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => apiClient.getPlugins(),
  });

  const lua = pluginsResponse?.plugins?.lua;
  const scripts = lua?.scripts || [];
  const stateMemory = lua?.state_memory || "0x0000000";

  // Group scripts by directory
  const scriptGroups = scripts.reduce((acc, script) => {
    const pathParts = script.path.split('/');
    const directory = pathParts.slice(0, -1).join('/') || 'root';
    if (!acc[directory]) {
      acc[directory] = [];
    }
    acc[directory].push(script);
    return acc;
  }, {} as Record<string, LuaScript[]>);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plugins</h1>
          <p className="text-muted-foreground">Loading plugin data...</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading plugins and scripts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plugins</h1>
          <p className="text-muted-foreground">
            Manage and monitor engine plugins and scripts
          </p>
        </div>
        <div className="text-center py-12 space-y-4">
          <Database className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Cannot Connect to Engine</p>
            <p className="text-muted-foreground">
              Unable to load plugin information. Check if the engine is running.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plugins</h1>
        <p className="text-muted-foreground">
          Manage and monitor engine plugins and scripts
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scripts</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scripts.length}</div>
            <p className="text-xs text-muted-foreground">
              Lua scripts loaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Directories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(scriptGroups).length}</div>
            <p className="text-xs text-muted-foreground">
              Plugin directories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">State Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stateMemory}</div>
            <p className="text-xs text-muted-foreground">
              Lua state pointer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plugins by Directory */}
      {scripts.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(scriptGroups).map(([directory, dirScripts]) => (
            <Card key={directory}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  {directory === 'root' ? 'Root Scripts' : directory.replace('sources/app/plugins/', '')}
                </CardTitle>
                <CardDescription>
                  {dirScripts.length} script{dirScripts.length !== 1 ? 's' : ''} in this directory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Script Name</TableHead>
                        <TableHead>Full Path</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dirScripts.map((script: LuaScript, index: number) => (
                        <TableRow key={`${script.path}-${index}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {script.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {script.path}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {script.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <Cpu className="h-3 w-3 mr-1" />
                              Loaded
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <Database className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">No Plugins Found</p>
            <p className="text-muted-foreground">
              No Lua scripts are currently loaded in the engine.
            </p>
          </div>
        </div>
      )}

      {/* Lua State Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Lua Runtime Information
          </CardTitle>
          <CardDescription>
            Runtime details about the Lua execution environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">State Memory Address:</span>
                <Badge variant="outline" className="font-mono">
                  {stateMemory}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Scripts:</span>
                <span className="text-sm">{scripts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Script Directories:</span>
                <span className="text-sm">{Object.keys(scriptGroups).length}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Script Types:</div>
              <div className="space-y-1">
                {scripts.length > 0 ? (
                  Object.entries(scripts.reduce((acc, script) => {
                    acc[script.type] = (acc[script.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span>{type}:</span>
                      <span>{count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No scripts loaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}