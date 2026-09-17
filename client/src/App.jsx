import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Experience from './sections/Experience';
import Education from './sections/Education';
import Certificate from './sections/Certifications';
import Contact from './sections/Contact';
import Footer from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import AdminProjects from './pages/admin/AdminProjects';
import AdminSkills from './pages/admin/AdminSkills';
import AdminExperience from './pages/admin/AdminExperience';
import AdminEducation from './pages/admin/AdminEducation';
import AdminCertifications from './pages/admin/AdminCertifications';
import AdminProfile from './pages/admin/AdminProfile';
import AdminMessages from './pages/admin/AdminMessages';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';
import portfolioService from './services/portfolioService';
import './App.css';

function PortfolioApp() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // 1. Record visitor view anonymously without blocking UI
    portfolioService
      .recordVisit()
      .catch((err) => {
        // Silently log non-fatal analytics error
        console.warn('Visitor analytics record notice:', err.message);
      });

    // 2. Fetch shared profile info
    portfolioService
      .getProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
        }
      })
      .catch((err) => {
        console.warn('Profile fetch notice:', err.message);
      });
  }, []);

  return (
    <>
      <Navbar profile={profile} />
      <Hero profile={profile} />
      <About profile={profile} />
      <Skills />
      <Projects />
      <Experience />
      <Education />
      <Certificate />
      <Contact profile={profile} />
      <Footer profile={profile} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Portfolio Route */}
            <Route path="/" element={<PortfolioApp />} />

            {/* Admin Authentication Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

            {/* Protected Admin Console Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardHome />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="dashboard/projects" element={<Navigate to="/admin/projects" replace />} />
              <Route path="skills" element={<AdminSkills />} />
              <Route path="dashboard/skills" element={<Navigate to="/admin/skills" replace />} />
              <Route path="experience" element={<AdminExperience />} />
              <Route path="dashboard/experience" element={<Navigate to="/admin/experience" replace />} />
              <Route path="education" element={<AdminEducation />} />
              <Route path="dashboard/education" element={<Navigate to="/admin/education" replace />} />
              <Route path="certifications" element={<AdminCertifications />} />
              <Route path="dashboard/certifications" element={<Navigate to="/admin/certifications" replace />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="dashboard/profile" element={<Navigate to="/admin/profile" replace />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="dashboard/messages" element={<Navigate to="/admin/messages" replace />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="dashboard/analytics" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="dashboard/:section" element={<AdminPlaceholder />} />
              <Route path=":section" element={<AdminPlaceholder />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Global Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
