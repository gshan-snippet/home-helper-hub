// Environment-based API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get authorization header
const getAuthHeader = () => {
  const token = sessionStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function to get server base URL for image URLs
const getImageUrl = (relativePath: string): string => {
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  const serverUrl = API_BASE_URL.replace('/api', '');
  return `${serverUrl}${relativePath}`;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        sessionStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string, phone?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone })
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        sessionStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      return response.json();
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }
};

// Posts API
export const postsAPI = {
  createPost: async (operatorId: string, typeOfWork: string, beforeImage: File, afterImage: File, hoursWorked: number, userRating: number) => {
    try {
      const formData = new FormData();
      formData.append('operatorId', operatorId);
      formData.append('typeOfWork', typeOfWork);
      formData.append('beforeImage', beforeImage);
      formData.append('afterImage', afterImage);
      formData.append('hoursWorked', hoursWorked.toString());
      formData.append('userRating', userRating.toString());

      const response = await fetch(`${API_BASE_URL}/posts/create`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData
      });
      return response.json();
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  getAllPosts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/all`, {
        headers: { ...getAuthHeader() }
      });
      const posts = await response.json();
      
      // Convert relative image paths to full URLs
      return posts.map((post: any) => ({
        ...post,
        beforeImage: getImageUrl(post.beforeImage),
        afterImage: getImageUrl(post.afterImage)
      }));
    } catch (error) {
      console.error('Get all posts error:', error);
      throw error;
    }
  },

  getOperatorPosts: async (operatorId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/operator/${operatorId}`, {
        headers: { ...getAuthHeader() }
      });
      const posts = await response.json();
      
      // Convert relative image paths to full URLs
      return posts.map((post: any) => ({
        ...post,
        beforeImage: getImageUrl(post.beforeImage),
        afterImage: getImageUrl(post.afterImage)
      }));
    } catch (error) {
      console.error('Get operator posts error:', error);
      throw error;
    }
  }
};

// Messages API
export const messagesAPI = {
  sendMessage: async (operatorId: string, userId: string, userName: string, messageText: string, senderRole: string = 'consumer') => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ operatorId, userId, userName, messageText, senderRole })
      });
      return response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  sendAppointment: async (operatorId: string, userId: string, userName: string, userPhone: string, appointmentDate: string, location: string, workingHours: string, typeOfWork: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          operatorId,
          userId,
          userName,
          userPhone,
          appointmentDate,
          location,
          workingHours,
          typeOfWork
        })
      });
      return response.json();
    } catch (error) {
      console.error('Send appointment error:', error);
      throw error;
    }
  },

  getOperatorMessages: async (operatorId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/operator/${operatorId}`, {
        headers: { ...getAuthHeader() }
      });
      return response.json();
    } catch (error) {
      console.error('Get operator messages error:', error);
      throw error;
    }
  },

  getConversation: async (operatorId: string, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${operatorId}/${userId}`, {
        headers: { ...getAuthHeader() }
      });
      return response.json();
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }
};
