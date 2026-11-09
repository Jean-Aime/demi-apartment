import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import ScrollToTop from '@/components/layout/ScrollToTop';
import AdminPage from '@/pages/AdminPage';
import HomePage from '@/pages/HomePage';
import ApartmentsPage from '@/pages/ApartmentsPage';
import ApartmentDetailPage from '@/pages/ApartmentDetailPage';
import ExperiencePage from '@/pages/ExperiencePage';
import LocationPage from '@/pages/LocationPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PolicyPage from '@/pages/PolicyPage';
import NotFoundPage from '@/pages/NotFoundPage';
import BookingPage from '@/pages/BookingPage';
import BookingConfirmationPage from '@/pages/BookingConfirmationPage';

function PublicSiteLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicSiteLayout />}>
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
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;