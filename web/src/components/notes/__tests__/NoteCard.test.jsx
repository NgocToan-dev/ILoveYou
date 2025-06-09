import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import NoteCard from '../NoteCard';
import theme from '../../../theme/loveTheme';

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('NoteCard', () => {
  const mockNote = {
    id: '1',
    title: 'Test Note',
    content: 'This is a test note content',
    category: 'personal',
    tags: ['love', 'memory'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    photos: [
      { url: 'https://example.com/photo1.jpg', name: 'photo1.jpg' }
    ]
  };

  const defaultProps = {
    note: mockNote,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onClick: vi.fn()
  };

  it('renders note information correctly', () => {
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('This is a test note content')).toBeInTheDocument();
    expect(screen.getByText('love')).toBeInTheDocument();
    expect(screen.getByText('memory')).toBeInTheDocument();
  });

  it('displays category correctly', () => {
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('categories.personal')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = vi.fn();
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} onClick={mockOnClick} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockNote);
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn();
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} onEdit={mockOnEdit} />
      </TestWrapper>
    );

    const editButton = screen.getByLabelText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockNote);
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} onDelete={mockOnDelete} />
      </TestWrapper>
    );

    const deleteButton = screen.getByLabelText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockNote);
  });

  it('renders photos when present', () => {
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} />
      </TestWrapper>
    );

    const photo = screen.getByAltText('photo1.jpg');
    expect(photo).toBeInTheDocument();
    expect(photo).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('displays formatted date', () => {
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} />
      </TestWrapper>
    );

    // The exact date format depends on locale, but it should contain the date
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('handles note without photos', () => {
    const noteWithoutPhotos = { ...mockNote, photos: [] };
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} note={noteWithoutPhotos} />
      </TestWrapper>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles note without tags', () => {
    const noteWithoutTags = { ...mockNote, tags: [] };
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} note={noteWithoutTags} />
      </TestWrapper>
    );

    expect(screen.queryByText('love')).not.toBeInTheDocument();
    expect(screen.queryByText('memory')).not.toBeInTheDocument();
  });

  it('truncates long content', () => {
    const longContent = 'This is a very long content that should be truncated when displayed in the card view because it exceeds the maximum character limit for the preview.';
    const noteWithLongContent = { ...mockNote, content: longContent };
    
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} note={noteWithLongContent} />
      </TestWrapper>
    );

    const contentElement = screen.getByText(/This is a very long content/);
    expect(contentElement).toBeInTheDocument();
  });

  it('applies correct accessibility attributes', () => {
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    const editButton = screen.getByLabelText('Edit');
    expect(editButton).toBeInTheDocument();
    
    const deleteButton = screen.getByLabelText('Delete');
    expect(deleteButton).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    const mockOnClick = vi.fn();
    render(
      <TestWrapper>
        <NoteCard {...defaultProps} onClick={mockOnClick} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledWith(mockNote);
  });
});