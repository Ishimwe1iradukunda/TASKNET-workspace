import React from "react";
import {
  BarChart3,
  CheckSquare,
  FolderOpen,
  FileText,
  BookOpen,
  Mail,
  Calendar,
  Database,
  Zap,
  Target,
  Briefcase,
  Activity as ActivityIcon,
  Clock,
  Columns3,
  ListPlus,
  ClipboardList,
  Settings,
  Wifi,
  WifiOff,
  Scissors,
} from "lucide-react";
import type { ViewType } from "../App";

interface SideMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode?: boolean;
}

type NavItem = {
  id: ViewType;
  icon: React.ElementType;
  label: string;
};

function NavSection({
  title,
  items,
  currentView,
  onViewChange,
}: {
  title?: string;
  items: NavItem[];
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  return (
    <div className="mb-4">
      {title && (
        <div className="px-3 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const ActiveIcon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-primary rounded-r-full" />}
              <ActiveIcon className="w-4 h-4" />
              <span className="truncate text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SideMenu({ currentView, onViewChange, isOfflineMode }: SideMenuProps) {
  const mainNavItems: NavItem[] = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "tasks", icon: CheckSquare, label: "Tasks" },
    { id: "projects", icon: FolderOpen, label: "Projects" },
    { id: "notes", icon: FileText, label: "Notes" },
  ];

  const collaborationItems: NavItem[] = [
    { id: "email", icon: Mail, label: "Inbox" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "documents", icon: Database, label: "Documents" },
    { id: "chat", icon: ActivityIcon, label: "Chat" },
    { id: "reminders", icon: Clock, label: "Reminders" },
  ];

  const productItems: NavItem[] = [
    { id: "sprints", icon: Zap, label: "Sprints" },
    { id: "goals", icon: Target, label: "Goals" },
    { id: "portfolios", icon: Briefcase, label: "Portfolios" },
    { id: "planner", icon: Calendar, label: "Planner" },
  ];

  const workspaceItems: NavItem[] = [
    { id: "wikis", icon: BookOpen, label: "Wikis" },
    { id: "activity", icon: ActivityIcon, label: "Activity Feed" },
    { id: "time-tracking", icon: Clock, label: "Time Tracking" },
    { id: "kanban", icon: Columns3, label: "Kanban Board" },
  ];

  const featuresItems: NavItem[] = [
    { id: "custom-fields", icon: ListPlus, label: "Custom Fields" },
    { id: "forms", icon: ClipboardList, label: "Forms" },
    { id: "tools", icon: Scissors, label: "Tools" },
    { id: "data", icon: Database, label: "Data Manager" },
  ];

  const settingsItems: NavItem[] = [
    { id: "automations", icon: Zap, label: "Automations" },
  ];

  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-muted/30 h-full">
      <nav className="flex flex-col w-full h-full">
        <div className="flex-1 overflow-auto py-3">
          <div className="px-3 pb-4">
            <NavSection
              items={mainNavItems}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <NavSection
              title="Collaboration"
              items={collaborationItems}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <NavSection
              title="Product"
              items={productItems}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <NavSection
              title="Workspace"
              items={workspaceItems}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <NavSection
              title="Features"
              items={featuresItems}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <NavSection
              title="Settings"
              items={settingsItems}
              currentView={currentView}
              onViewChange={onViewChange}
            />
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-muted">
            <div className="flex items-center gap-2">
              {isOfflineMode ? (
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Wifi className="w-4 h-4 text-green-600" />
              )}
              <span className="text-xs">
                {isOfflineMode ? "Offline Mode" : "Online"}
              </span>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </nav>
    </aside>
  );
}
