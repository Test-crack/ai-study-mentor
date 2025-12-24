import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { DifficultyType, CoursesFilters as FiltersType } from '../types';

interface CoursesFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export function CoursesFilters({ filters, onFiltersChange }: CoursesFiltersProps) {
  const handleDifficultyChange = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: value === 'all' ? undefined : (value as DifficultyType),
      page: 1, // Reset to first page
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    onFiltersChange({
      ...filters,
      sortBy: sortBy as FiltersType['sortBy'],
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters = filters.difficulty || filters.domain || filters.sortBy;

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-purple-600 hover:text-purple-700"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Difficulty Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Difficulty</label>
          <Select
            value={filters.difficulty || 'all'}
            onValueChange={handleDifficultyChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value={DifficultyType.BEGINNER}>Beginner</SelectItem>
              <SelectItem value={DifficultyType.INTERMEDIATE}>Intermediate</SelectItem>
              <SelectItem value={DifficultyType.ADVANCED}>Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <Select
            value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Most Recent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Most Recent</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="duration_minutes-asc">Duration: Short to Long</SelectItem>
              <SelectItem value="duration_minutes-desc">Duration: Long to Short</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Per Page */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Show</label>
          <Select
            value={filters.limit?.toString() || '12'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, limit: parseInt(value), page: 1 })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="12 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8 per page</SelectItem>
              <SelectItem value="12">12 per page</SelectItem>
              <SelectItem value="24">24 per page</SelectItem>
              <SelectItem value="48">48 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
