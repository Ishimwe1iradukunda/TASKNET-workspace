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
import { DataManager } from './components/DataManager';
import { LocalStorageManager } from './utils/localStorage';

export type ViewType = 'notes' | 'tasks' | 'kanban' | 'wikis' | 'projects' | 'email' | 'calendar' | 'documents' | 'data';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('notes');
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
        {currentView === 'notes' && <NotesView isOfflineMode={isOfflineMode} />}
        {currentView === 'tasks' && <TasksView isOfflineMode={isOfflineMode} />}
        {currentView === 'kanban' && <KanbanView isOfflineMode={isOfflineMode} />}
        {currentView === 'wikis' && <WikisView isOfflineMode={isOfflineMode} />}
        {currentView === 'projects' && <ProjectsView isOfflineMode={isOfflineMode} />}
        {currentView === 'email' && <EmailView isOfflineMode={isOfflineMode} />}
        {currentView === 'calendar' && <CalendarView isOfflineMode={isOfflineMode} />}
        {currentView === 'documents' && <DocumentsView isOfflineMode={isOfflineMode} />}
        {currentView === 'data' && <DataManager isOfflineMode={isOfflineMode} />}
      </main>
    </div>
  );
}

export default App;
