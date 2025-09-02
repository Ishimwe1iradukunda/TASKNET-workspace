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
        if (data.notes) {
          LocalStorageManager.importNotes(data.notes);
        }
        if (data.tasks) {
          LocalStorageManager.importTasks(data.tasks);
        }
        if (data.wikis) {
          data.wikis.forEach((wiki: any) => {
            LocalStorageManager.createWiki({
              title: wiki.title,
              content: wiki.content,
              tags: wiki.tags || [],
              parentId: wiki.parentId,
            });
          });
        }
        if (data.projects) {
          data.projects.forEach((project: any) => {
            LocalStorageManager.createProject({
              name: project.name,
              description: project.description,
              status: project.status || "active",
              startDate: project.startDate ? new Date(project.startDate) : undefined,
              endDate: project.endDate ? new Date(project.endDate) : undefined,
            });
          });
        }
      } else {
        await backend.workspace.importData({
          notes: data.notes,
          tasks: data.tasks,
          overwrite: false,
        });
      }
      
      toast({
        title: "Success",
        description: "Data imported successfully",
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
      // Reset the input
      event.target.value = '';
    }
  };

  const syncWithServer = async () => {
    if (isOfflineMode) {
      setIsSyncing(true);
      try {
        // Export local data
        const localData = {
          notes: LocalStorageManager.getNotes(),
          tasks: LocalStorageManager.getTasks(),
        };
        
        // Import to server
        await backend.workspace.importData({
          notes: localData.notes,
          tasks: localData.tasks,
          overwrite: true,
        });
        
        toast({
          title: "Success",
          description: "Local data synced to server",
        });
      } catch (error) {
        console.error('Failed to sync data:', error);
        toast({
          title: "Error",
          description: "Failed to sync data to server",
          variant: "destructive",
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(true);
      try {
        // Download server data
        const serverData = await backend.workspace.exportData();
        
        // Save to local storage
        LocalStorageManager.importNotes(serverData.notes);
        LocalStorageManager.importTasks(serverData.tasks);
        
        toast({
          title: "Success",
          description: "Server data synced to local storage",
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
    }
  };

  const clearLocalData = () => {
    if (confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      LocalStorageManager.clearAll();
      toast({
        title: "Success",
        description: "Local data cleared",
      });
    }
  };

  const getStorageStats = () => {
    const notes = LocalStorageManager.getNotes();
    const tasks = LocalStorageManager.getTasks();
    const wikis = LocalStorageManager.getWikis();
    const projects = LocalStorageManager.getProjects();
    return {
      notes: notes.length,
      tasks: tasks.length,
      wikis: wikis.length,
      projects: projects.length,
      totalSize: new Blob([JSON.stringify({ notes, tasks, wikis, projects })]).size,
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
            <CardTitle>Storage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Notes:</span>
              <span className="font-medium">{stats.notes}</span>
            </div>
            <div className="flex justify-between">
              <span>Tasks:</span>
              <span className="font-medium">{stats.tasks}</span>
            </div>
            <div className="flex justify-between">
              <span>Wiki Pages:</span>
              <span className="font-medium">{stats.wikis}</span>
            </div>
            <div className="flex justify-between">
              <span>Projects:</span>
              <span className="font-medium">{stats.projects}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Total size:</span>
              <span className="font-medium">{(stats.totalSize / 1024).toFixed(1)} KB</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export & Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={exportData}
                disabled={isExporting}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="flex-1"
                disabled={isImporting}
              >
                <label htmlFor="import-file">
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importData}
                    disabled={isImporting}
                  />
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
            <Button
              onClick={syncWithServer}
              disabled={isSyncing}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing 
                ? 'Syncing...' 
                : isOfflineMode 
                  ? 'Sync Local Data to Server'
                  : 'Sync Server Data to Local'
              }
            </Button>
            
            <p className="text-sm text-muted-foreground">
              {isOfflineMode 
                ? 'Upload your local data to the server for backup and sharing.'
                : 'Download server data to your local storage for offline access.'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Local Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={clearLocalData}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Local Data
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Permanently delete all data stored in your browser. This action cannot be undone.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Git Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              For version control and collaboration, you can export your data and commit it to a Git repository.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Recommended workflow:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Export your data regularly</li>
                <li>Commit the JSON file to your Git repository</li>
                <li>Share the repository with collaborators</li>
                <li>Import updated JSON files when needed</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
