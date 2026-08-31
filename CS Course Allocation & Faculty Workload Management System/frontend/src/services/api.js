/**
 * API Client for CS Course Allocation Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Token helper
const getAuthHeaders = () => {
  let token = localStorage.getItem('cs_auth_token');
  if (!token || token === 'undefined' || token === 'null') {
    token = 'demo-token-hod';
    localStorage.setItem('cs_auth_token', token);
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const api = {
  // Generic Fetch wrapper with graceful fallback
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        // If 401, auto-correct token to demo-token-hod for smooth local dev
        if (response.status === 401) {
          localStorage.setItem('cs_auth_token', 'demo-token-hod');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      // Safe fallback log
      console.warn(`[API Connection Note: ${endpoint}]`, err.message);
      return { success: false, data: null, error: err.message };
    }
  },

  // Auth
  login: (credentials) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => api.request('/auth/me'),

  // Dashboard & Workload
  getWorkloadSummary: (sessionId) => api.request(`/workload/summary?session_id=${sessionId || ''}`),
  getFacultyWorkload: (facultyId, sessionId) => api.request(`/workload/faculty/${facultyId}?session_id=${sessionId || ''}`),
  simulateAllocation: (payload) => api.request('/workload/simulate', { method: 'POST', body: JSON.stringify(payload) }),

  // Conflicts
  scanConflicts: (sessionId) => api.request(`/conflicts/scan?session_id=${sessionId || ''}`),
  resolveConflict: (id, notes) => api.request(`/conflicts/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes: notes }) }),

  // Allocations
  getAllocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/allocations?${query}`);
  },
  getAllocationGrid: (sessionCode) => api.request(`/allocations/grid?session_code=${sessionCode || 'FA25'}`),
  createAllocation: (payload) => api.request('/allocations', { method: 'POST', body: JSON.stringify(payload) }),
  updateAllocation: (id, payload) => api.request(`/allocations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  submitAllocationForReview: (id, remarks) => api.request(`/allocations/${id}/submit`, { method: 'PATCH', body: JSON.stringify({ remarks }) }),
  approveAllocation: (id, remarks) => api.request(`/allocations/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ remarks }) }),
  rejectAllocation: (id, reason) => api.request(`/allocations/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ rejection_reason: reason }) }),

  // Recommendations
  getRecommendations: (payload) => api.request('/recommendations/course', { method: 'POST', body: JSON.stringify(payload) }),

  // Faculty & Courses
  getFacultyList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/faculty${query ? '?' + query : ''}`);
  },
  createFaculty: (payload) => api.request('/faculty', { method: 'POST', body: JSON.stringify(payload) }),
  updateFaculty: (id, payload) => api.request(`/faculty/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFaculty: (id) => api.request(`/faculty/${id}`, { method: 'DELETE' }),
  getCoursesList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/courses${query ? '?' + query : ''}`);
  },
  createCourse: (payload) => api.request('/courses', { method: 'POST', body: JSON.stringify(payload) }),
  updateCourse: (id, payload) => api.request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCourse: (id) => api.request(`/courses/${id}`, { method: 'DELETE' }),
  getAcademicSessions: () => api.request('/academic/sessions'),
  createAcademicSession: (payload) => api.request('/academic/sessions', { method: 'POST', body: JSON.stringify(payload) }),
};
