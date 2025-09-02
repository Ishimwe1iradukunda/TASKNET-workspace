import React from 'react';
import {
  CheckSquare,
  Bell,
  Settings,
  Wifi,
  WifiOff,
  BarChart3,
  Activity,
  FileText,
  FolderOpen,
  BookOpen,
  Mail,
  Calendar,
  Database,
  ChevronDown,
  Zap,
  Target,
  Briefcase,
  Clock,
  FileImage,
  ListPlus,
  ClipboardList,
  Columns3,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ViewType } from '../App';
import { useTheme } from '../theme';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode: boolean;
  onOfflineModeToggle: (offline: boolean) => void;
  onOpenCommandPalette: () => void;
}

export function Header({ currentView, onViewChange, isOfflineMode, onOfflineModeToggle, onOpenCommandPalette }: HeaderProps) {
  const { mode, setMode } = useTheme();

  const mainNavItems = [
    { id: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard' },
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks' },
    { id: 'projects' as ViewType, icon: FolderOpen, label: 'Projects' },
    { id: 'notes' as ViewType, icon: FileText, label: 'Notes' },
  ];

  const collaborationItems = [
    { id: 'email' as ViewType, icon: Mail, label: 'Inbox' },
    { id: 'calendar' as ViewType, icon: Calendar, label: 'Calendar' },
    { id: 'documents' as ViewType, icon: Database, label: 'Documents' },
  ];

  const productItems = [
    { id: 'sprints' as ViewType, icon: Zap, label: 'Sprints' },
    { id: 'goals' as ViewType, icon: Target, label: 'Goals' },
    { id: 'portfolios' as ViewType, icon: Briefcase, label: 'Portfolios' },
  ];

  const workspaceItems = [
    { id: 'wikis' as ViewType, icon: BookOpen, label: 'Wikis' },
    { id: 'activity' as ViewType, icon: Activity, label: 'Activity Feed' },
    { id: 'time-tracking' as ViewType, icon: Clock, label: 'Time Tracking' },
    { id: 'kanban' as ViewType, icon: Columns3, label: 'Kanban Board' },
  ];

  const featuresItems = [
    { id: 'custom-fields' as ViewType, icon: ListPlus, label: 'Custom Fields' },
    { id: 'forms' as ViewType, icon: ClipboardList, label: 'Forms' },
    { id: 'tools' as ViewType, icon: FileImage, label: 'PDF Tools' },
    { id: 'data' as ViewType, icon: Database, label: 'Data Manager' },
  ];

  const settingsItems = [
    { id: 'automations' as ViewType, icon: Zap, label: 'Automations' },
  ];

  const NavDropdown = ({ label, items }: { label: string, items: { id: ViewType, icon: React.ElementType, label: string }[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 menu-hover menu-btn">
          {label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map(item => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="flex items-center gap-2 pl-2 menu-dd-hover"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0 transition-colors">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <CheckSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold hidden md:block">TaskNet</h1>
        </div>

        <nav className="hidden lg:flex items-center gap-1 menu-group">
          {mainNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 menu-hover menu-btn ${currentView === item.id ? 'menu-active' : ''}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
          <NavDropdown label="Collaboration" items={collaborationItems} />
          <NavDropdown label="Product" items={productItems} />
          <NavDropdown label="Workspace" items={workspaceItems} />
          <NavDropdown label="Features" items={featuresItems} />
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 menu-hover menu-btn"
          onClick={onOpenCommandPalette}
          title="Search (Ctrl/⌘ + K)"
        >
          <Search className="w-4 h-4" />
          Search
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Theme" className="menu-hover menu-btn">
              {mode === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setMode('light')} className="flex items-center gap-2 menu-dd-hover">
              <Sun className="w-4 h-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode('dark')} className="flex items-center gap-2 menu-dd-hover">
              <Moon className="w-4 h-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode('system')} className="flex items-center gap-2 menu-dd-hover">
              <Settings className="w-4 h-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOfflineModeToggle(!isOfflineMode)}
          title={isOfflineMode ? 'Switch to Online Mode (Ctrl/⌘ + B)' : 'Switch to Offline Mode (Ctrl/⌘ + B)'}
          className="menu-hover menu-btn"
        >
          {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
        </Button>

        <Button variant="ghost" size="icon" title="Notifications" className="menu-hover menu-btn">
          <Bell className="w-5 h-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Settings" className="menu-hover menu-btn">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {settingsItems.map(item => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="flex items-center gap-2 menu-dd-hover"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
