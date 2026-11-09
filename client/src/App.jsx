import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { AdminProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home                from './pages/Home';
import Search              from './pages/Search';
import ListingDetail       from './pages/ListingDetail';
import Login               from './pages/Login';
import Register            from './pages/Register';
import RegisterDealer      from './pages/RegisterDealer';
import ForgotPassword      from './pages/ForgotPassword';
import ResetPassword       from './pages/ResetPassword';

import DealerDashboard     from './pages/dealer/DealerDashboard';
import DealerListings      from './pages/dealer/DealerListings';
import DealerCreateListing from './pages/dealer/DealerCreateListing';
import DealerEditListing   from './pages/dealer/DealerEditListing';
import DealerProfile       from './pages/dealer/DealerProfile';

import UserProfile         from './pages/user/UserProfile';
import UserEnquiries       from './pages/user/UserEnquiries';

// Admin panel is code-split into its own chunk — none of this ships to
// public/dealer/user visitors until someone actually navigates to /admin/*.
const AdminLogin         = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers         = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDealers       = lazy(() => import('./pages/admin/AdminDealers'));
const AdminDealerDetail  = lazy(() => import('./pages/admin/AdminDealerDetail'));
const AdminListings      = lazy(() => import('./pages/admin/AdminListings'));
const AdminListingDetail = lazy(() => import('./pages/admin/AdminListingDetail'));
const AdminBoosts        = lazy(() => import('./pages/admin/AdminBoosts'));

const NotFound = () => (
  <div className="page">
    <Navbar />
    <main id="main" className="page-main container section" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="center" style={{ maxWidth: 460 }}>
        <div className="eyebrow">Error 404</div>
        <h1 className="mt-2" style={{ fontSize: 'var(--fs-hero)', letterSpacing: '-.05em' }}>Wrong turn.</h1>
        <p className="mt-4">The page you're looking for doesn't exist or has moved.</p>
        <div className="row gap-3 mt-8" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-secondary">Go home</Link>
          <Link to="/listings" className="btn btn-primary">Browse cars</Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

const AdminChunkFallback = () => (
  <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }} role="status">
    <span className="spinner" style={{ width: 28, height: 28, color: 'var(--red-text)' }} />
    <span className="sr-only">Loading</span>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          theme="dark"
          toastStyle={{ backgroundColor: '#1a1a1a', color: '#ececec' }}
        />
        <Suspense fallback={<AdminChunkFallback />}>
          <Routes>
          {/* Public */}
          <Route path="/"                element={<Home />} />
          <Route path="/listings"        element={<Search />} />
          <Route path="/listings/:id"    element={<ListingDetail />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/register/dealer" element={<RegisterDealer />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Admin login — public but isolated */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected — any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile"           element={<UserProfile />} />
            <Route path="/profile/enquiries" element={<UserEnquiries />} />
          </Route>

          {/* Protected — dealer only */}
          <Route element={<ProtectedRoute requiredRole="dealer" />}>
            <Route path="/dealer/dashboard"         element={<DealerDashboard />} />
            <Route path="/dealer/listings"          element={<DealerListings />} />
            <Route path="/dealer/listings/create"   element={<DealerCreateListing />} />
            <Route path="/dealer/listings/edit/:id" element={<DealerEditListing />} />
            <Route path="/dealer/profile"           element={<DealerProfile />} />
          </Route>

          {/* Protected — admin only, redirects to /admin/login */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users"     element={<AdminUsers />} />
            <Route path="/admin/dealers"   element={<AdminDealers />} />
            <Route path="/admin/dealers/:dealerId" element={<AdminDealerDetail />} />
            <Route path="/admin/listings"  element={<AdminListings />} />
            <Route path="/admin/listings/:listingId" element={<AdminListingDetail />} />
            <Route path="/admin/boosts"    element={<AdminBoosts />} />
          </Route>

          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
