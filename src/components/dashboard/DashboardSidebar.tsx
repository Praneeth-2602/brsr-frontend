import { Upload, BarChart3, LogOut, Menu, UserCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

interface Props {
  activeTab: "upload" | "consolidated";
  onTabChange: (tab: "upload" | "consolidated") => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: Props) {
  const { logout, userEmail, userName } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "upload" as const, label: "Upload & Companies", icon: Upload },
    { id: "consolidated" as const, label: "Database", icon: BarChart3 },
  ];
  const displayName = useMemo(() => {
    if (userName && userName.trim()) return userName.trim();
    return "User";
  }, [userName]);

  return (
    <aside
      className={`flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border/80 shrink-0 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-sidebar-border/80 ${collapsed ? "justify-center px-2 py-5" : "justify-between px-5 py-5"}`}>
        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-extrabold shadow-sm">
          N
          </div>
          {!collapsed ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/65">Workspace</p>
              <span className="text-base font-semibold text-sidebar-primary">Nivra</span>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-5 space-y-1.5 ${collapsed ? "px-2" : "px-3"}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="mb-1 inline-flex h-9 w-full items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={collapsed ? tab.label : undefined}
            className={`flex w-full items-center rounded-lg py-2.5 text-sm transition-all ${
              activeTab === tab.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                : "text-sidebar-foreground hover:bg-muted/70"
            } ${collapsed ? "justify-center px-2.5" : "gap-2.5 px-3.5"}
            `}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {!collapsed ? tab.label : null}
          </button>
        ))}
      </nav>

      {/* User & Logout */}
      <div className={`relative border-t border-sidebar-border/80 py-4 ${collapsed ? "px-2" : "px-3"}`}>
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          title={collapsed ? "Profile" : undefined}
          className={`flex w-full items-center rounded-lg py-2.5 text-sm text-sidebar-foreground hover:bg-muted/70 transition-colors ${
            collapsed ? "justify-center px-2.5" : "gap-2.5 px-3"
          }`}
        >
          <UserCircle2 className="h-5 w-5 shrink-0" />
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/65 truncate">{userEmail}</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </>
          ) : null}
        </button>

        {profileOpen ? (
          <div
            className={`mt-2 rounded-lg border border-border bg-card shadow-sm p-1 ${
              collapsed ? "absolute left-[calc(100%+8px)] bottom-4 w-36 z-50" : ""
            }`}
          >
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
