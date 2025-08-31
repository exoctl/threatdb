import {
  Shield,
  Search,
  Database,
  FileText,
  Settings,
  Activity,
  Code,
  Eye,
  FolderTree,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useState } from "react"

const defaultMenuItems = [
  { title: "Dashboard", url: "/", icon: Activity },
  { title: "Binary Scanner", url: "/scanner", icon: Search },
  { title: "Analysis Records", url: "/records", icon: Database },
  { title: "Threat Taxonomy", url: "/taxonomy", icon: FolderTree },
  { title: "Yara Rules", url: "/yara", icon: FileText },
  { title: "Status", url: "/status", icon: Eye },
  { title: "Plugins", url: "/plugins", icon: Code },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const [menuItems] = useState(defaultMenuItems)

  const isActive = (path: string) =>
    currentPath === path || (path !== "/" && currentPath.startsWith(path + "/"))

  const getNavCls = (path: string) => {
    const active = isActive(path)
    return `group flex items-center gap-2 p-2 rounded-md transition-colors focus:outline-none font-medium relative ${active
        ? "bg-primary/10 text-primary font-bold"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`
  }

  return (
    <Sidebar collapsible="icon" className="bg-background border-r">
      <SidebarContent>
        <div className={`p-4 border-b flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <div className={`p-2 rounded-lg ${isCollapsed ? "bg-transparent" : "bg-primary/10"}`}>
            <Shield className={`h-5 w-5 text-primary`} />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-extrabold text-xl tracking-wide">
                <span className="text-red-500">Threat</span>
                <span className="text-[#282A36]">DB</span>
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">Malware Analysis Management</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-foreground font-bold uppercase tracking-wide mt-2 mb-1 ${isCollapsed ? "hidden" : ""}`}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={() => getNavCls(item.url)}
                      aria-current={isActive(item.url) ? "page" : undefined}
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-transform ${isActive(item.url) ? "text-primary scale-110" : "group-hover:scale-105"
                            }`}
                        />
                        {!isCollapsed && (
                          <span
                            className={`truncate transition-colors ${isActive(item.url) ? "font-bold" : ""
                              }`}
                          >
                            {item.title}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}