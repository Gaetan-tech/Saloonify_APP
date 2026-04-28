import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import SalonDetail from './pages/SalonDetail';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/pro/Dashboard';
import Boutique from './pages/pro/Boutique';
import Prestations from './pages/pro/Prestations';
import Agenda from './pages/pro/Agenda';
import Reservations from './pages/pro/Reservations';
import Avis from './pages/pro/Avis';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (role && user?.role !== role && user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route index element={<Home />} />
                  <Route path="explore" element={<Explore />} />
                  <Route path="salon/:id" element={<SalonDetail />} />
                  <Route path="booking/:salonId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                  <Route path="my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="pro/dashboard" element={<ProtectedRoute role="COIFFEUR"><Dashboard /></ProtectedRoute>} />
                  <Route path="pro/boutique" element={<ProtectedRoute role="COIFFEUR"><Boutique /></ProtectedRoute>} />
                  <Route path="pro/prestations" element={<ProtectedRoute role="COIFFEUR"><Prestations /></ProtectedRoute>} />
                  <Route path="pro/agenda" element={<ProtectedRoute role="COIFFEUR"><Agenda /></ProtectedRoute>} />
                  <Route path="pro/reservations" element={<ProtectedRoute role="COIFFEUR"><Reservations /></ProtectedRoute>} />
                  <Route path="pro/avis" element={<ProtectedRoute role="COIFFEUR"><Avis /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
