import React, { useEffect, useState } from 'react';
import './styles/pink-hover.css';
import { Header } from './components/Header';
import { NotesView } from './components/NotesView';
import { TasksView } from './components/TasksView';
import { KanbanView } from './components/KanbanView';
import { WikisView } from './components/WikisView';
import { ProjectsView } from './components/ProjectsView';
import { EmailView } from './components/EmailView';
import { CalendarView } from './components/CalendarView';
import { DocumentsView } from './components/DocumentsView';
import { ToolsView } from './components/ToolsView';
import { TimeTrackingView } from './components/TimeTrackingView';
import { PortfoliosView } from './components/PortfoliosView';
import { SprintsView } from './components/SprintsView';
import { GoalsView } from './components/GoalsView';
import { DataManager } from './components/DataManager';
import { DashboardView } from './components/DashboardView';
import { ActivityFeedView } from './components/ActivityFeedView';
import { AutomationsView } from './components/AutomationsView';
import { CustomFieldsView } from './components/CustomFieldsView';
import { FormsView } from './components/FormsView';
import { QuickCapture } from './components/QuickCapture';
import { LocalStorageManager } from './utils/localStorage';
import { ThemeProvider } from './theme';
import { CommandPalette } from './components/CommandPalette';
import { PlannerView } from './components/PlannerView';
import { ChatView } from './components/ChatView';
import { RemindersView } from './components/RemindersView';

export type ViewType = 
  | 'notes' | 'tasks' | 'kanban' | 'wikis' | 'projects' | 'email' | 'calendar' 
  | 'documents' | 'tools' | 'time-tracking' | 'portfolios' | 'sprints' 
  | 'goals' | 'data' | 'dashboard' | 'activity' | 'automations' 
  | 'custom-fields' | 'forms' | 'planner' | 'chat' | 'reminders';

function AppInner() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    LocalStorageManager.init();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Ctrl/Cmd + K opens command palette
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsPaletteOpen((o) => !o);
      }
      // Ctrl/Cmd + B toggles offline
      if (mod && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsOfflineMode((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleItemCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView key={refreshKey} isOfflineMode={isOfflineMode} onViewChange={setCurrentView} />;
      case 'activity': return <ActivityFeedView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'notes': return <NotesView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'tasks': return <TasksView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'kanban': return <KanbanView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'wikis': return <WikisView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'projects': return <ProjectsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'email': return <EmailView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'calendar': return <CalendarView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'documents': return <DocumentsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'tools': return <ToolsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'time-tracking': return <TimeTrackingView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'portfolios': return <PortfoliosView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'sprints': return <SprintsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'goals': return <GoalsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'data': return <DataManager key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'automations': return <AutomationsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'custom-fields': return <CustomFieldsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'forms': return <FormsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'planner': return <PlannerView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'chat': return <ChatView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'reminders': return <RemindersView key={refreshKey} isOfflineMode={isOfflineMode} />;
      default: return <DashboardView key={refreshKey} isOfflineMode={isOfflineMode} onViewChange={setCurrentView} />;
    }
  };

  return (
    <>
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOfflineMode={isOfflineMode}
        onOfflineModeToggle={setIsOfflineMode}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
      />
      
      <main className="flex-1 overflow-hidden transition-colors duration-200">
        {renderView()}
      </main>

      <QuickCapture isOfflineMode={isOfflineMode} onItemCreated={handleItemCreated} />

      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        isOfflineMode={isOfflineMode}
        onNavigate={(viewId) => setCurrentView(viewId)}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-200">
        <AppInner />
      </div>
    </ThemeProvider>
  );
}

export default App;
