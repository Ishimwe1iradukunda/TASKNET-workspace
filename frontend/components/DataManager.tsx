import React, { useState } from 'react';
import { Download, Upload, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';

interface DataManagerProps {
  isOfflineMode: boolean;
}

export function DataManager({ isOfflineMode }: DataManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const exportData = async () => {
    setIsExporting(true);
    try {
      let data;
      
      if (isOfflineMode) {
        data = {
          notes: LocalStorageManager.getNotes(),
          tasks: LocalStorageManager.getTasks(),
          wikis: LocalStorageManager.getWikis(),
          projects: LocalStorageManager.getProjects(),
          emails: LocalStorageManager.getEmails(),
          documents: LocalStorageManager.getDocuments(),
          exportedAt: new Date(),
        };
      } else {
        data = await backend.workspace.exportData();
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasknetworkspace-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (isOfflineMode) {
        if (data.notes) LocalStorageManager.saveNotes(data.notes);
        if (data.tasks) LocalStorageManager.saveTasks(data.tasks);
        if (data.wikis) LocalStorageManager.saveWikis(data.wikis);
        if (data.projects) LocalStorageManager.saveProjects(data.projects);
        if (data.emails) LocalStorageManager.saveEmails(data.emails);
        if (data.documents) LocalStorageManager.saveDocuments(data.documents);
      } else {
        await backend.workspace.importData({
          notes: data.notes,
          tasks: data.tasks,
          wikis: data.wikis,
          projects: data.projects,
          emails: data.emails,
          documents: data.documents,
          overwrite: false,
        });
      }
      
      toast({
        title: "Success",
        description: "Data imported successfully. Refresh the page to see changes.",
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      toast({
        title: "Error",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const syncWithServer = async () => {
    if (isOfflineMode) {
      toast({
        title: "Offline",
        description: "Cannot sync while in offline mode.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Simple sync: download server data and overwrite local
      const serverData = await backend.workspace.exportData();
      LocalStorageManager.saveNotes(serverData.notes);
      LocalStorageManager.saveTasks(serverData.tasks);
      LocalStorageManager.saveWikis(serverData.wikis);
      LocalStorageManager.saveProjects(serverData.projects);
      LocalStorageManager.saveEmails(serverData.emails);
      LocalStorageManager.saveDocuments(serverData.documents);
      
      toast({
        title: "Success",
        description: "Server data synced to local storage. Refresh the page to see changes.",
      });
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast({
        title: "Error",
        description: "Failed to sync data from server",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const clearLocalData = () => {
    if (confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      LocalStorageManager.clearAll();
      toast({
        title: "Success",
        description: "Local data cleared. Refresh the page to see changes.",
      });
    }
  };

  const getStorageStats = () => {
    return {
      notes: LocalStorageManager.getNotes().length,
      tasks: LocalStorageManager.getTasks().length,
      wikis: LocalStorageManager.getWikis().length,
      projects: LocalStorageManager.getProjects().length,
      emails: LocalStorageManager.getEmails().length,
      documents: LocalStorageManager.getDocuments().length,
    };
  };

  const stats = getStorageStats();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">Data Management</h2>
        <p className="text-muted-foreground">
          Export, import, and sync your TaskNetWorkspace data
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isOfflineMode 
              ? "You're in offline mode. Data is stored locally in your browser."
              : "You're in online mode. Data is stored on the server and synced locally."
            }
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Local Storage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <span>Notes:</span><span className="font-medium">{stats.notes}</span>
            <span>Tasks:</span><span className="font-medium">{stats.tasks}</span>
            <span>Wiki Pages:</span><span className="font-medium">{stats.wikis}</span>
            <span>Projects:</span><span className="font-medium">{stats.projects}</span>
            <span>Emails:</span><span className="font-medium">{stats.emails}</span>
            <span>Documents:</span><span className="font-medium">{stats.documents}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export & Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={exportData} disabled={isExporting} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button asChild variant="outline" className="flex-1" disabled={isImporting}>
                <label htmlFor="import-file">
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                  <input id="import-file" type="file" accept=".json" className="hidden" onChange={importData} disabled={isImporting} />
                </label>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your data as JSON for backup or transfer. Import JSON files to restore data.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={syncWithServer} disabled={isSyncing || isOfflineMode} className="w-full">
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync from Server to Local'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Download server data to your local storage for offline access. Syncing is disabled in offline mode.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Local Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={clearLocalData} variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Local Data
            </Button>
            <p className="text-sm text-muted-foreground">
              Permanently delete all data stored in your browser. This action cannot be undone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
