import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, CreditCard, MessageSquare, 
  Calendar, Target, Bell, UserCircle, HelpCircle, LogOut, 
  Menu, X, ChevronRight 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

type MenuItem = {
  icon: any;
  label: string;
  href: string;
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'My Children', href: '/dashboard/children' },
  { icon: UserPlus, label: 'Add Child', href: '/dashboard/add-child' },
  { icon: CreditCard, label: 'Payments', href: '/dashboard/payments' },
  { icon: MessageSquare, label: 'Requests', href: '/dashboard/requests' },
  { icon: Target, label: 'Learning Progress', href: '/dashboard/learning-progress' },
  { icon: Bell, label: 'Announcements', href: '/dashboard/notifications' },
  { icon: UserCircle, label: 'Profile / Settings', href: '/dashboard/profile' },
  { icon: HelpCircle, label: 'Help / Contact', href: '/dashboard/help' },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } else {
        navigate('/login');
      }
    }
    getProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isItemActive = (href: string) => {
    // Exact match for dashboard to avoid matching all subroutes
    if (href === '/dashboard') return location.pathname === '/dashboard';
    
    // For other sections, match exact or subroutes (e.g. /dashboard/children/123)
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const activeItem = menuItems.find(item => isItemActive(item.href));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>
          <span className="font-black text-slate-900 tracking-tight">{activeItem?.label || 'Academy'}</span>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">V</div>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 hidden md:block">
          <Link to="/" className="text-xl font-black tracking-tight text-blue-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">V</div>
            VM Vibe
          </Link>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 ml-10">Parent Portal</p>
        </div>

        <nav className="flex-1 px-4 py-4 md:py-0 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                {item.label}
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
              {profile?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{profile?.full_name || 'Parent'}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">Premium Account</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl text-sm font-bold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 md:h-screen overflow-auto">
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
