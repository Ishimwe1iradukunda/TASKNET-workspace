import React from 'react';
import { 
  FileText, 
  CheckSquare, 
  Columns3, 
  BookOpen, 
  FolderOpen, 
  Mail, 
  Calendar, 
  FileArchive, 
  FileImage, 
  Clock,
  Briefcase,
  Zap,
  Target,
  Search,
  Database, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode: boolean;
  onOfflineModeToggle: (offline: boolean) => void;
}

export function Sidebar({ currentView, onViewChange, isOfflineMode, onOfflineModeToggle }: SidebarProps) {
  const projectManagementItems = [
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks', description: 'Track your work' },
    { id: 'portfolios' as ViewType, icon: Briefcase, label: 'Portfolios', description: 'Project collections' },
    { id: 'kanban' as ViewType, icon: Columns3, label: 'Board views', description: 'Visual boards' },
    { id: 'time-tracking' as ViewType, icon: Clock, label: 'Time tracking', description: 'Track work time' },
  ];

  const productDevelopmentItems = [
    { id: 'sprints' as ViewType, icon: Zap, label: 'Sprints', description: 'Agile iterations' },
    { id: 'goals' as ViewType, icon: Target, label: 'Roadmap & Backlog', description: 'Strategic planning' },
  ];

  const knowledgeManagementItems = [
    { id: 'notes' as ViewType, icon: FileText, label: 'Docs', description: 'Documentation' },
    { id: 'wikis' as ViewType, icon: BookOpen, label: 'Wikis', description: 'Knowledge base' },
    { id: 'search' as ViewType, icon: Search, label: 'Enterprise search', description: 'Find anything' },
  ];

  const resourceManagementItems = [
    { id: 'projects' as ViewType, icon: FolderOpen, label: 'Goals', description: 'Objectives' },
    { id: 'calendar' as ViewType, icon: Calendar, label: 'Dashboards', description: 'Analytics' },
  ];

  const collaborationItems = [
    { id: 'documents' as ViewType, icon: FileArchive, label: 'Docs', description: 'Shared documents' },
    { id: 'email' as ViewType, icon: Mail, label: 'Inbox', description: 'Communications' },
  ];

  const workflowItems = [
    { id: 'pdf-tools' as ViewType, icon: FileImage, label: 'Custom fields', description: 'Field management' },
    { id: 'data' as ViewType, icon: Database, label: 'Forms', description: 'Data collection' },
  ];

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-4">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'default' : 'ghost'}
            className="w-full justify-start h-auto p-3 text-left"
            onClick={() => onViewChange(item.id)}
          >
            <div className="flex items-start gap-3">
              <item.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-muted border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold mb-1">TaskNetWorkspace</h1>
        <p className="text-sm text-muted-foreground">Enterprise productivity suite</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <MenuSection title="Project Management" items={projectManagementItems} />
        <MenuSection title="Product Development" items={productDevelopmentItems} />
        <MenuSection title="Knowledge Management" items={knowledgeManagementItems} />
        <MenuSection title="Resource Management" items={resourceManagementItems} />
        <MenuSection title="Collaboration" items={collaborationItems} />
        <MenuSection title="Workflows" items={workflowItems} />
      </nav>
      
      <div className="p-4 border-t border-border mt-auto">
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
