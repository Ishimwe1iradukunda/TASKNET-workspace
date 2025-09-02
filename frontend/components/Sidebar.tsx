import React from 'react';
import { FileText, CheckSquare, Columns3, BookOpen, FolderOpen, Bot, Database, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode: boolean;
  onOfflineModeToggle: (offline: boolean) => void;
}

export function Sidebar({ currentView, onViewChange, isOfflineMode, onOfflineModeToggle }: SidebarProps) {
  const menuItems = [
    { id: 'notes' as ViewType, icon: FileText, label: 'Notes', description: 'Simple & powerful' },
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks', description: 'Track your work' },
    { id: 'kanban' as ViewType, icon: Columns3, label: 'Kanban', description: 'Visual project boards' },
    { id: 'wikis' as ViewType, icon: BookOpen, label: 'Wikis', description: 'Centralize your knowledge' },
    { id: 'projects' as ViewType, icon: FolderOpen, label: 'Projects', description: 'Manage any project' },
    { id: 'ai' as ViewType, icon: Bot, label: 'AI Assistant', description: 'Build, write, automate' },
    { id: 'data' as ViewType, icon: Database, label: 'Data', description: 'Export & sync' },
  ];

  return (
    <div className="w-80 bg-muted border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold mb-1">TaskNetWorkspace</h1>
        <p className="text-sm text-muted-foreground">Local-first productivity suite</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'default' : 'ghost'}
            className="w-full justify-start h-auto p-4 text-left"
            onClick={() => onViewChange(item.id)}
          >
            <div className="flex items-start gap-3">
              <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onOfflineModeToggle(!isOfflineMode)}
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-4 h-4 mr-2" />
              Offline Mode
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 mr-2" />
              Online Mode
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isOfflineMode ? 'Using local storage' : 'Syncing with server'}
        </p>
      </div>
    </div>
  );
}
