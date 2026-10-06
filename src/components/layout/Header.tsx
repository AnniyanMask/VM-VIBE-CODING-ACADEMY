import { useState, useEffect } from 'react';
import { 
  Menu, X, User, LogOut, LayoutDashboard, Users, UserPlus, 
  CreditCard, MessageSquare, Calendar, Bell, UserCircle, HelpCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
          setProfile(data);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    navigate('/login');
  };

  const isParent = profile?.role === 'parent';

  const navLinks = [
    { name: 'Course', href: '/#course' },
    { name: 'Schedule', href: '/#schedule' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/#contact' },
  ];

  const parentLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Children', href: '/dashboard/children', icon: Users },
    { name: 'Add Child', href: '/dashboard/add-child', icon: UserPlus },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Requests', href: '/dashboard/requests', icon: MessageSquare },
    { name: 'Announcements', href: '/dashboard/notifications', icon: Bell },
    { name: 'Profile / Settings', href: '/dashboard/profile', icon: UserCircle },
    { name: 'Help / Contact', href: '/dashboard/help', icon: HelpCircle },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      if (window.location.pathname === '/') {
        e.preventDefault();
        const id = href.replace('/#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setIsOpen(false);
        }
      }
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Zone 1: Brand title */}
          <a href="/" className="text-xl font-bold tracking-tight text-blue-900">
            VM Vibe <span className="text-blue-600">Academy</span>
          </a>

          {/* Zone 2: Nav links (Desktop) */}
          {!user && (
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>
          )}

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-4">
            {/* Auth Links - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              {user ? (
                <>
                  <a 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </a>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="/login" 
                    className="text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    Login
                  </a>
                  <a 
                    href="/register" 
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                  >
                    Register Now
                  </a>
                </>
              )}
            </div>

            {/* Auth Links - Mobile (Top Bar - Only when menu is CLOSED) */}
            {!isOpen && (
              <div className="flex lg:hidden items-center gap-3">
                {user ? (
                  <a 
                    href="/dashboard" 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </a>
                ) : (
                  <>
                    <a 
                      href="/login" 
                      className="text-xs font-bold text-slate-600 px-2"
                    >
                      Login
                    </a>
                    <a 
                      href="/register" 
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"
                    >
                      Join
                    </a>
                  </>
                )}
              </div>
            )}

            <button 
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300 max-h-[85vh] overflow-y-auto">
          {user && isParent ? (
            <div className="grid grid-cols-1 gap-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2">Parent Menu</p>
              {parentLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold transition-all",
                    location.pathname === link.href ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:bg-blue-50"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon className={cn("w-5 h-5", location.pathname === link.href ? "text-white" : "text-slate-400")} />
                  {link.name}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-4 text-slate-500 font-bold hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="text-lg font-medium text-slate-900"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
              </nav>

              <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                {user ? (
                  <>
                    <a 
                      href="/dashboard" 
                      className="flex items-center gap-3 text-lg font-bold text-blue-600"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Dashboard
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-lg font-medium text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <a 
                      href="/login" 
                      className="text-lg font-medium text-slate-900"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </a>
                    <a 
                      href="/register" 
                      className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-center font-bold shadow-lg shadow-blue-500/10"
                      onClick={() => setIsOpen(false)}
                    >
                      Register Now
                    </a>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
