import { CommonActions } from '@react-navigation/native';

class NavigationService {
  constructor() {
    this.navigator = null;
  }

  // Set the navigator reference
  setNavigator = (ref) => {
    this.navigator = ref;
  }

  // Navigate to a specific screen
  navigate(name, params = {}) {
    if (this.navigator) {
      this.navigator.dispatch(
        CommonActions.navigate({
          name,
          params,
        })
      );
    } else {
      console.warn('Navigator not set. Cannot navigate to:', name);
    }
  }

  // Reset navigation stack and navigate to a screen
  reset(name, params = {}) {
    if (this.navigator) {
      this.navigator.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name, params }],
        })
      );
    } else {
      console.warn('Navigator not set. Cannot reset to:', name);
    }
  }

  // Navigate to reminder detail screen
  navigateToReminder(reminderId) {
    this.navigate('ReminderDetail', { reminderId });
  }

  // Navigate to reminders list
  navigateToReminders() {
    this.navigate('RemindersMain');
  }

  // Navigate to notes/messages screen
  navigateToNotes() {
    this.navigate('NotesMain');
  }

  // Navigate to home screen
  navigateToHome() {
    this.navigate('HomeMain');
  }

  // Navigate to a specific note
  navigateToNote(noteId) {
    this.navigate('NoteDetail', { noteId });
  }

  // Navigate based on notification data
  handleNotificationNavigation(data) {
    switch (data?.type) {
      case 'reminder':
        if (data.reminderId) {
          this.navigateToReminder(data.reminderId);
        } else {
          this.navigateToReminders();
        }
        break;
      case 'love-message':
      case 'note':
        if (data.noteId) {
          this.navigateToNote(data.noteId);
        } else {
          this.navigateToNotes();
        }
        break;
      case 'daily-summary':
        this.navigateToReminders();
        break;
      default:
        this.navigateToHome();
    }
  }
}

// Create singleton instance
const navigationService = new NavigationService();

export default navigationService;
