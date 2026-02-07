// File: src/components/Sidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, FolderOpen, Users, UserCheck, FileText, Settings, Bot } from 'lucide-react';
// REPAIR: Import the useAuth hook to get the current user's data.
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Employees', href: '/employees', icon: UserCheck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'AI Copilot', href: '/ai-copilot', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings }
];

export default function Sidebar() {
  const router = useRouter();
  // REPAIR: Call the useAuth hook to get the current user object.
  const { user } = useAuth();

  // This is your hidden "Faculty Mode" switch.
  // Set to `true` for your presentation, `false` for development.
  const FACULTY_MODE_ENABLED = false;

  return (
    <aside className="w-64 h-full flex flex-col bg-[#121722] border-r border-white/10 px-4 py-6">
      {/* Logo section is unchanged */}
      <div className="flex items-center mb-12">
        <div className="bg-blue-500 p-2 rounded-lg mr-3"><LayoutDashboard className="h-7 w-7 text-white" /></div>
        <h1 className="text-2xl font-bold text-white">AI Business</h1>
      </div>
      {/* Navigation is unchanged */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = router.pathname === item.href;

            const isLocked = FACULTY_MODE_ENABLED && !['Dashboard', 'Projects'].includes(item.name);

            return (
              <li key={item.href}>
                <Link href={item.href} legacyBehavior>
                  <a
                    onClick={(e) => { if (isLocked) e.preventDefault(); }}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                    ${ selected ? 'bg-blue-700 bg-opacity-30 text-white font-semibold'
                      : isLocked ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${selected ? 'text-blue-300' : 'text-gray-400'}`} />
                      {item.name}
                    </div>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* REPAIR: The Bottom Admin User section is now dynamic. */}
      <div className="mt-auto pt-6">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            {/* It now shows the first letter of the user's email. */}
            <span className="text-lg font-semibold text-white">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {/* In the future, this could show the user's role. For now, it's a static title. */}
            <p className="text-sm font-medium text-white truncate">Administrator</p>
            {/* It now shows the full email of the currently logged-in user. */}
            <p className="text-xs text-gray-400 truncate">{user?.email || 'loading...'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

