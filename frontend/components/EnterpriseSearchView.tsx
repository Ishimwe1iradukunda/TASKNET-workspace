import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, FolderOpen, BookOpen, Mail, File, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
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
}

export function EnterpriseSearchView({ isOfflineMode }: EnterpriseSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [facets, setFacets] = useState<{
    types: Array<{ type: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  }>({ types: [], tags: [] });
  const { toast } = useToast();

  const search = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await backend.workspace.enterpriseSearch({
        query: searchQuery,
        type: searchType === 'all' ? undefined : searchType as any,
        limit: 50,
      });
      setResults(response.results);
      setFacets(response.facets);
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

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Enterprise Search</h2>
          <p className="text-muted-foreground">Search across all your content</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Search Unavailable</h3>
            <p className="text-muted-foreground">
              Enterprise search requires online mode to function properly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-4">Enterprise Search</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
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
