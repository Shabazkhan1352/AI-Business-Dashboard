// File: src/components/header.jsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (mounted) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [mounted]);

  // Get page title based on current route
  const getPageTitle = () => {
    if (!mounted) return 'Loading...';
    
    const path = router.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/projects') return 'Projects';
    if (path === '/leads') return 'Leads & Sales';
    if (path === '/employees') return 'Employees';
    if (path === '/reports') return 'Reports';
    if (path === '/settings') return 'Settings';
    return 'AI Business Dashboard';
  };

  const getBreadcrumbs = () => {
    if (!mounted) return ['Dashboard'];
    
    const path = router.pathname;
    const breadcrumbs = ['Dashboard'];
    
    if (path !== '/dashboard') {
      const pageName = getPageTitle();
      if (pageName !== 'AI Business Dashboard' && pageName !== 'Loading...') {
        breadcrumbs.push(pageName);
      }
    }
    
    return breadcrumbs;
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-10 border-b border-white/10">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
        <div className="relative flex h-16 items-center justify-center px-6">
          <div className="animate-pulse h-4 bg-white/10 rounded w-32"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
      
      <div className="relative flex h-16 items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center space-x-2">
            {getBreadcrumbs().map((crumb, index) => (
              <div key={`${crumb}-${index}`} className="flex items-center space-x-2">
                {index > 0 && <span className="text-gray-500">/</span>}
                <span className={`text-sm ${
                  index === getBreadcrumbs().length - 1 
                    ? 'text-white font-medium' 
                    : 'text-gray-400 hover:text-gray-300 cursor-pointer'
                }`}>
                  {crumb}
                </span>
              </div>
            ))}
          </div>

          {/* Page title for mobile */}
          <h1 className="sm:hidden text-lg font-semibold text-white">
            {getPageTitle()}
          </h1>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              placeholder="Search projects, leads, employees..."
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Environment badge */}
          <div className="hidden sm:block">
            <span className="px-2 py-1 text-xs font-semibold text-green-400 bg-green-400/10 rounded-full border border-green-400/20">
              DEV
            </span>
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-white">Admin</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Profile dropdown menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 py-1">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-gray-400">admin@company.com</p>
                </div>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors">
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </button>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </button>
                
                <hr className="border-white/10 my-1" />
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;