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
import { AutomationsView } from './components/AutomationsView';
import { CustomFieldsView } from './components/CustomFieldsView';
import { FormsView } from './components/FormsView';
import { QuickCapture } from './components/QuickCapture';
import { LocalStorageManager } from './utils/localStorage';

export type ViewType = 
  | 'notes' | 'tasks' | 'kanban' | 'wikis' | 'projects' | 'email' | 'calendar' 
  | 'documents' | 'pdf-tools' | 'time-tracking' | 'portfolios' | 'sprints' 
  | 'goals' | 'search' | 'data' | 'dashboard' | 'activity' | 'automations' 
  | 'custom-fields' | 'forms';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  useEffect(() => {
    LocalStorageManager.init();
  }, []);

  const handleItemCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'activity': return <ActivityFeedView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'notes': return <NotesView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'tasks': return <TasksView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'kanban': return <KanbanView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'wikis': return <WikisView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'projects': return <ProjectsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'email': return <EmailView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'calendar': return <CalendarView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'documents': return <DocumentsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'pdf-tools': return <PdfToolsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'time-tracking': return <TimeTrackingView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'portfolios': return <PortfoliosView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'sprints': return <SprintsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'goals': return <GoalsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'search': return <EnterpriseSearchView key={refreshKey} isOfflineMode={isOfflineMode} globalSearchQuery={globalSearchQuery} />;
      case 'data': return <DataManager key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'automations': return <AutomationsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'custom-fields': return <CustomFieldsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      case 'forms': return <FormsView key={refreshKey} isOfflineMode={isOfflineMode} />;
      default: return <DashboardView key={refreshKey} isOfflineMode={isOfflineMode} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOfflineMode={isOfflineMode}
        onOfflineModeToggle={setIsOfflineMode}
        onGlobalSearch={handleGlobalSearch}
      />
      
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>

      <QuickCapture isOfflineMode={isOfflineMode} onItemCreated={handleItemCreated} />
    </div>
  );
}

export default App;
