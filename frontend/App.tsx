import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotesView } from './components/NotesView';
import { TasksView } from './components/TasksView';
import { KanbanView } from './components/KanbanView';
import { WikisView } from './components/WikisView';
import { ProjectsView } from './components/ProjectsView';
import { AIAssistant } from './components/AIAssistant';
import { DataManager } from './components/DataManager';
import { LocalStorageManager } from './utils/localStorage';

export type ViewType = 'notes' | 'tasks' | 'kanban' | 'wikis' | 'projects' | 'ai' | 'data';

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
        {currentView === 'ai' && <AIAssistant isOfflineMode={isOfflineMode} />}
        {currentView === 'data' && <DataManager isOfflineMode={isOfflineMode} />}
      </main>
    </div>
  );
}

export default App;
