import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, FolderOpen, BookOpen, Mail, File, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';

interface SearchResult {
  id: string;
  type: "note" | "task" | "project" | "wiki" | "email" | "document";
  title: string;
  content?: string;
  excerpt: string;
  score: number;
  metadata: Record<string, any>;
}

interface EnterpriseSearchViewProps {
  isOfflineMode: boolean;
  globalSearchQuery?: string;
}

export function EnterpriseSearchView({ isOfflineMode, globalSearchQuery = '' }: EnterpriseSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery);
  const [searchType, setSearchType] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [facets, setFacets] = useState<{
    types: Array<{ type: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  }>({ types: [], tags: [] });
  const { toast } = useToast();

  useEffect(() => {
    if (globalSearchQuery) {
      setSearchQuery(globalSearchQuery);
      performSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const performOfflineSearch = (query: string, type?: string) => {
    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search notes
    if (!type || type === 'all' || type === 'notes') {
      const notes = LocalStorageManager.getNotes();
      notes.forEach(note => {
        const titleMatch = note.title.toLowerCase().includes(searchTerm);
        const contentMatch = note.content.toLowerCase().includes(searchTerm);
        const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (titleMatch || contentMatch || tagMatch) {
          results.push({
            id: note.id,
            type: 'note',
            title: note.title,
            content: note.content,
            excerpt: note.content.substring(0, 200) + '...',
            score: titleMatch ? 1.0 : contentMatch ? 0.8 : 0.6,
            metadata: { tags: note.tags, updatedAt: note.updatedAt },
          });
        }
      });
    }
    
    // Search tasks
    if (!type || type === 'all' || type === 'tasks') {
      const tasks = LocalStorageManager.getTasks();
      tasks.forEach(task => {
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description?.toLowerCase().includes(searchTerm);
        const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (titleMatch || descMatch || tagMatch) {
          results.push({
            id: task.id,
            type: 'task',
            title: task.title,
            content: task.description || '',
            excerpt: (task.description || '').substring(0, 200) + '...',
            score: titleMatch ? 1.0 : descMatch ? 0.8 : 0.6,
            metadata: { 
              status: task.status, 
              priority: task.priority, 
              tags: task.tags, 
              updatedAt: task.updatedAt 
            },
          });
        }
      });
    }
    
    // Search projects
    if (!type || type === 'all' || type === 'projects') {
      const projects = LocalStorageManager.getProjects();
      projects.forEach(project => {
        const nameMatch = project.name.toLowerCase().includes(searchTerm);
        const descMatch = project.description?.toLowerCase().includes(searchTerm);
        
        if (nameMatch || descMatch) {
          results.push({
            id: project.id,
            type: 'project',
            title: project.name,
            content: project.description || '',
            excerpt: (project.description || '').substring(0, 200) + '...',
            score: nameMatch ? 1.0 : 0.8,
            metadata: { status: project.status, updatedAt: project.updatedAt },
          });
        }
      });
    }
    
    // Search wikis
    if (!type || type === 'all' || type === 'wikis') {
      const wikis = LocalStorageManager.getWikis();
      wikis.forEach(wiki => {
        const titleMatch = wiki.title.toLowerCase().includes(searchTerm);
        const contentMatch = wiki.content.toLowerCase().includes(searchTerm);
        const tagMatch = wiki.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (titleMatch || contentMatch || tagMatch) {
          results.push({
            id: wiki.id,
            type: 'wiki',
            title: wiki.title,
            content: wiki.content,
            excerpt: wiki.content.substring(0, 200) + '...',
            score: titleMatch ? 1.0 : contentMatch ? 0.8 : 0.6,
            metadata: { tags: wiki.tags, updatedAt: wiki.updatedAt },
          });
        }
      });
    }
    
    // Search emails
    if (!type || type === 'all' || type === 'emails') {
      const emails = LocalStorageManager.getEmails();
      emails.forEach(email => {
        const subjectMatch = email.subject.toLowerCase().includes(searchTerm);
        const bodyMatch = email.body.toLowerCase().includes(searchTerm);
        const senderMatch = email.sender.toLowerCase().includes(searchTerm);
        
        if (subjectMatch || bodyMatch || senderMatch) {
          results.push({
            id: email.id,
            type: 'email',
            title: email.subject,
            content: email.body,
            excerpt: email.body.substring(0, 200) + '...',
            score: subjectMatch ? 1.0 : bodyMatch ? 0.8 : 0.6,
            metadata: { sender: email.sender, isRead: email.isRead, receivedAt: email.receivedAt },
          });
        }
      });
    }
    
    // Search documents
    if (!type || type === 'all' || type === 'documents') {
      const documents = LocalStorageManager.getDocuments();
      documents.forEach(doc => {
        const nameMatch = doc.name.toLowerCase().includes(searchTerm);
        
        if (nameMatch) {
          results.push({
            id: doc.id,
            type: 'document',
            title: doc.name,
            content: '',
            excerpt: `${doc.fileType} - ${(doc.size / 1024 / 1024).toFixed(2)} MB`,
            score: 1.0,
            metadata: { fileType: doc.fileType, size: doc.size, createdAt: doc.createdAt },
          });
        }
      });
    }
    
    // Sort by score and return
    return results.sort((a, b) => b.score - a.score);
  };

  const search = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      let searchResults: SearchResult[];
      
      if (isOfflineMode) {
        searchResults = performOfflineSearch(searchQuery, searchType === 'all' ? undefined : searchType);
        
        // Generate facets for offline search
        const typeCounts = searchResults.reduce((acc, result) => {
          acc[result.type] = (acc[result.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const tagCounts = searchResults.reduce((acc, result) => {
          const tags = result.metadata.tags || [];
          tags.forEach((tag: string) => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);
        
        setFacets({
          types: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
          tags: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })),
        });
      } else {
        const response = await backend.workspace.enterpriseSearch({
          query: searchQuery,
          type: searchType === 'all' ? undefined : searchType as any,
          limit: 50,
        });
        searchResults = response.results;
        setFacets(response.facets);
      }
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setFacets({ types: [], tags: [] });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'project': return <FolderOpen className="w-4 h-4" />;
      case 'wiki': return <BookOpen className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-500';
      case 'task': return 'bg-green-500';
      case 'project': return 'bg-purple-500';
      case 'wiki': return 'bg-orange-500';
      case 'email': return 'bg-red-500';
      case 'document': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-4">Search</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="wikis">Wiki Pages</SelectItem>
              <SelectItem value="emails">Emails</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={search} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Filters Sidebar */}
          {(facets.types.length > 0 || facets.tags.length > 0) && (
            <div className="w-64 border-r border-border p-4 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                
                {facets.types.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Content Type</h4>
                    {facets.types.map(({ type, count }) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {facets.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tags</h4>
                    <div className="space-y-1">
                      {facets.tags.slice(0, 10).map(({ tag, count }) => (
                        <div key={tag} className="flex items-center justify-between text-sm">
                          <span>{tag}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Results */}
          <div className="flex-1 p-6">
            {results.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Found {results.length} results for "{searchQuery}"
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {results.map(result => (
                <Card key={`${result.type}-${result.id}`} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full text-white ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{result.title}</h3>
                          <Badge variant="outline" className="capitalize">
                            {result.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {result.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Score: {Math.round(result.score * 100)}%</span>
                          {result.metadata.updatedAt && (
                            <>
                              <span>•</span>
                              <span>Updated {new Date(result.metadata.updatedAt).toLocaleDateString()}</span>
                            </>
                          )}
                          {result.metadata.tags && result.metadata.tags.length > 0 && (
                            <div className="flex gap-1 ml-2">
                              {result.metadata.tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {searchQuery && results.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Search your workspace</h3>
                <p className="text-muted-foreground">
                  Enter a search term to find content across notes, tasks, projects, and more
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
