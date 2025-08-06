import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Generic interface for selectable items
export interface SelectableItem {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

// Compatibility scoring function type
export type CompatibilityScorer<T> = (item: T) => {
  score: number; // 0-100
  reasoning?: string;
  confidence?: number; // 0-100
};

// Recommendation with reasoning
export interface Recommendation<T> {
  item: T;
  score: number;
  reasoning: string;
  confidence: number;
  badges?: string[];
}

// Props for the unified selector
export interface UnifiedSelectorProps<T extends SelectableItem> {
  // Data
  items: T[];
  selectedItems: T[];
  recommendations?: Recommendation<T>[];
  
  // Behavior
  onSelectionChange: (items: T[]) => void;
  multiSelect?: boolean;
  searchable?: boolean;
  categoryGrouping?: boolean;
  
  // Customization
  renderItem?: (item: T, isSelected: boolean, compatibility?: number) => React.ReactNode;
  renderSelectedItem?: (item: T, onRemove: () => void) => React.ReactNode;
  compatibilityScoring?: CompatibilityScorer<T>;
  
  // UI
  placeholder?: string;
  maxHeight?: string;
  showCompatibilityScores?: boolean;
  showRecommendations?: boolean;
  className?: string;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

// Category group for organizing items
interface CategoryGroup<T> {
  category: string;
  items: T[];
}

export function UnifiedSelector<T extends SelectableItem>({
  items,
  selectedItems,
  recommendations = [],
  onSelectionChange,
  multiSelect = true,
  searchable = true,
  categoryGrouping = false,
  renderItem,
  renderSelectedItem,
  compatibilityScoring,
  placeholder = "Search and select items...",
  maxHeight = "400px",
  showCompatibilityScores = false,
  showRecommendations = false,
  className,
  ariaLabel = "Item selector",
  ariaDescription = "Search and select from available items"
}: UnifiedSelectorProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort items based on search term
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => 
      !selectedItems.some(selected => selected.id === item.id)
    );

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    // Sort by compatibility score if available
    if (compatibilityScoring) {
      filtered.sort((a, b) => {
        const scoreA = compatibilityScoring(a).score;
        const scoreB = compatibilityScoring(b).score;
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [items, selectedItems, searchTerm, compatibilityScoring]);

  // Group items by category if requested
  const groupedItems = useMemo((): CategoryGroup<T>[] => {
    if (!categoryGrouping) {
      return [{ category: 'All', items: filteredItems }];
    }

    const groups = new Map<string, T[]>();
    filteredItems.forEach(item => {
      const category = item.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return Array.from(groups.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredItems, categoryGrouping]);

  // Handle item selection
  const handleItemSelect = useCallback((item: T) => {
    if (multiSelect) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange([item]);
      setIsOpen(false);
    }
    setSearchTerm('');
    setFocusedIndex(-1);
  }, [selectedItems, onSelectionChange, multiSelect]);

  // Handle item removal
  const handleItemRemove = useCallback((itemToRemove: T) => {
    onSelectionChange(selectedItems.filter(item => item.id !== itemToRemove.id));
  }, [selectedItems, onSelectionChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = filteredItems.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalItems) {
          handleItemSelect(filteredItems[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [filteredItems, focusedIndex, handleItemSelect]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Default item renderer
  const defaultRenderItem = useCallback((item: T, isSelected: boolean, compatibility?: number) => (
    <div className="flex items-center justify-between w-full p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.name}</span>
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          )}
          {compatibility !== undefined && showCompatibilityScores && (
            <Badge 
              variant={compatibility >= 80 ? "default" : compatibility >= 50 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {compatibility}%
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {item.description}
          </p>
        )}
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </div>
  ), [showCompatibilityScores]);

  // Default selected item renderer
  const defaultRenderSelectedItem = useCallback((item: T, onRemove: () => void) => (
    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
      <span className="text-sm font-medium">{item.name}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-primary/20"
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  ), []);

  return (
    <div className={cn("relative", className)} role="combobox" aria-expanded={isOpen}>
      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <div key={item.id}>
                {renderSelectedItem ? 
                  renderSelectedItem(item, () => handleItemRemove(item)) :
                  defaultRenderSelectedItem(item, () => handleItemRemove(item))
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9 pr-9"
            aria-label={ariaLabel}
            aria-describedby={ariaDescription ? "selector-description" : undefined}
          />
          <ChevronDown 
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      )}

      {ariaDescription && (
        <div id="selector-description" className="sr-only">
          {ariaDescription}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-0" style={{ maxHeight, overflowY: 'auto' }} ref={listRef}>
            {/* Recommendations Section */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Recommended</span>
                </div>
                <div className="space-y-1">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <button
                      key={rec.item.id}
                      className={cn(
                        "w-full text-left rounded-md p-2 transition-colors",
                        "hover:bg-blue-100 focus:bg-blue-100 focus:outline-none",
                        focusedIndex === index && "bg-blue-100"
                      )}
                      onClick={() => handleItemSelect(rec.item)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{rec.item.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {rec.score}%
                        </Badge>
                      </div>
                      {rec.reasoning && (
                        <p className="text-xs text-blue-600 mt-1">{rec.reasoning}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items List */}
            {groupedItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No items found</p>
              </div>
            ) : (
              groupedItems.map((group, groupIndex) => (
                <div key={group.category}>
                  {categoryGrouping && groupedItems.length > 1 && (
                    <div className="sticky top-0 bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                      {group.category}
                    </div>
                  )}
                  {group.items.map((item, itemIndex) => {
                    const globalIndex = groupedItems
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                    
                    const compatibility = compatibilityScoring ? 
                      compatibilityScoring(item).score : undefined;
                    
                    const isSelected = selectedItems.some(selected => selected.id === item.id);
                    const isFocused = focusedIndex === globalIndex;

                    return (
                      <button
                        key={item.id}
                        className={cn(
                          "w-full text-left transition-colors border-b border-border/50 last:border-b-0",
                          "hover:bg-accent/50 focus:bg-accent focus:outline-none",
                          isFocused && "bg-accent",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => handleItemSelect(item)}
                        disabled={isSelected}
                        aria-selected={isFocused}
                      >
                        {renderItem ? 
                          renderItem(item, isSelected, compatibility) :
                          defaultRenderItem(item, isSelected, compatibility)
                        }
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default UnifiedSelector;