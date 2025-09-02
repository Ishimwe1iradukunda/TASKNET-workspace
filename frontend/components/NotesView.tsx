import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, ExternalLink, FileText, Grid, List, Star, Archive, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import { MarkdownRenderer } from './MarkdownRenderer';
import backend from '~backend/client';
import type { Note } from '~backend/workspace/notes/create';

interface NotesViewProps {
  isOfflineMode: boolean;
}

export function NotesView({ isOfflineMode }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [isOfflineMode, searchTerm, selectedTag, sortBy]);

  const loadNotes = async () => {
    try {
      if (isOfflineMode) {
        const localNotes = LocalStorageManager.getNotes();
        let filtered = localNotes;
        
        if (searchTerm) {
          filtered = filtered.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedTag) {
          filtered = filtered.filter(note => note.tags.includes(selectedTag));
        }

        // Sort notes
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'title':
              return a.title.localeCompare(b.title);
            case 'created':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'updated':
            default:
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
        });
        
        setNotes(filtered);
      } else {
        const response = await backend.workspace.listNotes({ 
          search: searchTerm || undefined,
          tag: selectedTag || undefined 
        });
        setNotes(response.notes);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim()) return;
    
    const tags = newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    try {
      if (isOfflineMode) {
        const note = LocalStorageManager.createNote({
          title: newNote.title,
          content: newNote.content,
          tags,
        });
        setNotes(prev => [note, ...prev]);
      } else {
        const note = await backend.workspace.createNote({
          title: newNote.title,
          content: newNote.content,
          tags,
        });
        setNotes(prev => [note, ...prev]);
      }
      
      setNewNote({ title: '', content: '', tags: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    } catch (error) {
      console.error('Failed to create note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const updateNote = async (note: Note) => {
    try {
      if (isOfflineMode) {
        const updated = LocalStorageManager.updateNote(note.id, {
          title: note.title,
          content: note.content,
          tags: note.tags,
        });
        setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
      } else {
        const updated = await backend.workspace.updateNote({
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags,
        });
        setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
      }
      
      setEditingNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error('Failed to update note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
      } else {
        await backend.workspace.deleteNote({ id });
        setNotes(prev => prev.filter(n => n.id !== id));
      }
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const getAllTags = () => {
    const allNotes = isOfflineMode ? LocalStorageManager.getNotes() : notes;
    const tags = new Set<string>();
    allNotes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  };

  const processInternalLinks = (content: string) => {
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, noteName) => {
      const linkedNote = notes.find(n => n.title.toLowerCase() === noteName.toLowerCase());
      if (linkedNote) {
        return `<a href="#" class="text-blue-500 hover:underline" data-note-id="${linkedNote.id}">${noteName}</a>`;
      }
      return match;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card key={note.id} className="h-fit hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">{note.title}</CardTitle>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingNote(note)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteNote(note.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none line-clamp-4">
          <MarkdownRenderer content={processInternalLinks(note.content)} />
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Updated {new Date(note.updatedAt).toLocaleDateString()}
          </p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Star className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Archive className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NoteListItem = ({ note }: { note: Note }) => (
    <Card key={note.id} className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{note.title}</h3>
              {note.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-secondary/50"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {note.content.substring(0, 150)}...
            </p>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(note.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingNote(note)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteNote(note.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Notes</h2>
            <p className="text-muted-foreground">
              Capture thoughts, ideas, and information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Write your note content here... (Markdown supported)"
                    rows={10}
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  />
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={newNote.tags}
                    onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button onClick={createNote} disabled={!newNote.title.trim()}>
                      Create Note
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedTag || 'all'} onValueChange={(value) => setSelectedTag(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {getAllTags().map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: 'updated' | 'created' | 'title') => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || selectedTag) && (
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteListItem key={note.id} note={note} />
            ))}
          </div>
        )}
        
        {notes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedTag ? 'Try adjusting your filters' : 'Create your first note to get started'}
            </p>
          </div>
        )}
      </div>
      
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Note title"
                value={editingNote.title}
                onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              <Textarea
                placeholder="Write your note content here... (Markdown supported)"
                rows={15}
                value={editingNote.content}
                onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={editingNote.tags.join(', ')}
                onChange={(e) => setEditingNote(prev => prev ? { 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                } : null)}
              />
              <div className="flex gap-2">
                <Button onClick={() => updateNote(editingNote)}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingNote(null)}>
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
