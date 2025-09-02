import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import { MarkdownRenderer } from './MarkdownRenderer';
import backend from '~backend/client';

interface Wiki {
  id: string;
  title: string;
  content: string;
  tags: string[];
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WikisViewProps {
  isOfflineMode: boolean;
}

export function WikisView({ isOfflineMode }: WikisViewProps) {
  const [wikis, setWikis] = useState<Wiki[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWiki, setSelectedWiki] = useState<Wiki | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWiki, setEditingWiki] = useState<Wiki | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [newWiki, setNewWiki] = useState({ title: '', content: '', tags: '', parentId: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadWikis();
  }, [isOfflineMode, searchTerm]);

  const loadWikis = async () => {
    try {
      if (isOfflineMode) {
        const localWikis = LocalStorageManager.getWikis();
        let filtered = localWikis;
        
        if (searchTerm) {
          filtered = filtered.filter(wiki => 
            wiki.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wiki.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setWikis(filtered);
      } else {
        const response = await backend.workspace.listWikis({ 
          search: searchTerm || undefined 
        });
        setWikis(response.wikis);
      }
    } catch (error) {
      console.error('Failed to load wikis:', error);
      toast({
        title: "Error",
        description: "Failed to load wiki pages",
        variant: "destructive",
      });
    }
  };

  const createWiki = async () => {
    if (!newWiki.title.trim()) return;
    
    const tags = newWiki.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    try {
      if (isOfflineMode) {
        const wiki = LocalStorageManager.createWiki({
          title: newWiki.title,
          content: newWiki.content,
          tags,
          parentId: newWiki.parentId || undefined,
        });
        setWikis(prev => [wiki, ...prev]);
      } else {
        const wiki = await backend.workspace.createWiki({
          title: newWiki.title,
          content: newWiki.content,
          tags,
          parentId: newWiki.parentId || undefined,
        });
        setWikis(prev => [wiki, ...prev]);
      }
      
      setNewWiki({ title: '', content: '', tags: '', parentId: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Wiki page created successfully",
      });
    } catch (error) {
      console.error('Failed to create wiki:', error);
      toast({
        title: "Error",
        description: "Failed to create wiki page",
        variant: "destructive",
      });
    }
  };

  const updateWiki = async (wiki: Wiki) => {
    try {
      if (isOfflineMode) {
        const updated = LocalStorageManager.updateWiki(wiki.id, {
          title: wiki.title,
          content: wiki.content,
          tags: wiki.tags,
        });
        setWikis(prev => prev.map(w => w.id === wiki.id ? updated : w));
        if (selectedWiki?.id === wiki.id) {
          setSelectedWiki(updated);
        }
      } else {
        const updated = await backend.workspace.updateWiki({
          id: wiki.id,
          title: wiki.title,
          content: wiki.content,
          tags: wiki.tags,
        });
        setWikis(prev => prev.map(w => w.id === wiki.id ? updated : w));
        if (selectedWiki?.id === wiki.id) {
          setSelectedWiki(updated);
        }
      }
      
      setEditingWiki(null);
      toast({
        title: "Success",
        description: "Wiki page updated successfully",
      });
    } catch (error) {
      console.error('Failed to update wiki:', error);
      toast({
        title: "Error",
        description: "Failed to update wiki page",
        variant: "destructive",
      });
    }
  };

  const deleteWiki = async (id: string) => {
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteWiki(id);
        setWikis(prev => prev.filter(w => w.id !== id));
      } else {
        await backend.workspace.deleteWiki({ id });
        setWikis(prev => prev.filter(w => w.id !== id));
      }
      
      if (selectedWiki?.id === id) {
        setSelectedWiki(null);
      }
      
      toast({
        title: "Success",
        description: "Wiki page deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete wiki:', error);
      toast({
        title: "Error",
        description: "Failed to delete wiki page",
        variant: "destructive",
      });
    }
  };

  const buildWikiTree = (wikis: Wiki[], parentId?: string): Wiki[] => {
    return wikis
      .filter(wiki => wiki.parentId === parentId)
      .sort((a, b) => a.title.localeCompare(b.title));
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderWikiTree = (wikis: Wiki[], level = 0): React.ReactNode => {
    return wikis.map(wiki => {
      const children = buildWikiTree(wikis, wiki.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedNodes.has(wiki.id);
      
      return (
        <div key={wiki.id} style={{ marginLeft: level * 16 }}>
          <div 
            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
              selectedWiki?.id === wiki.id ? 'bg-muted' : ''
            }`}
            onClick={() => setSelectedWiki(wiki)}
          >
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(wiki.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            ) : (
              <div className="w-4" />
            )}
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1 truncate">{wiki.title}</span>
          </div>
          
          {hasChildren && isExpanded && (
            <div>
              {renderWikiTree(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const rootWikis = buildWikiTree(wikis);

  return (
    <div className="flex h-full">
      {/* Wiki Tree Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Wiki Pages</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Wiki Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Page title"
                    value={newWiki.title}
                    onChange={(e) => setNewWiki(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <select
                    value={newWiki.parentId}
                    onChange={(e) => setNewWiki(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="">Root level</option>
                    {wikis.map(wiki => (
                      <option key={wiki.id} value={wiki.id}>{wiki.title}</option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="Page content... (Markdown supported)"
                    rows={10}
                    value={newWiki.content}
                    onChange={(e) => setNewWiki(prev => ({ ...prev, content: e.target.value }))}
                  />
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={newWiki.tags}
                    onChange={(e) => setNewWiki(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button onClick={createWiki} disabled={!newWiki.title.trim()}>
                      Create Page
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          {renderWikiTree(rootWikis)}
          
          {wikis.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No wiki pages found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedWiki ? (
          <>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{selectedWiki.title}</h1>
                  {selectedWiki.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedWiki.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingWiki(selectedWiki)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWiki(selectedWiki.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="prose prose-lg max-w-none">
                <MarkdownRenderer content={selectedWiki.content} />
              </div>
              
              <div className="mt-8 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Last updated {new Date(selectedWiki.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a wiki page</h3>
              <p className="text-muted-foreground">
                Choose a page from the sidebar to view its content
              </p>
            </div>
          </div>
        )}
      </div>
      
      {editingWiki && (
        <Dialog open={!!editingWiki} onOpenChange={() => setEditingWiki(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Wiki Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Page title"
                value={editingWiki.title}
                onChange={(e) => setEditingWiki(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              <Textarea
                placeholder="Page content... (Markdown supported)"
                rows={15}
                value={editingWiki.content}
                onChange={(e) => setEditingWiki(prev => prev ? { ...prev, content: e.target.value } : null)}
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={editingWiki.tags.join(', ')}
                onChange={(e) => setEditingWiki(prev => prev ? { 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                } : null)}
              />
              <div className="flex gap-2">
                <Button onClick={() => updateWiki(editingWiki)}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingWiki(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
