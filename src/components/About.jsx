'use client';

import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function About() {
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
        <h1 data-aos="fade-up">About <span>Trust Connect</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">Connecting you with trusted service providers across Zimbabwe.</p>
      </section>
      <section className="about-page">
        <div className="about-grid">
          <div className="about-content" data-aos="fade-up">
            <h2>Who We Are</h2>
            <p>Trust Connect is Zimbabwe&apos;s leading platform for connecting customers with verified and trusted service providers. We understand how difficult it can be to find reliable professionals, so we have built a platform that makes it easy.</p>
            <p>Our mission is to provide a seamless, secure, and transparent way for you to find the best service providers for your needs.</p>
            <div className="about-stats">
              <div className="about-stat" data-aos="fade-up" data-aos-delay="80"><h3>500+</h3><p>Verified Providers</p></div>
              <div className="about-stat" data-aos="fade-up" data-aos-delay="160"><h3>2,000+</h3><p>Happy Customers</p></div>
              <div className="about-stat" data-aos="fade-up" data-aos-delay="240"><h3>4.8</h3><p>Average Rating</p></div>
            </div>
          </div>
          <div className="about-image" data-aos="fade-left" data-aos-delay="150">
            <div className="icon"><i className="fas fa-handshake"></i></div>
          </div>
        </div>
        <div className="about-values">
          <h2 className="section-title">Our <span>Values</span></h2>
          <p className="section-subtitle">The principles that guide everything we do.</p>
          <div className="values-grid">
            <div className="value-card" data-aos="fade-up"><div className="icon"><i className="fas fa-shield-alt"></i></div><h3>Trust</h3><p>Every provider is verified and vetted for your peace of mind.</p></div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="100"><div className="icon"><i className="fas fa-hand-holding-heart"></i></div><h3>Quality</h3><p>We only work with professionals who deliver exceptional service.</p></div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="200"><div className="icon"><i className="fas fa-clock"></i></div><h3>Reliability</h3><p>Get prompt responses and reliable service every time.</p></div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="300"><div className="icon"><i className="fas fa-lock"></i></div><h3>Security</h3><p>Your data and transactions are always protected.</p></div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
