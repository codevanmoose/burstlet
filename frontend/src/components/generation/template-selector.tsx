'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  Video, 
  FileText, 
  Share2,
  Clock,
  Eye,
  Zap
} from 'lucide-react';
import { 
  viralTemplates, 
  getTemplatesByCategory, 
  getTopViralTemplates,
  ContentTemplate 
} from '@/data/viral-templates';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  onSelectTemplate: (template: ContentTemplate) => void;
  selectedCategory?: 'video' | 'blog' | 'social';
}

export function TemplateSelector({ onSelectTemplate, selectedCategory }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'all'>('trending');

  const filteredTemplates = searchQuery
    ? viralTemplates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
      )
    : activeTab === 'trending'
    ? getTopViralTemplates(6)
    : selectedCategory
    ? getTemplatesByCategory(selectedCategory)
    : viralTemplates;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'blog': return <FileText className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      default: return null;
    }
  };

  const getViralScoreColor = (score: number) => {
    if (score >= 90) return 'text-red-500 bg-red-50';
    if (score >= 80) return 'text-orange-500 bg-orange-50';
    if (score >= 70) return 'text-yellow-500 bg-yellow-50';
    return 'text-blue-500 bg-blue-50';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Viral Content Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Start with proven templates that get millions of views
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          Quick Start
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'trending' | 'all')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trending" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            Trending Now
          </TabsTrigger>
          <TabsTrigger value="all">
            All Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge 
                        className={cn(
                          "gap-1",
                          getViralScoreColor(template.viral_score)
                        )}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {template.viral_score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {template.estimated_views}
                        </span>
                        {template.platform && (
                          <Badge variant="outline" className="text-xs">
                            {template.platform}
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        Use Template →
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-center pt-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Templates updated daily based on trending content
        </p>
      </div>
    </div>
  );
}