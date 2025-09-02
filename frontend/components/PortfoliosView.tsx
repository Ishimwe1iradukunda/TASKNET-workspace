import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface PortfoliosViewProps {
  isOfflineMode: boolean;
}

export function PortfoliosView({ isOfflineMode }: PortfoliosViewProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    name: '',
    description: '',
    projectIds: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadPortfolios();
    }
  }, [isOfflineMode]);

  const loadPortfolios = async () => {
    try {
      const response = await backend.workspace.listPortfolios();
      setPortfolios(response.portfolios);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolios",
        variant: "destructive",
      });
    }
  };

  const createPortfolio = async () => {
    if (!newPortfolio.name.trim()) return;
    
    try {
      const portfolio = await backend.workspace.createPortfolio({
        name: newPortfolio.name,
        description: newPortfolio.description || undefined,
        projectIds: newPortfolio.projectIds,
      });
      setPortfolios(prev => [portfolio, ...prev]);
      setNewPortfolio({ name: '', description: '', projectIds: [] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Portfolio created successfully",
      });
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to create portfolio",
        variant: "destructive",
      });
    }
  };

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Portfolios</h2>
          <p className="text-muted-foreground">Organize projects into portfolios</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Portfolios Unavailable</h3>
            <p className="text-muted-foreground">
              Portfolio management requires online mode to function properly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolios</h2>
          <p className="text-muted-foreground">Organize projects into portfolios</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Portfolio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Portfolio name"
                value={newPortfolio.name}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, name: e.target.value }))}
              />
              <Textarea
                placeholder="Portfolio description (optional)"
                rows={3}
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button onClick={createPortfolio} disabled={!newPortfolio.name.trim()}>
                  Create Portfolio
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map(portfolio => (
            <Card key={portfolio.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Projects</span>
                    <Badge variant="secondary">{portfolio.projectIds.length}</Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(portfolio.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {portfolios.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No portfolios found</h3>
            <p className="text-muted-foreground">
              Create your first portfolio to organize projects
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
