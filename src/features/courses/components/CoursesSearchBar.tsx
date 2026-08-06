import { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Search, X } from 'lucide-react';

interface CoursesSearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export function CoursesSearchBar({ onSearch, initialValue = '' }: CoursesSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for courses by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base border-gray-300 focus:border-brand-blue-500 focus:ring-brand-blue-500"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>
      {searchQuery && searchQuery !== debouncedQuery && (
        <div className="absolute left-3 -bottom-5 text-xs text-gray-500">
          Searching...
        </div>
      )}
    </div>
  );
}
