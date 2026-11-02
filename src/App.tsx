import { Navigate, Route, Routes } from 'react-router-dom';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import ScrollToTop from '@/components/layout/ScrollToTop';
import HomePage from '@/pages/HomePage';
import ApartmentsPage from '@/pages/ApartmentsPage';
import ApartmentDetailPage from '@/pages/ApartmentDetailPage';
import ExperiencePage from '@/pages/ExperiencePage';
import LocationPage from '@/pages/LocationPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PolicyPage from '@/pages/PolicyPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Public site routes only. The booking flow (/booking) and the staff dashboard
// (/admin) depend on the Supabase backend and are re-enabled once it is live.
function App() {
  return (
    <>
      <ScrollToTop />
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apartments" element={<ApartmentsPage />} />
        <Route path="/apartments/:slug" element={<ApartmentDetailPage />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/gallery" element={<Navigate to="/apartments" replace />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PolicyPage slug="privacy" />} />
        <Route path="/terms" element={<PolicyPage slug="terms" />} />
        <Route path="/cancellation" element={<PolicyPage slug="cancellation" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SiteFooter />
    </>
  );
}

export default App;