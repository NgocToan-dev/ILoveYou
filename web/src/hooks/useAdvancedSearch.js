import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';

export const useAdvancedSearch = (items = [], searchFields = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!items.length || !searchFields.length) return null;
    
    return new Fuse(items, {
      keys: searchFields,
      threshold: 0.3, // Adjust sensitivity
      includeScore: true,
      includeMatches: true
    });
  }, [items, searchFields]);

  // Apply search, filters, and sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = items;

    // Apply search
    if (searchQuery.trim() && fuse) {
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map(({ item }) => item);
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = item[key];
          
          // Handle different filter types
          if (typeof value === 'object' && value.type) {
            switch (value.type) {
              case 'date-range':
                const itemDate = new Date(itemValue);
                const startDate = value.start ? new Date(value.start) : null;
                const endDate = value.end ? new Date(value.end) : null;
                
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
              
              case 'array-contains':
                return Array.isArray(itemValue) && itemValue.includes(value.value);
              
              case 'text-contains':
                return itemValue && itemValue.toLowerCase().includes(value.value.toLowerCase());
              
              default:
                return itemValue === value.value;
            }
          }
          
          // Simple equality check
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy.includes('At') || sortBy.includes('Date')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, filters, sortBy, sortOrder, fuse]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return {
    // Results
    filteredAndSortedItems,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Filters
    filters,
    updateFilter,
    removeFilter,
    clearAllFilters,
    
    // Sorting
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    
    // Stats
    totalItems: items.length,
    filteredCount: filteredAndSortedItems.length
  };
};

// Helper function for common filter types
export const createDateRangeFilter = (start, end) => ({
  type: 'date-range',
  start,
  end
});

export const createArrayContainsFilter = (value) => ({
  type: 'array-contains',
  value
});

export const createTextContainsFilter = (value) => ({
  type: 'text-contains',
  value
});