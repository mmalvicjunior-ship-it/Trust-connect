'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (path) => pathname === path ? 'active' : '';

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="container">
        {/* Logo - Left */}
        <BrandLogo />
        
        {/* Navigation Links - Center */}
        <ul id="main-nav-links" className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <li><Link href="/" prefetch={false} className={isActive('/')} aria-current={pathname === '/' ? 'page' : undefined}>Home</Link></li>
          <li><Link href="/services" prefetch className={isActive('/services')} aria-current={pathname === '/services' ? 'page' : undefined}>Services</Link></li>
          <li><Link href="/providers" prefetch className={isActive('/providers')} aria-current={pathname === '/providers' ? 'page' : undefined}>Providers</Link></li>
          <li><Link href="/booking" prefetch className={isActive('/booking')} aria-current={pathname === '/booking' ? 'page' : undefined}>Book</Link></li>
          <li><Link href="/about" prefetch className={isActive('/about')} aria-current={pathname === '/about' ? 'page' : undefined}>About</Link></li>
          <li><Link href="/contact" prefetch className={isActive('/contact')} aria-current={pathname === '/contact' ? 'page' : undefined}>Contact</Link></li>
        </ul>
        
        {/* Actions - Right */}
        <div className="nav-actions">
          {user ? (
            <>
              {String(user.userType).toLowerCase() === 'admin' && (
                <Link href="/admin" className="nav-login nav-admin"><i className="fas fa-shield-halved" aria-hidden="true"></i> Admin</Link>
              )}
              <Link href={String(user.userType).toLowerCase() === 'provider' ? '/provider/dashboard' : '/dashboard'} className="nav-login"><i className="fas fa-user" aria-hidden="true"></i> {user.firstName || 'My Account'}</Link>
              <button type="button" onClick={handleSignOut} className="nav-login" style={{ cursor: 'pointer' }}>Sign Out</button>
            </>
          ) : (
            <Link href="/signin" className="nav-login">Sign In</Link>
          )}
          <button
            type="button"
            className="nav-login"
            onClick={() => window.dispatchEvent(new Event('open-ai-chat'))}
            style={{ cursor: 'pointer' }}
            aria-label="Open AI Chat"
          >
            <i className="fa-solid fa-robot" aria-hidden="true" /> AI Search
          </button>
          <Link href="/booking" className="btn btn-primary">Book a Service</Link>
        </div>
        
        {/* Mobile Toggle */}
        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="main-nav-links"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true"></i>
        </button>
      </div>
    </nav>
  );
}
