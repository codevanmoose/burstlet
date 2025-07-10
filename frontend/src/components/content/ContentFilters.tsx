'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Calendar as CalendarIcon, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ContentType, ContentStatus } from '@/lib/api/content';

interface ContentFiltersProps {
  onClose: () => void;
  onFiltersChange?: (filters: FilterState) => void;
}

interface FilterState {
  type?: ContentType;
  status?: ContentStatus;
  platform?: string;
  tag?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const platforms = ['YouTube', 'TikTok', 'Instagram', 'Twitter', 'LinkedIn'];

export default function ContentFilters({ onClose, onFiltersChange }: ContentFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [customTag, setCustomTag] = useState('');

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    setCustomTag('');
    onFiltersChange?.({});
  };

  const addTag = () => {
    if (customTag.trim()) {
      updateFilter('tag', customTag.trim());
      setCustomTag('');
    }
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Filters</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.type && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Type: {filters.type}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('type')}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('status')}
                  />
                </Badge>
              )}
              {filters.platform && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Platform: {filters.platform}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('platform')}
                  />
                </Badge>
              )}
              {filters.tag && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Tag: {filters.tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('tag')}
                  />
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date Range
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      removeFilter('dateFrom');
                      removeFilter('dateTo');
                    }}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Content Type</Label>
            <Select 
              value={filters.type || ''} 
              onValueChange={(value) => updateFilter('type', value as ContentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="BLOG">Blog Post</SelectItem>
                <SelectItem value="SOCIAL">Social Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status || ''} 
              onValueChange={(value) => updateFilter('status', value as ContentStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select 
              value={filters.platform || ''} 
              onValueChange={(value) => updateFilter('platform', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform.toLowerCase()}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag */}
          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <div className="flex gap-2">
              <Input
                id="tag"
                placeholder="Enter tag name..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, 'PPP') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}