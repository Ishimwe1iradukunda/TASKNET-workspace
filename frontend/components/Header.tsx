import React from 'react';
import {
  CheckSquare,
  Bell,
  Settings,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Search,
  Zap,
  ListPlus,
  ClipboardList,
  FileImage,
  Database,
  Scissors,
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

  const featuresItems = [
    { id: 'custom-fields' as ViewType, icon: ListPlus, label: 'Custom Fields' },
    { id: 'forms' as ViewType, icon: ClipboardList, label: 'Forms' },
    { id: 'tools' as ViewType, icon: Scissors, label: 'Tools' },
    { id: 'data' as ViewType, icon: Database, label: 'Data Manager' },
  ];

  const settingsItems = [
    { id: 'automations' as ViewType, icon: Zap, label: 'Automations' },
  ];

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0 transition-colors">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <CheckSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold hidden md:block">TaskNet</h1>
        </div>
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

        <div className="hidden lg:flex items-center gap-2 menu-group">
          {featuresItems.map(item => (
            <Button
              key={item.id}
              variant="outline"
              size="sm"
              className={`menu-hover menu-btn ${currentView === item.id ? 'menu-active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>

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
