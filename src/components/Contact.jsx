'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { api } from '@/lib/api';

export default function Contact() {
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      subject: formData.get('subject').trim(),
      message: formData.get('message').trim(),
    };

    setSubmitting(true);
    try {
      await api.submitContact(payload);
      setToast({ message: 'Your message has been sent. We will get back to you soon.', type: 'success' });
      form.reset();
    } catch (err) {
      setToast({ message: err.message || 'Unable to send your message. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1 data-aos="fade-up">Contact <span>Us</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">We would love to hear from you. Reach out and we will get back to you soon.</p>
      </section>
      <section className="contact-page">
        <div className="contact-grid">
          <div className="contact-info" data-aos="fade-right">
            <h2>Get in Touch</h2>
            <p>Have questions, feedback, or need assistance? We are here to help.</p>
            <div className="contact-item"><div className="icon"><i className="fas fa-map-marker-alt"></i></div><div><h4>Visit Us</h4><p>123 chinotimba Rawu, Victoria Falls, Zimbabwe</p></div></div>
            <div className="contact-item"><div className="icon"><i className="fas fa-phone"></i></div><div><h4>Call Us</h4><p>+263 77 123 4567</p><p>+263 71 234 5678</p></div></div>
            <div className="contact-item"><div className="icon"><i className="fas fa-envelope"></i></div><div><h4>Email Us</h4><p>info@trustconnect.com</p><p>support@trustconnect.com</p></div></div>
            <div className="contact-item"><div className="icon"><i className="fas fa-clock"></i></div><div><h4>Working Hours</h4><p>Mon - Fri: 8:00 AM - 6:00 PM</p><p>Sat: 9:00 AM - 2:00 PM</p></div></div>
            <div className="contact-socials">
              <h4>Follow Us</h4>
              <div className="footer-socials">
                <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="Facebook, coming soon"><i className="fab fa-facebook-f"></i></a>
                <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="LinkedIn, coming soon"><i className="fab fa-linkedin-in"></i></a>
                <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="Instagram, coming soon"><i className="fab fa-instagram"></i></a>
                <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="TikTok, coming soon"><i className="fab fa-tiktok"></i></a>
                <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="YouTube, coming soon"><i className="fab fa-youtube"></i></a>
              </div>
            </div>
          </div>
          <div className="contact-form-card" data-aos="fade-left">
            <h2><i className="fas fa-paper-plane" aria-hidden="true"></i> Send Us a Message</h2>
            <form id="contact-form" onSubmit={handleSubmit}>
              <div className="form-group"><label htmlFor="contact-name">Your Name</label><input id="contact-name" type="text" name="name" placeholder="Enter your name" autoComplete="name" required /></div>
              <div className="form-group"><label htmlFor="contact-email">Email Address</label><input id="contact-email" type="email" name="email" placeholder="example@email.com" autoComplete="email" required /></div>
              <div className="form-group"><label htmlFor="contact-subject">Subject</label><input id="contact-subject" type="text" name="subject" placeholder="What is this about?" required /></div>
              <div className="form-group"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" rows="5" placeholder="Tell us how we can help..." required></textarea></div>
              <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={submitting}><i className="fas fa-paper-plane" aria-hidden="true"></i> {submitting ? 'Sending...' : 'Send Message'}</button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
