import { auth } from './firebase';

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

/**
 * Backend API client for making HTTP requests to the Express backend
 */
class BackendApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authentication headers with Firebase token
   */
  async getAuthHeaders() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const token = await user.getIdToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request to backend API
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getAuthHeaders();
      
      const config = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      };

      console.log(`Making ${config.method || 'GET'} request to:`, url);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'Request failed',
          status: response.status 
        }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Backend API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============= NOTES ENDPOINTS =============

  /**
   * Get user's notes with optional filtering and pagination
   */
  async getNotes(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(noteId) {
    return this.request(`/notes/${noteId}`);
  }

  /**
   * Create a new note
   */
  async createNote(noteData) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId, updateData) {
    return this.request(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId) {
    return this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // ============= REMINDERS ENDPOINTS =============

  /**
   * Get user's reminders
   */
  async getReminders(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/reminders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get a specific reminder by ID
   */
  async getReminderById(reminderId) {
    return this.request(`/reminders/${reminderId}`);
  }

  /**
   * Create a new reminder
   */
  async createReminder(reminderData) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(reminderId, updateData) {
    return this.request(`/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId) {
    return this.request(`/reminders/${reminderId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId) {
    return this.request(`/reminders/${reminderId}/complete`, {
      method: 'PUT',
    });
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId, snoozeData) {
    return this.request(`/reminders/${reminderId}/snooze`, {
      method: 'PUT',
      body: JSON.stringify(snoozeData),
    });
  }

  // ============= COUPLES ENDPOINTS =============

  /**
   * Get couple profile
   */
  async getCoupleProfile() {
    return this.request('/couples/profile');
  }

  /**
   * Create or update couple profile
   */
  async updateCoupleProfile(coupleData) {
    return this.request('/couples/profile', {
      method: 'PUT',
      body: JSON.stringify(coupleData),
    });
  }

  /**
   * Send couple invitation
   */
  async sendCoupleInvitation(invitationData) {
    return this.request('/couples/invite', {
      method: 'POST',
      body: JSON.stringify(invitationData),
    });
  }

  /**
   * Accept couple invitation
   */
  async acceptCoupleInvitation(invitationData) {
    return this.request('/couples/accept-invitation', {
      method: 'PUT',
      body: JSON.stringify(invitationData),
    });
  }

  /**
   * Get couple's shared data
   */
  async getCoupleData() {
    return this.request('/couples/data');
  }

  // ============= LOVE DAYS ENDPOINTS =============

  /**
   * Get love days / milestones
   */
  async getLoveDays() {
    return this.request('/love-days');
  }

  /**
   * Create a new love day
   */
  async createLoveDay(loveDayData) {
    return this.request('/love-days', {
      method: 'POST',
      body: JSON.stringify(loveDayData),
    });
  }

  /**
   * Update an existing love day
   */
  async updateLoveDay(loveDayId, updateData) {
    return this.request(`/love-days/${loveDayId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete a love day
   */
  async deleteLoveDay(loveDayId) {
    return this.request(`/love-days/${loveDayId}`, {
      method: 'DELETE',
    });
  }

  // ============= AUTH ENDPOINTS =============

  /**
   * Get user profile
   */
  async getUserProfile() {
    return this.request('/auth/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  /**
   * Verify token (health check)
   */
  async verifyToken() {
    return this.request('/auth/verify');
  }

  // ============= UTILITY METHODS =============

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Check if backend is available
   */
  async isBackendAvailable() {
    return this.healthCheck();
  }
}

// Create and export singleton instance
export const backendApi = new BackendApiClient();

// Export individual service methods for convenience
export const {
  // Notes
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  
  // Reminders
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  snoozeReminder,
  
  // Couples
  getCoupleProfile,
  updateCoupleProfile,
  sendCoupleInvitation,
  acceptCoupleInvitation,
  getCoupleData,
  
  // Love Days
  getLoveDays,
  createLoveDay,
  updateLoveDay,
  deleteLoveDay,
  
  // Auth
  getUserProfile,
  updateUserProfile,
  verifyToken,
  
  // Utility
  healthCheck,
  isBackendAvailable,
} = backendApi;

export default backendApi;