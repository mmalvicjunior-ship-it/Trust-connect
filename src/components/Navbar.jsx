'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
        <Link href="/" className="nav-logo">
          <img src="/images/logo.png" alt="Trust Connect" className="mark" width="34" height="34" />
          Trust Connect
        </Link>
        <ul className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <li><Link href="/" className={isActive('/')}>Home</Link></li>
          <li><Link href="/services" className={isActive('/services')}>Services</Link></li>
          <li><Link href="/providers" className={isActive('/providers')}>Providers</Link></li>
          <li><Link href="/booking" className={isActive('/booking')}>Book</Link></li>
          <li><Link href="/about" className={isActive('/about')}>About</Link></li>
          <li><Link href="/contact" className={isActive('/contact')}>Contact</Link></li>
        </ul>
        <div className="nav-actions">
          {user ? (
            <>
              <Link href="/dashboard" className="nav-login"><i className="fas fa-user"></i> {user.firstName || 'My Account'}</Link>
              <button onClick={handleSignOut} className="nav-login" style={{ cursor: 'pointer' }}>Sign Out</button>
            </>
          ) : (
            <Link href="/signin" className="nav-login">Sign In</Link>
          )}
          <Link href="/booking" className="btn btn-primary btn-sm">Book a Service</Link>
        </div>
        <button className="nav-toggle" aria-label="Menu" onClick={() => setMobileOpen(!mobileOpen)}>
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>
    </nav>
  );
}
