import api from './api';

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
};

export default portfolioService;
