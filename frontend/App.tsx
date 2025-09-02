import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NotesView } from './components/NotesView';
import { TasksView } from './components/TasksView';
import { KanbanView } from './components/KanbanView';
import { WikisView } from './components/WikisView';
import { ProjectsView } from './components/ProjectsView';
import { EmailView } from './components/EmailView';
import { CalendarView } from './components/CalendarView';
import { DocumentsView } from './components/DocumentsView';
import { PdfToolsView } from './components/PdfToolsView';
import { TimeTrackingView } from './components/TimeTrackingView';
import { PortfoliosView } from './components/PortfoliosView';
import { SprintsView } from './components/SprintsView';
import { GoalsView } from './components/GoalsView';
import { EnterpriseSearchView } from './components/EnterpriseSearchView';
import { DataManager } from './components/DataManager';
import { DashboardView } from './components/DashboardView';
import { ActivityFeedView } from './components/ActivityFeedView';
import { QuickCapture } from './components/QuickCapture';
import { LocalStorageManager } from './utils/localStorage';

export type ViewType = 'notes' | 'tasks' | 'kanban' | 'wikis' | 'projects' | 'email' | 'calendar' | 'documents' | 'pdf-tools' | 'time-tracking' | 'portfolios' | 'sprints' | 'goals' | 'search' | 'data' | 'dashboard' | 'activity';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isOfflineMode, setIsOfflineMode] = useState(true);

  useEffect(() => {
    LocalStorageManager.init();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView isOfflineMode={isOfflineMode} />;
      case 'activity': return <ActivityFeedView isOfflineMode={isOfflineMode} />;
      case 'notes': return <NotesView isOfflineMode={isOfflineMode} />;
      case 'tasks': return <TasksView isOfflineMode={isOfflineMode} />;
      case 'kanban': return <KanbanView isOfflineMode={isOfflineMode} />;
      case 'wikis': return <WikisView isOfflineMode={isOfflineMode} />;
      case 'projects': return <ProjectsView isOfflineMode={isOfflineMode} />;
      case 'email': return <EmailView isOfflineMode={isOfflineMode} />;
      case 'calendar': return <CalendarView isOfflineMode={isOfflineMode} />;
      case 'documents': return <DocumentsView isOfflineMode={isOfflineMode} />;
      case 'pdf-tools': return <PdfToolsView isOfflineMode={isOfflineMode} />;
      case 'time-tracking': return <TimeTrackingView isOfflineMode={isOfflineMode} />;
      case 'portfolios': return <PortfoliosView isOfflineMode={isOfflineMode} />;
      case 'sprints': return <SprintsView isOfflineMode={isOfflineMode} />;
      case 'goals': return <GoalsView isOfflineMode={isOfflineMode} />;
      case 'search': return <EnterpriseSearchView isOfflineMode={isOfflineMode} />;
      case 'data': return <DataManager isOfflineMode={isOfflineMode} />;
      default: return <DashboardView isOfflineMode={isOfflineMode} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOfflineMode={isOfflineMode}
        onOfflineModeToggle={setIsOfflineMode}
      />
      
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>

      <QuickCapture isOfflineMode={isOfflineMode} />
    </div>
  );
}

export default App;
