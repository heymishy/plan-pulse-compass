import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    category?: string;
  }>;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Select an option',
  value,
  onValueChange,
  options,
  emptyMessage = 'No options found',
  searchPlaceholder = 'Search...',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.description &&
        option.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (option.category &&
        option.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setSearchTerm('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setIsOpen(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {label && <Label>{label}</Label>}

      <div className="relative">
        {/* Selected Value Display / Search Input */}
        <div
          className="relative flex items-center min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOption ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{selectedOption.label}</span>
                {selectedOption.category && (
                  <Badge variant="outline" className="text-xs">
                    {selectedOption.category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground">{placeholder}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {option.category && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {option.category}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
