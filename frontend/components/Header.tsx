import React from 'react';
import {
  CheckSquare,
  Search,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ViewType } from '../App';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode: boolean;
  onOfflineModeToggle: (offline: boolean) => void;
  onGlobalSearch?: (query: string) => void;
}

export function Header({ currentView, onViewChange, isOfflineMode, onOfflineModeToggle, onGlobalSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const mainNavItems = [
    { id: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard' },
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks' },
    { id: 'projects' as ViewType, icon: FolderOpen, label: 'Projects' },
    { id: 'notes' as ViewType, icon: FileText, label: 'Notes' },
    { id: 'search' as ViewType, icon: Search, label: 'Search' },
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

  const settingsItems = [
    { id: 'automations' as ViewType, icon: Zap, label: 'Automations' },
    { id: 'custom-fields' as ViewType, icon: ListPlus, label: 'Custom Fields' },
    { id: 'forms' as ViewType, icon: ClipboardList, label: 'Forms' },
    { id: 'pdf-tools' as ViewType, icon: FileImage, label: 'PDF Tools' },
    { id: 'data' as ViewType, icon: Database, label: 'Data Manager' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onGlobalSearch) {
      onGlobalSearch(searchQuery.trim());
      onViewChange('search');
    }
  };

  const NavDropdown = ({ label, items }: { label: string, items: { id: ViewType, icon: React.ElementType, label: string }[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          {label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map(item => (
          <DropdownMenuItem key={item.id} onClick={() => onViewChange(item.id)} className="flex items-center gap-2">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold hidden md:block">TaskNet</h1>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {mainNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(item.id)}
              className="flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
          <NavDropdown label="Collaboration" items={collaborationItems} />
          <NavDropdown label="Product" items={productItems} />
          <NavDropdown label="Workspace" items={workspaceItems} />
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-10 w-48"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOfflineModeToggle(!isOfflineMode)}
          title={isOfflineMode ? 'Switch to Online Mode' : 'Switch to Offline Mode'}
        >
          {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Settings & Tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {settingsItems.map(item => (
              <DropdownMenuItem key={item.id} onClick={() => onViewChange(item.id)} className="flex items-center gap-2">
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
