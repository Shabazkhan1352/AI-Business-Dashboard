import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
// FIX: Using an explicit path with the file extension to ensure the module is found.
import { useAuth } from '../contexts/AuthContext.js';
import Sidebar from './Sidebar';
import { LogOut, User, Settings, Search } from 'lucide-react';

// UserMenu and Header components are unchanged but included for completeness.
const UserMenu = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    if (!user) {
        return null; // Don't render the menu if there's no user
    }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-3 hover:bg-gray-800/50 p-2 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-md font-semibold text-white">
                        {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                    </span>
                </div>
                 <div className="hidden md:block text-left">
                     <p className="font-semibold text-sm text-white truncate">{user.email}</p>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1f2736] border border-white/10 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                        <div className="px-3 py-2">
                            <p className="text-sm font-medium text-white">Signed in as</p>
                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="my-1 h-px bg-white/10"></div>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 rounded-md">
                            <User size={16} /> My Profile
                        </a>
                        <a href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 rounded-md">
                            <Settings size={16} /> Settings
                        </a>
                        <div className="my-1 h-px bg-white/10"></div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-700/50 rounded-md"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const Header = () => {
  return (
    <header className="flex-1 flex flex-wrap gap-4 justify-between items-center">
      <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-800/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:ring-blue-500 focus:border-blue-500"
          />
      </div>
      <UserMenu />
    </header>
  );
};

// --- THIS IS THE DEFINITIVE FIX ---
export default function Layout({ children }) {
  // We get the user and the loading state from our AuthContext.
  // The `loading` variable tells us if the AuthContext is still trying to fetch the user session.
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // This `useEffect` hook acts as our security guard.
  // It runs whenever the authentication status (user or loading state) changes.
  useEffect(() => {
    // We patiently wait until the AuthContext is no longer loading.
    if (!authLoading) {
      // If, after loading is complete, there is still no user,
      // it means the user is not logged in, so we redirect them.
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, authLoading, router]);

  // While the authentication is in progress OR if there is no user,
  // we show a global loading screen. This is the crucial step that prevents
  // the "Invalid hook call" error, because it stops any child components
  // (like ProjectsPage) from rendering and calling their own hooks prematurely.
  if (authLoading || !user) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <p>Loading Application...</p>
      </div>
    );
  }
  
  // Only when authentication is complete AND we have a valid user object,
  // do we render the full application layout with its children.
  return (
    <div className="bg-gray-900 text-white min-h-screen flex font-sans">
      <div className="fixed left-0 top-0 bottom-0 w-64 z-40">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col ml-64">
        <div className="px-6 py-4 border-b border-white/10">
          <Header />
        </div>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

