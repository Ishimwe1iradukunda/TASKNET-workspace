import React from 'react';
import { FileText, CheckSquare, Columns3, Database, Wifi, WifiOff } from 'lucide-react';
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
    { id: 'notes' as ViewType, icon: FileText, label: 'Notes' },
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks' },
    { id: 'kanban' as ViewType, icon: Columns3, label: 'Kanban' },
    { id: 'data' as ViewType, icon: Database, label: 'Data' },
  ];

  return (
    <div className="w-64 bg-muted border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">Workspace</h1>
        <p className="text-sm text-muted-foreground">Local-first notes & tasks</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange(item.id)}
          >
            <item.icon className="w-4 h-4 mr-2" />
            {item.label}
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
