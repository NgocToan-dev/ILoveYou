import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Grid,
  Button,
  Divider
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Sort,
  SwapVert
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import { createDateRangeFilter, createTextContainsFilter } from '@/hooks/useAdvancedSearch';

const AdvancedSearch = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onFilterRemove,
  onClearAll,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  totalItems,
  filteredCount,
  searchPlaceholder = 'Search...',
  availableFilters = []
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const handleDateRangeApply = () => {
    if (dateRange.start || dateRange.end) {
      onFilterChange('createdAt', createDateRangeFilter(dateRange.start, dateRange.end));
    }
  };

  const handleCategoryFilter = (category) => {
    onFilterChange('category', category);
  };

  const handleTagFilter = (tag) => {
    const currentTags = filters.tags?.value || [];
    if (!currentTags.includes(tag)) {
      onFilterChange('tags', createTextContainsFilter(tag));
    }
  };

  const renderFilterChips = () => {
    return Object.entries(filters).map(([key, value]) => {
      let label = key;
      
      if (value.type === 'date-range') {
        const start = value.start ? new Date(value.start).toLocaleDateString() : '';
        const end = value.end ? new Date(value.end).toLocaleDateString() : '';
        label = `${key}: ${start} - ${end}`;
      } else if (value.type) {
        label = `${key}: ${value.value}`;
      } else {
        label = `${key}: ${value}`;
      }

      return (
        <Chip
          key={key}
          label={label}
          onDelete={() => onFilterRemove(key)}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
      );
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Main Search Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            endAdornment: searchQuery && (
              <IconButton onClick={() => onSearchChange('')} size="small">
                <Clear />
              </IconButton>
            )
          }}
        />
        
        <IconButton 
          onClick={() => setShowAdvanced(!showAdvanced)}
          color={showAdvanced ? 'primary' : 'default'}
        >
          <FilterList />
        </IconButton>
        
        <IconButton onClick={onToggleSortOrder}>
          <SwapVert />
        </IconButton>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {t('search.results', { filtered: filteredCount, total: totalItems })}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('search.sortBy')}:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              variant="standard"
            >
              <MenuItem value="createdAt">{t('search.dateCreated')}</MenuItem>
              <MenuItem value="updatedAt">{t('search.dateModified')}</MenuItem>
              <MenuItem value="title">{t('search.title')}</MenuItem>
              <MenuItem value="category">{t('search.category')}</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            ({sortOrder === 'asc' ? '↑' : '↓'})
          </Typography>
        </Box>
      </Box>

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('search.activeFilters')}:
            </Typography>
            <Button
              size="small"
              onClick={onClearAll}
              startIcon={<Clear />}
            >
              {t('search.clearAll')}
            </Button>
          </Box>
          <Box>{renderFilterChips()}</Box>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          {t('search.advancedFilters')}
        </Typography>
        
        <Grid container spacing={2}>
          {/* Date Range Filter */}
          <Grid item xs={12} md={6}>
            <Typography variant="caption" display="block" gutterBottom>
              {t('search.dateRange')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <DatePicker
                label={t('search.startDate')}
                value={dateRange.start}
                onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label={t('search.endDate')}
                value={dateRange.end}
                onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                slotProps={{ textField: { size: 'small' } }}
              />
              <Button
                onClick={handleDateRangeApply}
                variant="outlined"
                size="small"
              >
                {t('search.apply')}
              </Button>
            </Box>
          </Grid>

          {/* Category Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('search.category')}</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                label={t('search.category')}
              >
                <MenuItem value="">{t('search.allCategories')}</MenuItem>
                <MenuItem value="personal">{t('categories.personal')}</MenuItem>
                <MenuItem value="romantic">{t('categories.romantic')}</MenuItem>
                <MenuItem value="memories">{t('categories.memories')}</MenuItem>
                <MenuItem value="plans">{t('categories.plans')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Quick Tag Filters */}
          <Grid item xs={12}>
            <Typography variant="caption" display="block" gutterBottom>
              {t('search.quickTags')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['love', 'anniversary', 'date', 'gift', 'memory', 'plan'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagFilter(tag)}
                  variant={filters.tags?.value === tag ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default AdvancedSearch;