import { Outlet, Link, useLocation } from 'react-router-dom';
import { BrainCircuit, User, LogOut, Sun, Moon, Home, LayoutDashboard, Settings, Trophy, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import LoginModal from '../components/LoginModal';
import Footer from '../components/Footer';

const MainLayout = () => {
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('theme') === 'light');
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const desktopNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Setup Interview', path: '/setup' },
    { name: 'FAANG Campaign', path: '/campaign-setup' },
    { name: 'ATS Checker', path: '/ats' },
  ];

  const mobileNavLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Interview', path: '/setup', icon: Settings },
    { name: 'FAANG', path: '/campaign-setup', icon: Trophy },
    { name: 'ATS', path: '/ats', icon: FileSearch },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-500/20 blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <nav className="glass-panel mx-4 mt-4 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-20 sticky top-4" style={{ transform: 'none' }}>
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <BrainCircuit className="w-7 h-7 md:w-8 md:h-8 text-primary-500" />
          </motion.div>
          <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-400">
            AI Interviewer
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {desktopNavLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative px-2 py-1 text-sm font-medium transition-colors ${
                location.pathname === link.path ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-[-4px] left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsLightMode(!isLightMode)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 focus:outline-none"
            aria-label="Toggle Theme"
          >
            {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 text-gray-300">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user?.email?.split('@')[0]}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile auth compact */}
          <div className="flex md:hidden items-center gap-1">
            {isAuthenticated ? (
              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8 z-10 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Footer - hidden on mobile since bottom navbar is there */}
      <div className="hidden md:block z-10">
        <Footer />
      </div>

      {/* ===== MOBILE BOTTOM NAVBAR ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-dark-900/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
          <div className="flex items-center justify-around">
            {mobileNavLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 relative min-w-[56px] ${
                    isActive 
                      ? 'text-primary-400' 
                      : 'text-gray-500 active:text-gray-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-primary-400' : ''}`}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
