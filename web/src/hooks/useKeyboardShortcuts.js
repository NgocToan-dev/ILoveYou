import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const useKeyboardShortcuts = (handlers = {}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Default handlers
  const defaultHandlers = {
    newNote: () => handlers.newNote?.() || console.log('New note'),
    newReminder: () => handlers.newReminder?.() || console.log('New reminder'),
    search: () => handlers.search?.() || console.log('Search'),
    goHome: () => navigate('/'),
    goNotes: () => navigate('/notes'),
    goReminders: () => navigate('/reminders'),
    goProfile: () => navigate('/profile'),
    toggleSidebar: () => handlers.toggleSidebar?.() || console.log('Toggle sidebar'),
    exportData: () => handlers.exportData?.() || console.log('Export data'),
    toggleLanguage: () => handlers.toggleLanguage?.() || console.log('Toggle language'),
    showHelp: () => handlers.showHelp?.() || console.log('Show help')
  };

  // Navigation shortcuts
  useHotkeys('ctrl+h, cmd+h', (e) => {
    e.preventDefault();
    defaultHandlers.goHome();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+1, cmd+1', (e) => {
    e.preventDefault();
    defaultHandlers.goNotes();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+2, cmd+2', (e) => {
    e.preventDefault();
    defaultHandlers.goReminders();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+3, cmd+3', (e) => {
    e.preventDefault();
    defaultHandlers.goProfile();
  }, { enableOnFormTags: false });

  // Action shortcuts
  useHotkeys('ctrl+n, cmd+n', (e) => {
    e.preventDefault();
    defaultHandlers.newNote();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+r, cmd+r', (e) => {
    e.preventDefault();
    defaultHandlers.newReminder();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    defaultHandlers.search();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+b, cmd+b', (e) => {
    e.preventDefault();
    defaultHandlers.toggleSidebar();
  }, { enableOnFormTags: false });

  // Utility shortcuts
  useHotkeys('ctrl+e, cmd+e', (e) => {
    e.preventDefault();
    defaultHandlers.exportData();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+l, cmd+l', (e) => {
    e.preventDefault();
    defaultHandlers.toggleLanguage();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+?, cmd+?', (e) => {
    e.preventDefault();
    defaultHandlers.showHelp();
  }, { enableOnFormTags: false });

  // Form shortcuts (only when not in form fields)
  useHotkeys('escape', (e) => {
    if (handlers.closeModal) {
      e.preventDefault();
      handlers.closeModal();
    }
  });

  useHotkeys('ctrl+s, cmd+s', (e) => {
    if (handlers.save) {
      e.preventDefault();
      handlers.save();
    }
  }, { enableOnFormTags: true });

  // Return available shortcuts for help display
  const shortcuts = [
    {
      category: t('shortcuts.navigation'),
      items: [
        { keys: ['Ctrl+H', 'Cmd+H'], description: t('shortcuts.goHome') },
        { keys: ['Ctrl+1', 'Cmd+1'], description: t('shortcuts.goNotes') },
        { keys: ['Ctrl+2', 'Cmd+2'], description: t('shortcuts.goReminders') },
        { keys: ['Ctrl+3', 'Cmd+3'], description: t('shortcuts.goProfile') }
      ]
    },
    {
      category: t('shortcuts.actions'),
      items: [
        { keys: ['Ctrl+N', 'Cmd+N'], description: t('shortcuts.newNote') },
        { keys: ['Ctrl+R', 'Cmd+R'], description: t('shortcuts.newReminder') },
        { keys: ['Ctrl+K', 'Cmd+K'], description: t('shortcuts.search') },
        { keys: ['Ctrl+S', 'Cmd+S'], description: t('shortcuts.save') }
      ]
    },
    {
      category: t('shortcuts.interface'),
      items: [
        { keys: ['Ctrl+B', 'Cmd+B'], description: t('shortcuts.toggleSidebar') },
        { keys: ['Ctrl+L', 'Cmd+L'], description: t('shortcuts.toggleLanguage') },
        { keys: ['Escape'], description: t('shortcuts.closeModal') }
      ]
    },
    {
      category: t('shortcuts.utility'),
      items: [
        { keys: ['Ctrl+E', 'Cmd+E'], description: t('shortcuts.exportData') },
        { keys: ['Ctrl+?', 'Cmd+?'], description: t('shortcuts.showHelp') }
      ]
    }
  ];

  return { shortcuts };
};

// Hook for global keyboard shortcuts
export const useGlobalKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent default browser shortcuts that might interfere
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            if (!event.shiftKey) {
              event.preventDefault();
            }
            break;
          case 'n':
          case 'k':
          case 'b':
          case 'l':
          case 'e':
          case 'h':
          case '1':
          case '2':
          case '3':
            event.preventDefault();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Component for displaying keyboard shortcuts help
export const KeyboardShortcutsHelp = ({ shortcuts }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h3>{t('shortcuts.title')}</h3>
      {shortcuts.map((category) => (
        <div key={category.category} style={{ marginBottom: '1rem' }}>
          <h4>{category.category}</h4>
          <div>
            {category.items.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.25rem 0'
                }}
              >
                <span>{item.description}</span>
                <span>
                  {item.keys.map((key, i) => (
                    <span key={i}>
                      <kbd style={{
                        padding: '0.125rem 0.25rem',
                        backgroundColor: '#f1f1f1',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace'
                      }}>
                        {key}
                      </kbd>
                      {i < item.keys.length - 1 && ' / '}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};