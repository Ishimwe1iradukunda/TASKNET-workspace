import React, { useState } from 'react';
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
  WifiOff,
  ChevronDown,
  ChevronRight,
  Settings,
  Bell,
  Users,
  BarChart3,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOfflineMode: boolean;
  onOfflineModeToggle: (offline: boolean) => void;
}

export function Sidebar({ currentView, onViewChange, isOfflineMode, onOfflineModeToggle }: SidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const projectManagementItems = [
    { id: 'tasks' as ViewType, icon: CheckSquare, label: 'Tasks', description: 'Track your work', badge: null },
    { id: 'kanban' as ViewType, icon: Columns3, label: 'Kanban Board', description: 'Visual workflow', badge: null },
    { id: 'projects' as ViewType, icon: FolderOpen, label: 'Projects', description: 'Project management', badge: null },
    { id: 'time-tracking' as ViewType, icon: Clock, label: 'Time Tracking', description: 'Track work time', badge: 'Pro' },
  ];

  const productDevelopmentItems = [
    { id: 'sprints' as ViewType, icon: Zap, label: 'Sprints', description: 'Agile iterations', badge: 'Pro' },
    { id: 'goals' as ViewType, icon: Target, label: 'Goals & OKRs', description: 'Strategic planning', badge: 'Pro' },
    { id: 'portfolios' as ViewType, icon: Briefcase, label: 'Portfolios', description: 'Project collections', badge: 'Pro' },
  ];

  const knowledgeManagementItems = [
    { id: 'notes' as ViewType, icon: FileText, label: 'Notes', description: 'Quick notes & docs', badge: null },
    { id: 'wikis' as ViewType, icon: BookOpen, label: 'Knowledge Base', description: 'Wiki & documentation', badge: null },
    { id: 'search' as ViewType, icon: Search, label: 'Global Search', description: 'Find anything fast', badge: 'New' },
  ];

  const collaborationItems = [
    { id: 'email' as ViewType, icon: Mail, label: 'Inbox', description: 'Communications hub', badge: null },
    { id: 'documents' as ViewType, icon: FileArchive, label: 'Documents', description: 'File management', badge: null },
    { id: 'calendar' as ViewType, icon: Calendar, label: 'Calendar', description: 'Schedule & events', badge: null },
  ];

  const analyticsItems = [
    { id: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard', description: 'Project insights', badge: 'New' },
    { id: 'activity' as ViewType, icon: Activity, label: 'Activity Feed', description: 'Recent changes', badge: 'New' },
  ];

  const toolsItems = [
    { id: 'pdf-tools' as ViewType, icon: FileImage, label: 'PDF Tools', description: 'PDF processing', badge: null },
    { id: 'data' as ViewType, icon: Database, label: 'Data Manager', description: 'Import/Export', badge: null },
  ];

  const MenuSection = ({ title, items, sectionKey }: { 
    title: string; 
    items: any[]; 
    sectionKey: string;
  }) => {
    const isCollapsed = collapsedSections.has(sectionKey);
    
    return (
      <div className="mb-4">
        <Button
          variant="ghost"
          className="w-full justify-between h-auto p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:bg-transparent"
          onClick={() => toggleSection(sectionKey)}
        >
          <span>{title}</span>
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
        
        {!isCollapsed && (
          <div className="space-y-1 mt-2">
            {items.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? 'default' : 'ghost'}
                className="w-full justify-start h-auto p-3 text-left relative"
                onClick={() => onViewChange(item.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <item.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {item.label}
                      {item.badge && (
                        <Badge 
                          variant={item.badge === 'Pro' ? 'default' : 'secondary'} 
                          className="text-xs h-4 px-1"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-muted/30 border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">TaskNetWorkspace</h1>
            <p className="text-xs text-muted-foreground">Enterprise Suite v2.0</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <MenuSection title="Project Management" items={projectManagementItems} sectionKey="projects" />
        <MenuSection title="Product Development" items={productDevelopmentItems} sectionKey="product" />
        <MenuSection title="Knowledge Management" items={knowledgeManagementItems} sectionKey="knowledge" />
        <MenuSection title="Collaboration" items={collaborationItems} sectionKey="collaboration" />
        <MenuSection title="Analytics & Insights" items={analyticsItems} sectionKey="analytics" />
        <MenuSection title="Tools & Utilities" items={toolsItems} sectionKey="tools" />
      </nav>
      
      <div className="p-4 border-t border-border space-y-3">
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
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          {isOfflineMode ? 'Using local storage' : 'Syncing with server'}
        </p>
      </div>
    </div>
  );
}
