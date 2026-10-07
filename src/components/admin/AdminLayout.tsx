import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, FileText, BookOpen, Users, 
  CreditCard, Clock, ListChecks, HelpCircle, Megaphone, 
  Menu, X, LogOut, ChevronRight, UserCircle, MessageSquare, TrendingUp, Lightbulb, Award,
  History, GraduationCap, DollarSign, UserPlus, Baby, ShieldCheck, Star, Sparkles, Landmark, Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

type MenuItem = {
  icon: any;
  label: string;
  href: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    ]
  },
  {
    title: 'STUDENTS',
    items: [
      { icon: ListChecks, label: 'Registrations', href: '/admin/registrations' },
      { icon: Users, label: 'Class Lists', href: '/admin/class-lists' },
      { icon: UserCircle, label: 'Slot-based User List', href: '/admin/slot-users' },
      { icon: Target, label: 'Progress Tracking', href: '/admin/progress' },
      { icon: Lightbulb, label: 'Idea Sandbox', href: '/admin/ideas' },
      { icon: Award, label: 'Achievement Badges', href: '/admin/badges' },
      { icon: HelpCircle, label: 'Enquiries', href: '/admin/enquiries' },
      { icon: UserPlus, label: 'Sibling Requests', href: '/admin/siblings' },
      { icon: MessageSquare, label: 'Parent Requests', href: '/admin/requests' },
      { icon: UserCircle, label: 'Users', href: '/admin/users' },
    ]
  },
  {
    title: 'MONEY',
    items: [
      { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
      { icon: TrendingUp, label: 'Revenue Forecasting', href: '/admin/revenue' },
      { icon: DollarSign, label: 'Pricing Plans', href: '/admin/pricing' },
      { icon: Landmark, label: 'Bank Accounts', href: '/admin/payment-accounts' },
    ]
  },
  {
    title: 'COURSE',
    items: [
      { icon: BookOpen, label: 'Courses', href: '/admin/courses' },
      { icon: Clock, label: 'Class Slots', href: '/admin/slots' },
      { icon: GraduationCap, label: 'Age Groups', href: '/admin/age-groups' },
    ]
  },
  {
    title: 'WEBSITE',
    items: [
      { icon: FileText, label: 'Site Content', href: '/admin/content' },
      { icon: ShieldCheck, label: 'FAQs', href: '/admin/faqs' },
      { icon: Star, label: 'Testimonials', href: '/admin/testimonials' },
      { icon: Sparkles, label: 'Project Examples', href: '/admin/projects' },
      { icon: Megaphone, label: 'Announcements', href: '/admin/announcements' },
      { icon: Settings, label: 'Settings', href: '/admin/settings' },
      { icon: History, label: 'Activity Logs', href: '/admin/logs' },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      }
    }
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const allItems = menuSections.flatMap(s => s.items);
  const activeItem = allItems.find(item => item.href === location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-black text-slate-900 tracking-tight">{activeItem?.label || 'Admin'}</span>
        </div>
        <span className="font-bold text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">VM Admin</span>
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white md:relative md:flex md:flex-col transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 hidden md:block border-b border-white/5">
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">V</div>
            VM Admin
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-10">Academy Control</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto no-scrollbar">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative",
                        isActive 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                      {item.label}
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-900/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:text-rose-400 transition-all rounded-xl text-sm font-bold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 md:h-screen overflow-hidden relative flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-slate-100 px-12 py-6 items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeItem?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <p className="text-xs font-black text-slate-900">{profile?.full_name || 'Administrator'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.role === 'admin' ? 'Master Access' : 'Staff Access'}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xs uppercase">
              {profile?.full_name?.[0] || <UserCircle className="w-6 h-6" />}
            </div>
            <div className="w-px h-8 bg-slate-100 mx-2" />
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 p-6 md:p-12">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
