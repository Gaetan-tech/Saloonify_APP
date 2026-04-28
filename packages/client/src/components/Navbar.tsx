import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-accent sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-primary tracking-tight">Saloonify</span>
            <span className="text-xs text-secondary font-medium hidden sm:block">✂ Réservez en 1 clic</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/explore" className="text-dark hover:text-primary font-medium text-sm transition-colors px-3 py-2 rounded-lg hover:bg-accent">
              Explorer
            </Link>

            {isAuthenticated && user ? (
              <>
                {user.role === 'COIFFEUR' ? (
                  <Link to="/pro/dashboard" className="text-dark hover:text-primary font-medium text-sm transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                    Mon Espace Pro
                  </Link>
                ) : (
                  <Link to="/my-bookings" className="text-dark hover:text-primary font-medium text-sm transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                    Mes RDV
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-dark hover:text-primary transition-colors">
                    {user.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {user.prenom.charAt(0)}
                      </span>
                    )}
                    <span className="hidden sm:block">{user.prenom}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-primary transition-colors ml-1">
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login" className="text-dark hover:text-primary font-medium text-sm transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  Connexion
                </Link>
                <Link to="/auth/register" className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-pink-700 transition-colors">
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
