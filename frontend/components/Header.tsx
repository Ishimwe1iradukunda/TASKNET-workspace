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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ViewType } from '../App';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode: boolean;
  onOfflineModeToggle: (offline: boolean) => void;
}

export function Header({ currentView, onViewChange, isOfflineMode, onOfflineModeToggle }: HeaderProps) {
  const navItems = [
    { id: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard' },
    { id: 'activity' as ViewType, icon: Activity, label: 'Activity' },
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks' },
    { id: 'projects' as ViewType, icon: FolderOpen, label: 'Projects' },
    { id: 'notes' as ViewType, icon: FileText, label: 'Notes' },
    { id: 'wikis' as ViewType, icon: BookOpen, label: 'Wikis' },
    { id: 'email' as ViewType, icon: Mail, label: 'Inbox' },
    { id: 'calendar' as ViewType, icon: Calendar, label: 'Calendar' },
    { id: 'data' as ViewType, icon: Database, label: 'Data Manager' },
  ];

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold hidden md:block">TaskNet</h1>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map(item => (
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
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 w-64" />
        </div>

        {/* Actions */}
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
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
