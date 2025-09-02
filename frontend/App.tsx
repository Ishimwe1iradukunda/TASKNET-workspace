import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
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
import { LocalStorageManager } from './utils/localStorage';

export type ViewType = 'notes' | 'tasks' | 'kanban' | 'wikis' | 'projects' | 'email' | 'calendar' | 'documents' | 'pdf-tools' | 'time-tracking' | 'portfolios' | 'sprints' | 'goals' | 'search' | 'data' | 'dashboard' | 'activity';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isOfflineMode, setIsOfflineMode] = useState(true);

  useEffect(() => {
    // Initialize offline storage
    LocalStorageManager.init();
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOfflineMode={isOfflineMode}
        onOfflineModeToggle={setIsOfflineMode}
      />
      
      <main className="flex-1 overflow-hidden">
        {currentView === 'dashboard' && <DashboardView isOfflineMode={isOfflineMode} />}
        {currentView === 'activity' && <ActivityFeedView isOfflineMode={isOfflineMode} />}
        {currentView === 'notes' && <NotesView isOfflineMode={isOfflineMode} />}
        {currentView === 'tasks' && <TasksView isOfflineMode={isOfflineMode} />}
        {currentView === 'kanban' && <KanbanView isOfflineMode={isOfflineMode} />}
        {currentView === 'wikis' && <WikisView isOfflineMode={isOfflineMode} />}
        {currentView === 'projects' && <ProjectsView isOfflineMode={isOfflineMode} />}
        {currentView === 'email' && <EmailView isOfflineMode={isOfflineMode} />}
        {currentView === 'calendar' && <CalendarView isOfflineMode={isOfflineMode} />}
        {currentView === 'documents' && <DocumentsView isOfflineMode={isOfflineMode} />}
        {currentView === 'pdf-tools' && <PdfToolsView isOfflineMode={isOfflineMode} />}
        {currentView === 'time-tracking' && <TimeTrackingView isOfflineMode={isOfflineMode} />}
        {currentView === 'portfolios' && <PortfoliosView isOfflineMode={isOfflineMode} />}
        {currentView === 'sprints' && <SprintsView isOfflineMode={isOfflineMode} />}
        {currentView === 'goals' && <GoalsView isOfflineMode={isOfflineMode} />}
        {currentView === 'search' && <EnterpriseSearchView isOfflineMode={isOfflineMode} />}
        {currentView === 'data' && <DataManager isOfflineMode={isOfflineMode} />}
      </main>
    </div>
  );
}

export default App;
