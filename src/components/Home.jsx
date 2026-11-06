'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SERVICES } from '@/data/data';
import { api } from '@/lib/api';
import SectionTitle from '@/components/SectionTitle';

export default function Home() {
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [providersVersion, setProvidersVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadScript = (src) => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });

    const loadStylesheet = (href) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    };

    (async () => {
      loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css');
      loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.css');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js');
      window.AOS?.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic', disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
      if (window.Swiper) {
        new window.Swiper('.t-swiper', {
          loop: true,
          autoplay: { delay: 5000, disableOnInteraction: false },
          pagination: { el: '.swiper-pagination', clickable: true },
          speed: 600,
        });
      }
    })();

    const btns = document.querySelectorAll('.rippleize, .btn');
    const handleClick = function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    };
    btns.forEach((btn) => btn.addEventListener('click', handleClick));

    return () => {
      btns.forEach((btn) => btn.removeEventListener('click', handleClick));
    };
  }, []);

  useEffect(() => {
    let active = true;
    setProvidersError('');
    setProvidersLoading(true);
    api.getProviders()
      .then((data) => {
        if (active) setProviders((data.providers || []).slice(0, 4));
      })
      .catch((err) => {
        if (active) {
          setProviders([]);
          setProvidersError(err.message || 'Could not load providers.');
        }
      })
      .finally(() => {
        if (active) setProvidersLoading(false);
      });
    return () => { active = false; };
  }, [providersVersion]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchQuery(q);
    const el = document.getElementById('providers');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleProviders = searchQuery.trim()
    ? (providers || []).filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [p.businessName, p.specialty, p.trade, p.serviceArea, p.location].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
    : providers;

  return (
    <>
      <Navbar />

      {/* ===== HERO ===== */}
      <header className="hero" id="top">
        {/* Premium photographic background with subtle blue/white overlay */}
        <div className="hero-bg-photo" aria-hidden="true" />
        <div className="hero-bg-overlay" aria-hidden="true" />
        <div className="hero-bg-grid" aria-hidden="true" />

        <div className="container">
          <div className="hero-copy" data-aos="fade-up">
            <div className="eyebrow on-dark">
              <svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#00b8a9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#00b8a9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Service professionals you can review
            </div>
            <h1 data-aos="fade-up" data-aos-delay="150">Find Trusted Professionals <span className="hl">for Every Job.</span></h1>
            <p className="lead" data-aos="fade-up" data-aos-delay="300">From home repairs to cleaning, electrical work and more — connect with local professionals and get the job done with confidence.</p>
            <div className="hero-ctas" data-aos="fade-up" data-aos-delay="450">
              <Link href="/services" className="btn btn-primary rippleize">Book a Service</Link>
              <Link href="/register" className="btn btn-ghost-light rippleize">Become a Provider</Link>
            </div>
            <form className="hero-search" onSubmit={handleHeroSearch} role="search">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search electricians, plumbers, cleaners, technicians…" aria-label="Search services or professionals" />
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Search</button>
            </form>
            <div className="trust-badges" data-aos="fade-up" data-aos-delay="600">
              <span><i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Verification available</span>
              <span><i className="fa-solid fa-lock" aria-hidden="true"></i> Secure payments</span>
              <span><i className="fa-solid fa-bolt" aria-hidden="true"></i> Fast response</span>
              <span><i className="fa-solid fa-star" aria-hidden="true"></i> Trusted reviews</span>
            </div>
            <div className="hero-social" data-aos="fade-up" data-aos-delay="750">
              <div className="avatar-stack avatar-stack-icons" aria-hidden="true">
                <span><i className="fa-solid fa-shield-halved"></i></span>
                <span><i className="fa-solid fa-lock"></i></span>
                <span><i className="fa-solid fa-star"></i></span>
              </div>
              <div className="rating"><strong>Reviews from completed bookings</strong> · Verified status shown only after approval</div>
            </div>
          </div>

          {/* Right-hand visual composition: service imagery + live assistant panel */}
          <div className="hero-visual" aria-label="Trust Connect booking preview">
            <div className="hv-photo">
              <img
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=760&h=900&fit=crop"
                alt="Service professional at work"
                width="760"
                height="900"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            <div className="hv-chip hv-chip-verify">
              <span className="hv-chip-ic teal"><i className="fa-solid fa-shield-halved" aria-hidden="true"></i></span>
              <span className="hv-chip-copy">
                <strong>Verification available</strong>
                <em>Badge shown after review</em>
              </span>
            </div>

            <div className="hv-chip hv-chip-booking">
              <span className="hv-chip-ic blue"><i className="fa-solid fa-calendar-check" aria-hidden="true"></i></span>
              <span className="hv-chip-copy">
                <strong>Booking in one place</strong>
                <em>Request, confirm, track</em>
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* ===== TRUSTED PROFESSIONALS ===== */}
      <section className="trusted">
        <div className="container">
          <p>Built for the people who keep properties, hotels and organizations running</p>
          <div className="logo-row">
            <span className="lg"><i className="fa-solid fa-hotel" aria-hidden="true"></i> Hotels &amp; hospitality</span>
            <span className="lg"><i className="fa-solid fa-school" aria-hidden="true"></i> Schools &amp; education</span>
            <span className="lg"><i className="fa-solid fa-building" aria-hidden="true"></i> Property management</span>
            <span className="lg"><i className="fa-solid fa-helmet-safety" aria-hidden="true"></i> Construction</span>
            <span className="lg"><i className="fa-solid fa-briefcase" aria-hidden="true"></i> Offices &amp; retail</span>
            <span className="lg"><i className="fa-solid fa-landmark" aria-hidden="true"></i> Civic organizations</span>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="services" id="services">
        <div className="container">
          <SectionTitle eyebrow title="Services" subtitle="Browse service categories and compare providers before you book." />
          <div className="svc-grid">
            {SERVICES.map((s) => (
              <div key={s.title} className="svc-card" data-aos="fade-up">
                <div className="svc-photo"><img src={s.img} alt={s.title} /><div className="svc-icon"><i className={`fa-solid ${s.icon}`} aria-hidden="true"></i></div></div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <Link href={`/booking?service=${encodeURIComponent(s.title)}`} className="svc-link">Learn More <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section className="how" id="how">
        <div className="container">
          <SectionTitle eyebrow title="Process" subtitle="Booking a professional takes three steps. No quotes to chase and no guessing who&apos;ll show up — the process is the same every time." />
          <div className="why-steps">
            <div className="step" data-aos="fade-up">
              <div className="step-num">1<div className="ic-inner"><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i></div></div>
              <h4>Search for a Service</h4>
              <p>Tell us what you need and where — from a leaking tap to a full office fit-out.</p>
            </div>
            <div className="step" data-aos="fade-up" data-aos-delay="120">
              <div className="step-num">2<div className="ic-inner"><i className="fa-solid fa-user-check" aria-hidden="true"></i></div></div>
              <h4>Choose a Provider</h4>
              <p>Compare services, rates and reviews, then pick the right match for the job.</p>
            </div>
            <div className="step" data-aos="fade-up" data-aos-delay="240">
              <div className="step-num">3<div className="ic-inner"><i className="fa-solid fa-check-double" aria-hidden="true"></i></div></div>
              <h4>Book and Get the Job Done</h4>
              <p>Confirm a time, submit your booking, and track the job from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY ===== */}
      <section className="why" id="why">
        <div className="container">
          <div className="why-visual" data-aos="fade-right">
            <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=700&h=880&fit=crop" alt="Technician at work" width="700" height="880" />
            <div className="why-badge">
              <svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 2l6 2.6v5.6c0 4.8-3.1 8.2-6 9.8-2.9-1.6-6-5-6-9.8V4.6L12 2z" stroke="#16a34a" strokeWidth="1.8"/><path d="M8.8 12l2.2 2.2 4.2-4.4" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div><strong>Verification available</strong><span>Badge shown after review</span></div>
            </div>
          </div>
          <div>
            <SectionTitle eyebrow title="Why Trust Connect" subtitle="Verification is available to providers, and a verified badge only appears after the Trust Connect team reviews the request." />
            <div className="why-feats">
              <div className="feat-card" data-aos="fade-up"><div className="ic"><i className="fa-solid fa-id-card-clip" aria-hidden="true"></i></div><h4>Verification Requests</h4><p>Providers can submit identity and document details for review.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="80"><div className="ic"><i className="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i></div><h4>Profile Badges</h4><p>A verified badge is shown only when the review is complete.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="160"><div className="ic"><i className="fa-solid fa-tag" aria-hidden="true"></i></div><h4>Provider Rates</h4><p>See hourly rates and service details before you book.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="240"><div className="ic"><i className="fa-solid fa-lock" aria-hidden="true"></i></div><h4>Account Security</h4><p>Sign-in and role-based dashboards keep accounts separated.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="320"><div className="ic"><i className="fa-solid fa-location-dot" aria-hidden="true"></i></div><h4>Booking Updates</h4><p>Track booking status from your customer or provider dashboard.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="400"><div className="ic"><i className="fa-solid fa-headset" aria-hidden="true"></i></div><h4>Customer Support</h4><p>Contact the Trust Connect team for help with bookings or your account.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROVIDERS ===== */}
      <section className="providers" id="providers">
        <div className="container">
          <SectionTitle eyebrow title="Providers on Trust Connect." subtitle="Real listings from the marketplace. Reviews appear only after completed bookings." />

          {providersLoading ? (
            <div className="home-providers-status" role="status" aria-live="polite">
              <div className="tc-loader-spinner" aria-hidden="true"></div>
              <p>Loading providers...</p>
            </div>
          ) : providersError ? (
            <div className="home-providers-status" role="alert">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              <p>{providersError}</p>
              <button type="button" className="btn btn-outline" onClick={() => setProvidersVersion((value) => value + 1)}>Try again</button>
            </div>
          ) : providers.length === 0 ? (
            <div className="home-providers-status">
              <i className="fa-solid fa-user-slash" aria-hidden="true"></i>
              <p>No providers are listed right now.</p>
              <Link href="/register" className="btn btn-outline">Become a Provider</Link>
            </div>
          ) : searchQuery.trim() && visibleProviders.length === 0 ? (
            <div className="home-providers-status">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
              <p>No providers match “{searchQuery.trim()}”.</p>
              <button type="button" className="btn btn-outline" onClick={() => setSearchQuery('')}>Clear search</button>
            </div>
          ) : (
            <div className="prov-grid">
              {visibleProviders.map((p) => {
                const reviewCount = Number(p.totalReviews) || 0;
                return (
                  <div key={String(p._id)} className="prov-card">
                    <div className="prov-photo">
                      {p.avatar ? (
                        <img src={p.avatar} alt={`${p.businessName || 'Provider'} profile picture`} width="84" height="84" />
                      ) : (
                        <div className="prov-initials" aria-hidden="true">{initials(p.businessName || p.specialty)}</div>
                      )}
                      {p.verificationStatus === 'Verified' && (
                        <div className="verified" title="Verified provider" aria-label="Verified provider"><i className="fa-solid fa-check" aria-hidden="true"></i></div>
                      )}
                    </div>
                    <h4>{p.businessName || 'Service Provider'}</h4>
                    <div className="trade">{p.specialty || 'General services'}</div>
                    {reviewCount > 0 ? (
                      <ProviderStars rating={p.rating} totalReviews={reviewCount} />
                    ) : (
                      <div className="stars muted">No reviews yet</div>
                    )}
                    <div className="prov-meta">
                      <span>{p.location || p.serviceArea || 'Location not provided'}</span>
                      <span><i className="dot"></i>{p.isAvailable ? 'Available' : 'Unavailable'}</span>
                    </div>
                    <Link
                      href={`/booking?provider=${encodeURIComponent(p._id)}&service=${encodeURIComponent(p.specialty || '')}`}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%' }}
                    >
                      Book
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="home-providers-more">
            <Link href="/providers" className="btn btn-outline">View all providers</Link>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats">
        <div className="container">
          <div className="stat-row"><span className="stat-label">Verification</span><span className="stat-number">—</span></div>
          <div className="stat-row"><span className="stat-label">Reviews</span><span className="stat-number">—</span></div>
          <div className="stat-row"><span className="stat-label">Dashboards</span><span className="stat-number">—</span></div>
          <div className="stat-row"><span className="stat-label">Support</span><span className="stat-number">—</span></div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials">
        <div className="container">
          <SectionTitle eyebrow title="Trust that is backed by the record." subtitle="" />
          <div className="swiper t-swiper">
            <div className="swiper-wrapper">
              <div className="swiper-slide">
                <div className="t-card">
                  <div className="t-quote"><i className="fa-solid fa-shield-halved" aria-hidden="true"></i></div>
                  <p className="msg">Providers can request verification. The badge appears only after the Trust Connect team reviews the submission.</p>
                  <div className="t-person"><div><div className="name">Verification</div><div className="loc">Reviewed before a badge is shown</div></div></div>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="t-card">
                  <div className="t-quote"><i className="fa-solid fa-star" aria-hidden="true"></i></div>
                  <p className="msg">Ratings and reviews are collected through the booking flow, so you can judge a provider on completed work.</p>
                  <div className="t-person"><div><div className="name">Reviews</div><div className="loc">Linked to real bookings</div></div></div>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="t-card">
                  <div className="t-quote"><i className="fa-solid fa-lock" aria-hidden="true"></i></div>
                  <p className="msg">Every booking has a status and a record. Customers and providers see the same job history in their dashboards.</p>
                  <div className="t-person"><div><div className="name">Accountability</div><div className="loc">A shared record for every job</div></div></div>
                </div>
              </div>
            </div>
            <div className="swiper-pagination"></div>
          </div>
        </div>
      </section>

      {/* ===== APP SECURITY ===== */}
      <section className="appsec">
        <div className="container">
          <div data-aos="fade-right">
            <div className="eyebrow on-dark"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#00b8a9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#00b8a9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Mobile App</div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.4vw,38px)', marginBottom: '14px' }}>Book and track jobs from your pocket.</h2>
            <p style={{ color: 'rgba(255,255,255,.65)', maxWidth: '440px' }}>The Trust Connect mobile experience will bring bookings, messages and receipts together in one place.</p>
            <div className="app-feats">
              <div className="app-feat"><i className="fa-solid fa-map-location-dot" aria-hidden="true"></i><div><strong>Book Anywhere</strong><span>Request a pro from any location</span></div></div>
              <div className="app-feat"><i className="fa-solid fa-route" aria-hidden="true"></i><div><strong>Track Requests</strong><span>Follow booking status as it changes</span></div></div>
              <div className="app-feat"><i className="fa-solid fa-bell" aria-hidden="true"></i><div><strong>Instant Notifications</strong><span>Updates the moment something changes</span></div></div>
              <div className="app-feat"><i className="fa-solid fa-lock" aria-hidden="true"></i><div><strong>Payment Tracking</strong><span>Follow payment status in-app</span></div></div>
            </div>
            <div className="store-btns">
              <a className="store-btn" aria-disabled="true" title="Coming soon"><i className="fa-brands fa-apple" aria-hidden="true"></i><div><span className="l1">Coming soon</span><span className="l2">App Store</span></div></a>
              <a className="store-btn" aria-disabled="true" title="Coming soon"><i className="fa-brands fa-google-play" aria-hidden="true"></i><div><span className="l1">Coming soon</span><span className="l2">Google Play</span></div></a>
            </div>
          </div>
          <div data-aos="fade-left">
            <div className="phone-mock">
              <div className="phone-screen">
                <div className="phone-notch"></div>
                <div className="phone-ui">
                  <div className="ph-card"><div className="ic"><i className="fa-solid fa-bolt" aria-hidden="true"></i></div><div><b>Electrician confirmed</b><span>Status updated</span></div></div>
                  <div className="ph-card"><div className="ic" style={{ background: '#00b8a9' }}><i className="fa-solid fa-check" aria-hidden="true"></i></div><div><b>Payment recorded</b><span>Tracked in your booking</span></div></div>
                  <div className="ph-card"><div className="ic" style={{ background: '#003cff' }}><i className="fa-solid fa-star" aria-hidden="true"></i></div><div><b>Rate your provider</b><span>After the job is complete</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="cta-final">
        <div className="container">
          <h2 data-aos="fade-up">Book a Trusted Professional Today.</h2>
          <p data-aos="fade-up" data-aos-delay="80">Join homeowners and organizations who use Trust Connect to find and book service professionals.</p>
          <div className="hero-ctas" data-aos="fade-up" data-aos-delay="160">
            <Link href="/services" className="btn btn-white rippleize">Book Now</Link>
            <Link href="/register" className="btn btn-ghost-light rippleize">Become a Provider</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function initials(name) {
  return String(name || 'TC')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ProviderStars({ rating, totalReviews }) {
  const safeRating = Number(rating) || 0;
  const rounded = Math.max(0, Math.min(5, Math.round(safeRating)));
  return (
    <div className="stars" role="img" aria-label={`Rated ${safeRating.toFixed(1)} out of 5 from ${totalReviews} reviews`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={star <= rounded ? 'fa-solid fa-star' : 'fa-regular fa-star'} aria-hidden="true"></i>
      ))}
      <span>{safeRating.toFixed(1)} ({totalReviews})</span>
    </div>
  );
}
