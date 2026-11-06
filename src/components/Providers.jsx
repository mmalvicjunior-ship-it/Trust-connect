'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';

function initials(name) {
  return String(name || 'TC')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Stars({ rating, totalReviews }) {
  const safeRating = Number(rating) || 0;
  const rounded = Math.max(0, Math.min(5, Math.round(safeRating)));
  return (
    <div className="rating" role="img" aria-label={`Rated ${safeRating.toFixed(1)} out of 5 from ${totalReviews} reviews`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={star <= rounded ? 'fas fa-star' : 'far fa-star'} aria-hidden="true"></i>
      ))}
      <span className="rating-value">{safeRating.toFixed(1)}</span>
      <span className="rating-count">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
    </div>
  );
}

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');

  const loadProviders = () => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .getProviders()
      .then((data) => {
        if (active) setProviders(data.providers || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load providers.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    const cancel = loadProviders();
    return cancel;
  }, []);

  useEffect(() => {
    const loadScript = (src) => new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
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
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js');
      window.AOS?.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
    })();
  }, []);

  const specialties = useMemo(() => {
    const unique = Array.from(new Set(providers.map((provider) => provider.specialty).filter(Boolean))).sort();
    return ['All', ...unique];
  }, [providers]);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return providers.filter((provider) => {
      if (specialty !== 'All' && provider.specialty !== specialty) return false;
      if (!term) return true;
      return [
        provider.businessName,
        provider.specialty,
        provider.location,
        provider.serviceArea,
        ...(provider.services || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [providers, query, specialty]);

  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1 data-aos="fade-up">Our <span>Providers</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">
          Browse real service professionals registered on Trust Connect.
        </p>
      </section>
      <section className="providers-detail">
        <div className="providers-filters" role="search">
          <div className="form-group">
            <label htmlFor="providers-search">Search providers</label>
            <input
              id="providers-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, trade, service or location"
            />
          </div>
          <div className="form-group">
            <label htmlFor="providers-specialty">Filter by specialty</label>
            <select id="providers-specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
              {specialties.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="providers-status" role="status" aria-live="polite">
            <div className="tc-loader-spinner" aria-hidden="true"></div>
            <p>Loading providers...</p>
          </div>
        ) : error ? (
          <div className="providers-status providers-status-error" role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
            <p>{error}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={loadProviders}>Try again</button>
          </div>
        ) : shown.length === 0 ? (
          <div className="providers-status">
            <i className="fas fa-user-slash" aria-hidden="true"></i>
            <p>{providers.length === 0 ? 'No providers are listed right now.' : 'No providers match your search.'}</p>
            {providers.length === 0 ? (
              <Link href="/register" className="btn btn-primary btn-sm">Become a Provider</Link>
            ) : (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setQuery(''); setSpecialty('All'); }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="providers-grid">
            {shown.map((provider) => {
              const reviewCount = Number(provider.totalReviews) || 0;
              const rating = Number(provider.rating) || 0;
              const services = Array.isArray(provider.services) ? provider.services.filter(Boolean).slice(0, 4) : [];
              return (
                <div key={String(provider._id)} className="provider-detail-card">
                  <div className="avatar">
                    {provider.avatar ? (
                      <img src={provider.avatar} alt={`${provider.businessName || 'Provider'} profile picture`} />
                    ) : (
                      <span aria-hidden="true">{initials(provider.businessName || provider.specialty)}</span>
                    )}
                  </div>
                  <h3>{provider.businessName || 'Service Provider'}</h3>
                  <p className="specialty"><i className="fas fa-briefcase" aria-hidden="true"></i> {provider.specialty || 'General services'}</p>
                  <p className="location"><i className="fas fa-map-marker-alt" aria-hidden="true"></i> {provider.location || provider.serviceArea || 'Location not provided'}</p>
                  {provider.verificationStatus === 'Verified' && (
                    <span className="verified-pill"><i className="fas fa-shield-halved" aria-hidden="true"></i> Verified provider</span>
                  )}
                  {reviewCount > 0 ? (
                    <Stars rating={rating} totalReviews={reviewCount} />
                  ) : (
                    <p className="rating rating-empty">No reviews yet</p>
                  )}
                  <p className="bio">{provider.bio || 'This provider has not added a description yet.'}</p>
                  {services.length > 0 && (
                    <div className="tags">
                      {services.map((service) => <span key={service}>{service}</span>)}
                    </div>
                  )}
                  <Link
                    href={`/booking?provider=${encodeURIComponent(provider._id)}&service=${encodeURIComponent(provider.specialty || '')}`}
                    className="btn btn-primary"
                  >
                    Book Now
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
