import React, { useState } from 'react';
import { Download, Upload, RefreshCw, Trash2, AlertCircle, FileText, CheckCircle, BarChart3, Database, HardDrive, Cloud, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';

interface DataManagerProps {
  isOfflineMode: boolean;
}

export function DataManager({ isOfflineMode }: DataManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    calculateStorageInfo();
  }, []);

  const calculateStorageInfo = () => {
    try {
      const stats = getStorageStats();
      let totalSize = 0;
      
      // Estimate storage usage
      Object.entries(stats).forEach(([key, count]) => {
        totalSize += count * 1024; // Rough estimate
      });

      const storageQuota = navigator.storage?.estimate?.();
      
      setStorageInfo({
        usage: totalSize,
        quota: 50 * 1024 * 1024, // 50MB estimate
        usagePercent: (totalSize / (50 * 1024 * 1024)) * 100,
        lastSync: localStorage.getItem('lastSync') || 'Never',
      });
    } catch (error) {
      console.error('Failed to calculate storage info:', error);
    }
  };

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
          customFields: LocalStorageManager.getCustomFields(),
          forms: LocalStorageManager.getForms(),
          automations: LocalStorageManager.getAutomations(),
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
    setImportProgress(0);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid file format');
      }
      
      setImportProgress(25);
      
      if (isOfflineMode) {
        if (data.notes && Array.isArray(data.notes)) {
          LocalStorageManager.saveNotes(data.notes.map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt || note.created_at),
            updatedAt: new Date(note.updatedAt || note.updated_at),
          })));
        }
        setImportProgress(40);
        
        if (data.tasks && Array.isArray(data.tasks)) {
          LocalStorageManager.saveTasks(data.tasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt || task.created_at),
            updatedAt: new Date(task.updatedAt || task.updated_at),
            dueDate: task.dueDate || task.due_date ? new Date(task.dueDate || task.due_date) : undefined,
          })));
        }
        setImportProgress(60);
        
        if (data.wikis && Array.isArray(data.wikis)) {
          LocalStorageManager.saveWikis(data.wikis.map((wiki: any) => ({
            ...wiki,
            createdAt: new Date(wiki.createdAt || wiki.created_at),
            updatedAt: new Date(wiki.updatedAt || wiki.updated_at),
          })));
        }
        setImportProgress(75);
        
        if (data.projects && Array.isArray(data.projects)) {
          LocalStorageManager.saveProjects(data.projects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt || project.created_at),
            updatedAt: new Date(project.updatedAt || project.updated_at),
            startDate: project.startDate || project.start_date ? new Date(project.startDate || project.start_date) : undefined,
            endDate: project.endDate || project.end_date ? new Date(project.endDate || project.end_date) : undefined,
          })));
        }
        setImportProgress(85);
        
        if (data.emails && Array.isArray(data.emails)) {
          LocalStorageManager.saveEmails(data.emails.map((email: any) => ({
            ...email,
            receivedAt: new Date(email.receivedAt || email.received_at),
          })));
        }
        setImportProgress(95);
        
        if (data.documents && Array.isArray(data.documents)) {
          LocalStorageManager.saveDocuments(data.documents.map((doc: any) => ({
            ...doc,
            createdAt: new Date(doc.createdAt || doc.created_at),
          })));
        }

        // Import additional data types
        if (data.customFields && Array.isArray(data.customFields)) {
          LocalStorageManager.saveCustomFields(data.customFields.map((field: any) => ({
            ...field,
            createdAt: new Date(field.createdAt || field.created_at),
            updatedAt: new Date(field.updatedAt || field.updated_at),
          })));
        }

        if (data.forms && Array.isArray(data.forms)) {
          LocalStorageManager.saveForms(data.forms.map((form: any) => ({
            ...form,
            createdAt: new Date(form.createdAt || form.created_at),
            updatedAt: new Date(form.updatedAt || form.updated_at),
          })));
        }

        if (data.automations && Array.isArray(data.automations)) {
          LocalStorageManager.saveAutomations(data.automations.map((automation: any) => ({
            ...automation,
            createdAt: new Date(automation.createdAt || automation.created_at),
            updatedAt: new Date(automation.updatedAt || automation.updated_at),
          })));
        }
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
      
      setImportProgress(100);
      calculateStorageInfo();
      
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
      setImportProgress(0);
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
      
      localStorage.setItem('lastSync', new Date().toISOString());
      calculateStorageInfo();
      
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
      calculateStorageInfo();
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
      customFields: LocalStorageManager.getCustomFields().length,
      forms: LocalStorageManager.getForms().length,
      automations: LocalStorageManager.getAutomations().length,
    };
  };

  const stats = getStorageStats();
  const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">Data Management</h2>
        <p className="text-muted-foreground">
          Export, import, and sync your TaskNetWorkspace data
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
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
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Data Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{totalItems}</div>
                    <div className="text-sm text-muted-foreground">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.tasks}</div>
                    <div className="text-sm text-muted-foreground">Tasks</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Notes:</span>
                    <Badge variant="secondary">{stats.notes}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects:</span>
                    <Badge variant="secondary">{stats.projects}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Wiki Pages:</span>
                    <Badge variant="secondary">{stats.wikis}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Emails:</span>
                    <Badge variant="secondary">{stats.emails}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Documents:</span>
                    <Badge variant="secondary">{stats.documents}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Custom Fields:</span>
                    <Badge variant="secondary">{stats.customFields}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Forms:</span>
                    <Badge variant="secondary">{stats.forms}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Automations:</span>
                    <Badge variant="secondary">{stats.automations}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export & Import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={exportData} disabled={isExporting} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                  <Button asChild variant="outline" className="flex-1" disabled={isImporting}>
                    <label htmlFor="import-file" className="cursor-pointer">
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
                
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing data...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  Export your data as JSON for backup or transfer. Import JSON files to restore data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Backup Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">Weekly Backups</div>
                    <div className="text-sm text-muted-foreground">Export your data weekly to prevent data loss</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">Multiple Locations</div>
                    <div className="text-sm text-muted-foreground">Store backups in multiple locations (cloud, local)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">Version Control</div>
                    <div className="text-sm text-muted-foreground">Keep multiple backup versions for recovery options</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Synchronization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={syncWithServer} disabled={isSyncing || isOfflineMode} className="w-full">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync from Server to Local'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Download server data to your local storage for offline access. Syncing is disabled in offline mode.
                </p>
                {storageInfo && (
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Last Sync</div>
                      <div className="text-muted-foreground">
                        {storageInfo.lastSync !== 'Never' 
                          ? new Date(storageInfo.lastSync).toLocaleString()
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Status</span>
                    <Badge variant={isOfflineMode ? "destructive" : "default"}>
                      {isOfflineMode ? "Offline" : "Online"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Sync</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conflict Resolution</span>
                    <Badge variant="secondary">Server Wins</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storageInfo && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used Storage</span>
                        <span>{formatFileSize(storageInfo.usage)} / {formatFileSize(storageInfo.quota)}</span>
                      </div>
                      <Progress value={storageInfo.usagePercent} className="w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Browser Storage</div>
                        <div className="text-muted-foreground">LocalStorage + IndexedDB</div>
                      </div>
                      <div>
                        <div className="font-medium">Sync Status</div>
                        <div className="text-muted-foreground">
                          {isOfflineMode ? "Local Only" : "Cloud Synced"}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Storage Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={clearLocalData} variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Local Data
                </Button>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all data stored in your browser. This action cannot be undone.
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: This will remove all offline data. Make sure you have a backup or can sync from the server.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
