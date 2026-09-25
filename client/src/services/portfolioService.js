import api from './api';

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, val);
    }
  }
  return searchParams.toString();
};

export const portfolioService = {
  /**
   * Fetch portfolio profile information
   */
  async getProfile() {
    const res = await api.get('/profile');
    return res.data;
  },

  /**
   * Update portfolio profile information (protected)
   */
  async updateProfile(profileData) {
    const res = await api.put('/profile', profileData);
    return res.data;
  },

  /**
   * Fetch all portfolio projects
   */
  async getProjects() {
    const res = await api.get('/projects');
    return res.data || [];
  },

  /**
   * Fetch single project by ID
   */
  async getProjectById(id) {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  /**
   * Create a new portfolio project (protected)
   */
  async createProject(projectData) {
    const res = await api.post('/projects', projectData);
    return res.data;
  },

  /**
   * Update an existing project by ID (protected)
   */
  async updateProject(id, projectData) {
    const res = await api.put(`/projects/${id}`, projectData);
    return res.data;
  },

  /**
   * Delete a project by ID (protected)
   */
  async deleteProject(id) {
    const res = await api.delete(`/projects/${id}`);
    return res;
  },

  /**
   * Fetch all portfolio skills
   */
  async getSkills() {
    const res = await api.get('/skills');
    return res.data || [];
  },

  /**
   * Fetch single skill by ID
   */
  async getSkillById(id) {
    const res = await api.get(`/skills/${id}`);
    return res.data;
  },

  /**
   * Create a new portfolio skill (protected)
   */
  async createSkill(skillData) {
    const res = await api.post('/skills', skillData);
    return res.data;
  },

  /**
   * Update an existing skill by ID (protected)
   */
  async updateSkill(id, skillData) {
    const res = await api.put(`/skills/${id}`, skillData);
    return res.data;
  },

  /**
   * Delete a skill by ID (protected)
   */
  async deleteSkill(id) {
    const res = await api.delete(`/skills/${id}`);
    return res;
  },

  /**
   * Fetch all portfolio work experiences
   */
  async getExperiences() {
    const res = await api.get('/experience');
    return res.data || [];
  },

  /**
   * Fetch single experience by ID
   */
  async getExperienceById(id) {
    const res = await api.get(`/experience/${id}`);
    return res.data;
  },

  /**
   * Create a new work experience record (protected)
   */
  async createExperience(experienceData) {
    const res = await api.post('/experience', experienceData);
    return res.data;
  },

  /**
   * Update an existing work experience record by ID (protected)
   */
  async updateExperience(id, experienceData) {
    const res = await api.put(`/experience/${id}`, experienceData);
    return res.data;
  },

  /**
   * Delete an experience record by ID (protected)
   */
  async deleteExperience(id) {
    const res = await api.delete(`/experience/${id}`);
    return res;
  },

  /**
   * Fetch all education records
   */
  async getEducation() {
    const res = await api.get('/education');
    return res.data || [];
  },

  /**
   * Fetch single education record by ID
   */
  async getEducationById(id) {
    const res = await api.get(`/education/${id}`);
    return res.data;
  },

  /**
   * Create a new education record (protected)
   */
  async createEducation(educationData) {
    const res = await api.post('/education', educationData);
    return res.data;
  },

  /**
   * Update an existing education record by ID (protected)
   */
  async updateEducation(id, educationData) {
    const res = await api.put(`/education/${id}`, educationData);
    return res.data;
  },

  /**
   * Delete an education record by ID (protected)
   */
  async deleteEducation(id) {
    const res = await api.delete(`/education/${id}`);
    return res;
  },

  /**
   * Fetch all certifications
   */
  async getCertifications() {
    const res = await api.get('/certifications');
    return res.data || [];
  },

  /**
   * Fetch single certification record by ID
   */
  async getCertificationById(id) {
    const res = await api.get(`/certifications/${id}`);
    return res.data;
  },

  /**
   * Create a new certification record (protected)
   */
  async createCertification(certificationData) {
    const res = await api.post('/certifications', certificationData);
    return res.data;
  },

  /**
   * Update an existing certification record by ID (protected)
   */
  async updateCertification(id, certificationData) {
    const res = await api.put(`/certifications/${id}`, certificationData);
    return res.data;
  },

  /**
   * Delete a certification record by ID (protected)
   */
  async deleteCertification(id) {
    const res = await api.delete(`/certifications/${id}`);
    return res;
  },

  /**
   * Fetch all achievements
   * @param {Object} [params] - Optional query params like { all: true }
   */
  async getAchievements(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/achievements${qs ? `?${qs}` : ''}`);
    return res.data || [];
  },

  /**
   * Fetch single achievement by ID
   */
  async getAchievementById(id) {
    const res = await api.get(`/achievements/${id}`);
    return res.data;
  },

  /**
   * Create a new achievement record (protected)
   */
  async createAchievement(achievementData) {
    const res = await api.post('/achievements', achievementData);
    return res.data;
  },

  /**
   * Update an existing achievement record by ID (protected)
   */
  async updateAchievement(id, achievementData) {
    const res = await api.put(`/achievements/${id}`, achievementData);
    return res.data;
  },

  /**
   * Delete an achievement record by ID (protected)
   */
  async deleteAchievement(id) {
    const res = await api.delete(`/achievements/${id}`);
    return res;
  },

  /**
   * Fetch all badges
   * @param {Object} [params] - Optional query params like { all: true }
   */
  async getBadges(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/badges${qs ? `?${qs}` : ''}`);
    return res.data || [];
  },

  /**
   * Fetch single badge by ID
   */
  async getBadgeById(id) {
    const res = await api.get(`/badges/${id}`);
    return res.data;
  },

  /**
   * Create a new badge record (protected)
   */
  async createBadge(badgeData) {
    const res = await api.post('/badges', badgeData);
    return res.data;
  },

  /**
   * Update an existing badge record by ID (protected)
   */
  async updateBadge(id, badgeData) {
    const res = await api.put(`/badges/${id}`, badgeData);
    return res.data;
  },

  /**
   * Delete a badge record by ID (protected)
   */
  async deleteBadge(id) {
    const res = await api.delete(`/badges/${id}`);
    return res;
  },

  /**
   * Submit a contact form message
   * @param {{ name: string, email: string, subject: string, message: string }} payload
   */
  async sendMessage(payload) {
    const res = await api.post('/messages', payload);
    return res.data;
  },

  /**
   * Record a public visitor view (non-blocking, anonymous)
   */
  async recordVisit() {
    const res = await api.post('/analytics/visit', {});
    return res.data;
  },

  /**
   * Fetch all messages (protected admin endpoint)
   */
  async getMessages() {
    const res = await api.get('/messages');
    return res.data || [];
  },

  /**
   * Fetch single message by ID (protected admin endpoint)
   */
  async getMessageById(id) {
    const res = await api.get(`/messages/${id}`);
    return res.data;
  },

  /**
   * Mark message as read by ID (protected admin endpoint)
   */
  async markMessageAsRead(id) {
    const res = await api.put(`/messages/${id}/read`, {});
    return res.data;
  },

  /**
   * Delete message by ID (protected admin endpoint)
   */
  async deleteMessage(id) {
    const res = await api.delete(`/messages/${id}`);
    return res;
  },

  /**
   * Fetch complete analytics records and counts (protected admin endpoint)
   */
  async getAnalytics() {
    const res = await api.get('/analytics');
    return res.data;
  },

  /**
   * Fetch analytics summary metrics (protected admin endpoint)
   */
  async getAnalyticsSummary() {
    const res = await api.get('/analytics/summary');
    return res.data;
  },

  // ─── Advanced Analytics Dashboard (Phase 28) ─────────────────────────────

  /**
   * Fetch high-level summary KPIs for analytics dashboard (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getDashboardSummary(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/dashboard-summary${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch daily activity trends (visits, page views, unique sessions) (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getActivityTrends(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/trends${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch scroll depth milestones and section reach metrics (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getEngagementAnalytics(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/engagement${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch project interaction analytics (views, github clicks, live clicks) (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getProjectAnalytics(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/projects${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch certification interaction analytics (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getCertificationAnalytics(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/certifications${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch resume download funnel analytics (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getResumeFunnelAnalytics(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/resume${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch contact form interaction and external link clicks (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getContactAnalytics(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/contact${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch traffic source, device, browser, and OS distribution (protected)
   * @param {Object} [params] - { range, from, to }
   */
  async getTrafficAndDeviceAnalytics(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/traffic-devices${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch paginated recent events list with server-side filters (protected)
   * @param {Object} [params] - { page, limit, eventType, deviceType, source, section, from, to, range }
   */
  async getRecentEvents(params = {}) {
    const qs = toQueryString(params);
    const res = await api.get(`/analytics/events-list${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Upload a file (protected admin endpoint)
   * @param {File} file - File object from input
   * @param {'avatar' | 'project' | 'certification' | 'resume'} type - Target purpose
   * @returns {Promise<{ success: boolean, url: string, filename?: string, storage: string }>}
   */
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    if (type) {
      formData.append('type', type);
    }
    const res = await api.upload(`/upload?type=${encodeURIComponent(type)}`, formData);
    return res;
  },

  // ─── Resume Download Request (Phase 26) ──────────────────────────────────

  /**
   * Submit a resume download request (public, no auth required)
   * @param {{ name: string, email: string, message?: string }} payload
   */
  async submitResumeRequest(payload) {
    const res = await api.post('/resume-requests', payload);
    return res;
  },

  /**
   * Fetch all resume download requests (protected admin endpoint)
   */
  async getResumeRequests() {
    const res = await api.get('/resume-requests');
    return res.data || [];
  },

  /**
   * Fetch a single resume download request by ID (protected admin endpoint)
   */
  async getResumeRequestById(id) {
    const res = await api.get(`/resume-requests/${id}`);
    return res.data;
  },

  /**
   * Approve a resume download request (protected admin endpoint)
   * @param {string} id - Request MongoDB ID
   */
  async approveResumeRequest(id) {
    const res = await api.put(`/resume-requests/${id}/approve`, {});
    return res;
  },

  /**
   * Reject a resume download request (protected admin endpoint)
   * @param {string} id - Request MongoDB ID
   * @param {string} [rejectionNote] - Optional rejection reason
   */
  async rejectResumeRequest(id, rejectionNote = '') {
    const res = await api.put(`/resume-requests/${id}/reject`, { rejectionNote });
    return res;
  },

  /**
   * Validate a download token and get the resume URL (public endpoint)
   * @param {string} token - Raw approval token from email link
   */
  async validateDownloadToken(token) {
    const res = await api.get(`/resume-requests/download/${token}`);
    return res;
  },
};

export default portfolioService;
