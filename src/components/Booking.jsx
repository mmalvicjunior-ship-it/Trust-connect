'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { PROVIDERS_DETAIL, SERVICES_DETAIL } from '@/data/data';

export default function Booking() {
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [amount, setAmount] = useState('');
  const [feePercent, setFeePercent] = useState(10);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    api.getProviders()
      .then((data) => setProviders(data.providers))
      .catch(() => {
        const seeded = PROVIDERS_DETAIL.map((p, i) => ({
          _id: String(i + 1),
          businessName: p.name,
          specialty: p.specialty,
          location: p.location,
        }));
        setProviders(seeded);
      });

    api.getPlatformFee()
      .then((data) => setFeePercent(data.platformFeePercentage))
      .catch(() => setFeePercent(10));
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
      window.AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
    })();
  }, []);

  const selectedProviderDetail = useMemo(() => {
    if (!selectedProvider) return null;
    const found = providers.find((p) => String(p._id) === selectedProvider);
    if (found) return found;
    return PROVIDERS_DETAIL.find((p, i) => String(i + 1) === selectedProvider) || null;
  }, [selectedProvider, providers]);

  const calculatedFee = useMemo(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return null;
    const fee = Math.round(amt * (feePercent / 100) * 100) / 100;
    return {
      amount: amt,
      fee,
      providerAmount: Math.round((amt - fee) * 100) / 100,
    };
  }, [amount, feePercent]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setToast({ message: 'Please sign in to book a service.', type: 'error' });
      setTimeout(() => router.push('/signin'), 1200);
      return;
    }

    const providerId = e.target['provider'].value;
    const service = e.target['service'].value;
    const date = e.target['date'].value;
    const time = e.target['time'].value;
    const location = e.target['location'].value;
    const description = e.target['description'].value;
    const amt = parseFloat(amount);

    if (!providerId || !service || !date || !time || !location || !description || !amt || amt <= 0) {
      setToast({ message: 'Please fill in all required fields with a valid amount.', type: 'error' });
      return;
    }

    const providerName = selectedProviderDetail
      ? selectedProviderDetail.businessName || selectedProviderDetail.name
      : '';

    setSubmitting(true);
    try {
      const data = await api.createBooking({
        providerId,
        providerName,
        service,
        date,
        time,
        location,
        description,
        amount: amt,
      });
      setToast({
        message: `Booking ${data.booking.bookingId} submitted successfully! Status: Pending`,
        type: 'success',
      });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setToast({ message: err.message || 'Booking failed. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1 data-aos="fade-up">Book a <span>Service</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">Choose a professional, pick your service and confirm your booking details.</p>
      </section>
      <section className="booking-page">
        <div className="booking-card" data-aos="fade-up">
          <h2><i className="fas fa-calendar-check"></i> Booking Details</h2>

          {!user && (
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FDBA74',
              color: '#9A3412',
              padding: '14px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              marginBottom: '20px',
            }}>
              You need to be signed in to book a service.{' '}
              <Link href="/signin" style={{ fontWeight: 700, textDecoration: 'underline' }}>Sign in</Link> or{' '}
              <Link href="/register" style={{ fontWeight: 700, textDecoration: 'underline' }}>create an account</Link>.
            </div>
          )}

          <form id="booking-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label><i className="fas fa-user-tie"></i> Select Professional</label>
              <select name="provider" value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} required>
                <option value="">Choose a Professional</option>
                {providers.map((p, i) => (
                  <option key={String(p._id) || i} value={String(p._id)}>
                    {p.businessName || p.name} — {p.specialty || p.trade} {(p.location ? `(${p.location})` : '')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label><i className="fas fa-tools"></i> Select Service</label>
              <select name="service" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} required>
                <option value="">Choose a Service</option>
                {SERVICES_DETAIL.map((s, i) => (
                  <option key={i} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><i className="fas fa-calendar-day"></i> Preferred Date</label>
                <input type="date" name="date" required />
              </div>
              <div className="form-group">
                <label><i className="fas fa-clock"></i> Preferred Time</label>
                <input type="time" name="time" required />
              </div>
            </div>
            <div className="form-group">
              <label><i className="fas fa-map-pin"></i> Service Location</label>
              <input type="text" name="location" placeholder="Enter your address" required />
            </div>
            <div className="form-group">
              <label><i className="fas fa-comment"></i> Describe Your Problem</label>
              <textarea name="description" rows="4" placeholder="Tell the service provider what you need..." required></textarea>
            </div>
            <div className="form-group">
              <label><i className="fas fa-dollar-sign"></i> Booking Amount ($)</label>
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100.00" required />
            </div>

            {calculatedFee && (
              <div className="fee-breakdown">
                <div className="fee-row"><span>Service amount</span><strong>${calculatedFee.amount.toFixed(2)}</strong></div>
                <div className="fee-row"><span>Trust Connect fee ({feePercent}%)</span><strong>${calculatedFee.fee.toFixed(2)}</strong></div>
                <div className="fee-row fee-provider"><span>Provider amount</span><strong>${calculatedFee.providerAmount.toFixed(2)}</strong></div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={submitting}>
              <i className="fas fa-calendar-check"></i> {submitting ? 'Submitting...' : 'Book Now'}
            </button>
          </form>
        </div>
      </section>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
