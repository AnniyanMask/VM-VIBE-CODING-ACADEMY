import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: 'Course', href: '#course' },
    { name: 'Schedule', href: '#schedule' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

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
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <a 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </a>
              ) : (
                <a 
                  href="/login" 
                  className="text-sm font-medium text-slate-600 hover:text-blue-600"
                >
                  Login
                </a>
              )}
            </div>
            <a 
              href="/register" 
              className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
            >
              Register Now
            </a>
            <button 
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
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
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
            {user ? (
              <a 
                href="/dashboard" 
                className="flex items-center gap-2 text-lg font-medium text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-5 h-5" />
                Dashboard
              </a>
            ) : (
              <a 
                href="/login" 
                className="text-lg font-medium text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                Login
              </a>
            )}
            <a 
              href="/register" 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl text-center font-bold"
              onClick={() => setIsOpen(false)}
            >
              Register Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
