'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Calendar, LayoutGrid, TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentTable from '@/components/content/ContentTable';
import ContentCalendar from '@/components/content/ContentCalendar';
import ContentGrid from '@/components/content/ContentGrid';
import ContentFilters from '@/components/content/ContentFilters';
import CreateContentDialog from '@/components/content/CreateContentDialog';
import { useContentStore } from '@/store';

export default function ContentPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { 
    filters, 
    viewMode, 
    setFilter, 
    setViewMode 
  } = useContentStore();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Manage all your generated content in one place
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters && <span className="h-2 w-2 bg-primary rounded-full" />}
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showFilters && (
        <ContentFilters onClose={() => setShowFilters(false)} />
      )}

      <div className="mt-6">
        {viewMode === 'table' && <ContentTable />}
        {viewMode === 'grid' && <ContentGrid />}
        {viewMode === 'calendar' && <ContentCalendar />}
      </div>

      <CreateContentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}