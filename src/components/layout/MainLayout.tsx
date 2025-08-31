import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useEngineConfig } from "@/hooks/useEngineConfig"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import ApiClient from "@/lib/api"

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { config } = useEngineConfig();
  const apiClient = new ApiClient(config);

  const { data: version, isError } = useQuery({
    queryKey: ['engine-status', config.baseUrl],
    queryFn: () => apiClient.getVersion(),
    refetchInterval: 30000, // Check status every 30s
    retry: false,
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-2 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger />
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={isError ? "destructive" : "default"} className="gap-1 text-xs">
                  {isError ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                  <span className="hidden sm:inline">{isError ? "Offline" : "Online"}</span>
                </Badge>
                {version && (
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                    Engine v{version.version}
                  </Badge>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}