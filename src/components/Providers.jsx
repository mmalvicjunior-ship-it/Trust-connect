'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PROVIDERS_DETAIL } from '@/data/data';

export default function Providers() {
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
      window.AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
    })();
  }, []);

  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1 data-aos="fade-up">Our <span>Providers</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">Meet our trusted and verified service professionals.</p>
      </section>
      <section className="providers-detail">
        <div className="providers-grid">
          {PROVIDERS_DETAIL.map((p, i) => (
            <div key={i} className="provider-detail-card" data-aos="fade-up" data-aos-delay={i * 70}>
              <div className="avatar"><i className="fas fa-user"></i></div>
              <h3>{p.name}</h3>
              <p className="specialty"><i className={p.icon}></i> {p.specialty}</p>
              <p className="location"><i className="fas fa-map-marker-alt"></i> {p.location}</p>
              <div className="rating">
                {[...Array(Math.floor(p.rating))].map((_, j) => <i key={j} className="fas fa-star"></i>)}
                {p.rating % 1 !== 0 && <i className="fas fa-star-half-alt"></i>}
                {' '}{p.rating}
              </div>
              <p className="bio">{p.bio}</p>
              <div className="tags">
                {p.tags.map((tag, j) => <span key={j}>{tag}</span>)}
              </div>
              <Link href="/booking" className="btn btn-primary">Book Now</Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
