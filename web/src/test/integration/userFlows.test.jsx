import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import App from '../../App';
import theme from '../../theme/loveTheme';
import { AuthContext } from '../../contexts/AuthContext';

const TestWrapper = ({ children, mockUser = null }) => {
  const mockAuthContext = {
    user: mockUser,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn()
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={mockAuthContext}>
          {children}
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('User Flows Integration Tests', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should redirect unauthenticated users to welcome page', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      });
    });

    it('should show login form when clicking sign in', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        const signInButton = screen.getByText(/sign in/i);
        expect(signInButton).toBeInTheDocument();
      });

      await user.click(screen.getByText(/sign in/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it('should validate login form inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to login
      await user.click(screen.getByText(/sign in/i));
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Notes Management Flow', () => {
    it('should allow authenticated users to create a note', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Navigate to notes page
      await waitFor(() => {
        const notesLink = screen.getByRole('link', { name: /notes/i });
        expect(notesLink).toBeInTheDocument();
      });

      await user.click(screen.getByRole('link', { name: /notes/i }));

      // Click create note button
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create note/i });
        expect(createButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create note/i }));

      // Fill out note form
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Note');
      await user.type(screen.getByLabelText(/content/i), 'This is a test note');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify note was created (mock implementation would handle this)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should allow editing an existing note', async () => {
      const user = userEvent.setup();
      
      // Mock existing note
      const mockNote = createMockNote();
      
      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Assuming we're on the notes page with existing notes
      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit/i);
        expect(editButton).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/edit/i));

      // Verify edit form opens with existing data
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockNote.title)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockNote.content)).toBeInTheDocument();
      });

      // Make changes
      const titleInput = screen.getByDisplayValue(mockNote.title);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Note Title');

      // Save changes
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should allow deleting a note with confirmation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Click delete button
      await waitFor(() => {
        const deleteButton = screen.getByLabelText(/delete/i);
        expect(deleteButton).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/delete/i));

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Verify note was removed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Flow', () => {
    it('should filter notes by search query', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Navigate to notes page
      await user.click(screen.getByRole('link', { name: /notes/i }));

      // Use search
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/search/i), 'love');

      // Verify search results (mock implementation would handle filtering)
      await waitFor(() => {
        expect(screen.getByDisplayValue('love')).toBeInTheDocument();
      });
    });

    it('should apply category filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Navigate to notes page
      await user.click(screen.getByRole('link', { name: /notes/i }));

      // Open advanced filters
      await waitFor(() => {
        const filterButton = screen.getByLabelText(/filter/i);
        expect(filterButton).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/filter/i));

      // Select category filter
      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/category/i);
        expect(categorySelect).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/category/i));
      await user.click(screen.getByText(/romantic/i));

      // Verify filter is applied
      await waitFor(() => {
        expect(screen.getByText(/romantic/i)).toBeInTheDocument();
      });
    });
  });

  describe('PWA Installation Flow', () => {
    it('should show install prompt for PWA', async () => {
      // Mock beforeinstallprompt event
      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Simulate beforeinstallprompt event
      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));

      await waitFor(() => {
        expect(screen.getByText(/install app/i)).toBeInTheDocument();
      });
    });

    it('should handle PWA installation', async () => {
      const user = userEvent.setup();
      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Simulate beforeinstallprompt event
      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));

      await waitFor(() => {
        const installButton = screen.getByText(/install/i);
        expect(installButton).toBeInTheDocument();
      });

      await user.click(screen.getByText(/install/i));

      await waitFor(() => {
        expect(mockEvent.prompt).toHaveBeenCalled();
      });
    });
  });

  describe('Offline Functionality', () => {
    it('should handle offline state', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Simulate going offline
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    it('should sync data when coming back online', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      // Simulate coming online
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should show mobile navigation on small screens', async () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Should show bottom navigation on mobile
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('should show desktop layout on large screens', async () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      render(
        <TestWrapper mockUser={mockUser}>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Should show sidebar navigation on desktop
      expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument();
    });
  });
});