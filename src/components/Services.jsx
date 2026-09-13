'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SERVICES_DETAIL } from '@/data/data';

export default function Services() {
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
        <h1 data-aos="fade-up">Our <span>Services</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">Professional services delivered by trusted providers in your area.</p>
      </section>
      <section className="services-detail">
        {SERVICES_DETAIL.map((s, i) => (
          <div key={i} className="service-detail-card" data-aos="fade-up" data-aos-delay={i * 80}>
            <div className="icon"><i className={s.icon}></i></div>
            <div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <ul>
                {s.items.map((item, j) => (
                  <li key={j}><i className="fas fa-check"></i> {item}</li>
                ))}
              </ul>
              <Link href="/booking" className="btn btn-primary">{s.btnText}</Link>
            </div>
          </div>
        ))}
      </section>
      <Footer />
    </>
  );
}
