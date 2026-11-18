import { Route, Routes, useLocation, useOutlet } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import ScrollToTop from '@/components/layout/ScrollToTop';
import AdminPage from '@/pages/AdminPage';
import HomePage from '@/pages/HomePage';
import ApartmentsPage from '@/pages/ApartmentsPage';
import ApartmentDetailPage from '@/pages/ApartmentDetailPage';
import ExperiencePage from '@/pages/ExperiencePage';
import LocationPage from '@/pages/LocationPage';
import GalleryPage from '@/pages/GalleryPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PolicyPage from '@/pages/PolicyPage';
import NotFoundPage from '@/pages/NotFoundPage';
import BookingPage from '@/pages/BookingPage';
import BookingConfirmationPage from '@/pages/BookingConfirmationPage';
import BookingCheckoutPage from '@/pages/BookingCheckoutPage';
import { EASE } from '@/lib/motion';

function PublicSiteLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <SiteHeader />
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {outlet}
      </motion.div>
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
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PolicyPage slug="privacy" />} />
          <Route path="/terms" element={<PolicyPage slug="terms" />} />
          <Route path="/cancellation" element={<PolicyPage slug="cancellation" />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/checkout" element={<BookingCheckoutPage />} />
          <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;
