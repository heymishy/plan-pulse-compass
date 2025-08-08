import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

export interface SearchFilters {
  searchQuery: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterFields: FilterField[];
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  filterFields,
}) => {
  const handleInputChange = (id: string, value: string) => {
    onFiltersChange({ ...filters, [id]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {filterFields.map(field => (
            <div key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.type === 'text' ? (
                <Input
                  id={field.id}
                  placeholder={field.placeholder}
                  value={filters[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                />
              ) : (
                <Select
                  value={filters[field.id] || 'all'}
                  onValueChange={value => handleInputChange(field.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {field.options?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchAndFilter;
