'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SERVICES, PROVIDERS } from '@/data/data';

export default function Home() {
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
      window.AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
      new window.Swiper('.t-swiper', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        speed: 600,
      });
    })();

    const counters = document.querySelectorAll('.stat-num');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = +el.dataset.count;
          const suffix = el.dataset.suffix || '+';
          let cur = 0;
          const step = Math.max(target / 80, 1);
          const tick = () => {
            cur += step;
            if (cur >= target) { el.textContent = target.toLocaleString() + suffix; return; }
            el.textContent = Math.floor(cur).toLocaleString() + suffix;
            requestAnimationFrame(tick);
          };
          tick();
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));

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
    btns.forEach(btn => btn.addEventListener('click', handleClick));

    return () => {
      counters.forEach(c => observer.unobserve(c));
      btns.forEach(btn => btn.removeEventListener('click', handleClick));
    };
  }, []);

  return (
    <>
      <Navbar />
      <header className="hero" id="top">
        <div className="hero-grid"></div>
        <div className="container">
          <div className="hero-copy" data-aos="fade-up">
            <div className="eyebrow on-dark">
              <svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#00B8A9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#00B8A9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Verified professionals, every time
            </div>
            <h1>Find Trusted Professionals <span className="hl">for Every Job.</span></h1>
            <p className="lead">From home repairs to cleaning, electrical work and more — connect with trusted local professionals and get the job done with confidence.</p>
            <div className="hero-ctas">
              <Link href="/services" className="btn btn-primary rippleize">Book a Service</Link>
              <Link href="/providers" className="btn btn-ghost-light rippleize">Become a Provider</Link>
            </div>
            <div className="trust-badges">
              <span><i className="fa-solid fa-shield-check"></i> Verified Experts</span>
              <span><i className="fa-solid fa-lock"></i> Secure Payments</span>
              <span><i className="fa-solid fa-bolt"></i> Fast Response</span>
              <span><i className="fa-solid fa-star"></i> Trusted Reviews</span>
            </div>
            <div className="hero-social">
              <div className="avatar-stack">
                <img src="https://i.pravatar.cc/80?img=32" alt="" width="38" height="38" />
                <img src="https://i.pravatar.cc/80?img=47" alt="" width="38" height="38" />
                <img src="https://i.pravatar.cc/80?img=12" alt="" width="38" height="38" />
              </div>
              <div className="rating"><span className="stars">★★★★★</span> <strong>4.9/5</strong> from 12,400+ reviews</div>
            </div>
          </div>
          <div className="hero-visual" data-aos="fade-left" data-aos-delay="150">
            <div className="hv-blob b1"></div>
            <div className="hv-core"></div>
            <div className="hv-avatars">
              <div className="hv-pro p1"><img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=160&h=160&fit=crop" alt="Electrician" width="64" height="64" /><div className="ping"></div></div>
              <div className="hv-pro p2"><img src="https://images.unsplash.com/photo-1607472829078-8f9de9134155?w=160&h=160&fit=crop" alt="Plumber" width="64" height="64" /><div className="ping"></div></div>
              <div className="hv-pro p3"><img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=160&h=160&fit=crop" alt="Cleaner" width="64" height="64" /><div className="ping"></div></div>
              <div className="hv-pro p4"><img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=160&h=160&fit=crop" alt="Technician" width="64" height="64" /><div className="ping"></div></div>
            </div>
            <div className="hv-card rating"><div className="ic blue"><i className="fa-solid fa-star"></i></div><div><div className="val">4.9 / 5</div><div className="lab">Average rating</div></div></div>
            <div className="hv-card jobs"><div className="ic teal"><i className="fa-solid fa-check"></i></div><div><div className="val">50,000+</div><div className="lab">Jobs completed</div></div></div>
            <div className="hv-card resp"><div className="ic blue"><i className="fa-solid fa-clock"></i></div><div><div className="val">12 min</div><div className="lab">Avg. response</div></div></div>
          </div>
        </div>
      </header>

      <section className="trusted">
        <div className="container">
          <p>Trusted by property managers, hotels &amp; organizations across the region</p>
          <div className="logo-row">
            <span className="lg"><i className="fa-solid fa-hotel"></i> Meridian Hotels</span>
            <span className="lg"><i className="fa-solid fa-school"></i> Northgate Schools</span>
            <span className="lg"><i className="fa-solid fa-building"></i> Prime Properties</span>
            <span className="lg"><i className="fa-solid fa-helmet-safety"></i> Skyline Construction</span>
            <span className="lg"><i className="fa-solid fa-briefcase"></i> Vantage Offices</span>
            <span className="lg"><i className="fa-solid fa-landmark"></i> Civic Council</span>
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="container">
          <div className="section-head" data-aos="fade-up">
            <div className="eyebrow"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#0057D9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#0057D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Services</div>
            <h2>Every trade, thoroughly verified.</h2>
            <p>Browse fifteen categories of vetted professionals, each background-checked and rated by real customers.</p>
          </div>
          <div className="svc-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="svc-card" data-aos="fade-up" data-aos-delay={(i % 5) * 70}>
                <div className="svc-photo"><img src={s.img} alt={s.title} /><div className="svc-icon"><i className={`fa-solid ${s.icon}`}></i></div></div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <a href="#" className="svc-link">Learn More <i className="fa-solid fa-arrow-right"></i></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="container">
          <div className="section-head" data-aos="fade-up">
            <div className="eyebrow"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#0057D9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#0057D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Process</div>
            <h2>Booking a professional takes three steps.</h2>
            <p>No quotes to chase and no guessing who&apos;ll show up — the process is the same every time.</p>
          </div>
          <div className="how-steps">
            <div className="step" data-aos="fade-up">
              <div className="step-num">1<div className="ic-inner"><i className="fa-solid fa-magnifying-glass"></i></div></div>
              <h4>Search for a Service</h4>
              <p>Tell us what you need and where — from a leaking tap to a full office fit-out.</p>
            </div>
            <div className="step" data-aos="fade-up" data-aos-delay="120">
              <div className="step-num">2<div className="ic-inner"><i className="fa-solid fa-shield-check"></i></div></div>
              <h4>Choose a Verified Provider</h4>
              <p>Compare ratings, past jobs and response time, then pick the right match.</p>
            </div>
            <div className="step" data-aos="fade-up" data-aos-delay="240">
              <div className="step-num">3<div className="ic-inner"><i className="fa-solid fa-check-double"></i></div></div>
              <h4>Book and Get the Job Done</h4>
              <p>Confirm a time, pay securely in-app, and track the job to completion.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="why" id="why">
        <div className="container">
          <div className="why-visual" data-aos="fade-right">
            <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=700&h=880&fit=crop" alt="Verified technician at work" width="700" height="880" />
            <div className="why-badge">
              <svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 2l6 2.6v5.6c0 4.8-3.1 8.2-6 9.8-2.9-1.6-6-5-6-9.8V4.6L12 2z" stroke="#22C55E" strokeWidth="1.8"/><path d="M8.8 12l2.2 2.2 4.2-4.4" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div><strong>Identity Verified</strong><span>Background check passed</span></div>
            </div>
          </div>
          <div>
            <div className="section-head" style={{ textAlign: 'left', margin: '0 0 32px' }} data-aos="fade-up">
              <div className="eyebrow"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#0057D9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#0057D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Why Trust Connect</div>
              <h2>Trust isn&apos;t a tagline here — it&apos;s how we screen.</h2>
              <p>Every provider on the platform passes the same checks before a single job is booked.</p>
            </div>
            <div className="why-feats">
              <div className="feat-card" data-aos="fade-up"><div className="ic"><i className="fa-solid fa-id-card-clip"></i></div><h4>Verified Professionals</h4><p>Licenses and certifications confirmed before onboarding.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="80"><div className="ic"><i className="fa-solid fa-magnifying-glass-chart"></i></div><h4>Background Checks</h4><p>Criminal and identity checks run on every provider.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="160"><div className="ic"><i className="fa-solid fa-tag"></i></div><h4>Transparent Pricing</h4><p>Upfront quotes with no hidden call-out fees.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="240"><div className="ic"><i className="fa-solid fa-lock"></i></div><h4>Secure Payments</h4><p>Funds are held safely until the job is confirmed done.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="320"><div className="ic"><i className="fa-solid fa-location-dot"></i></div><h4>Live Booking Updates</h4><p>Track arrival time and job status in real time.</p></div>
              <div className="feat-card" data-aos="fade-up" data-aos-delay="400"><div className="ic"><i className="fa-solid fa-headset"></i></div><h4>Customer Support</h4><p>A real person is reachable seven days a week.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="providers" id="providers">
        <div className="container">
          <div className="section-head" data-aos="fade-up">
            <div className="eyebrow"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#0057D9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#0057D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Featured Providers</div>
            <h2>Meet a few of our top-rated pros.</h2>
            <p>Real providers, real ratings — booked thousands of times over.</p>
          </div>
          <div className="prov-grid">
            {PROVIDERS.map((p, i) => (
              <div key={i} className="prov-card" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="prov-photo"><img src={p.img} alt={p.name} width="84" height="84" /><div className="verified"><i className="fa-solid fa-check"></i></div></div>
                <h4>{p.name}</h4>
                <div className="trade">{p.trade}</div>
                <div className="stars">★★★★★ <span>{p.rating.toFixed(1)} ({p.reviews})</span></div>
                <div className="prov-meta"><span>{p.years} yrs exp.</span><span><i className="dot"></i>Available</span></div>
                <Link href="/booking" className="btn btn-outline btn-sm" style={{ width: '100%' }}>Book</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div><div className="stat-num" data-count="50000">0</div><div className="stat-lab">Jobs Completed</div></div>
          <div><div className="stat-num" data-count="10000">0</div><div className="stat-lab">Happy Customers</div></div>
          <div><div className="stat-num" data-count="3500">0</div><div className="stat-lab">Verified Providers</div></div>
          <div><div className="stat-num" data-count="98" data-suffix="%">0</div><div className="stat-lab">Customer Satisfaction</div></div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <div className="section-head" data-aos="fade-up">
            <div className="eyebrow"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#0057D9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#0057D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Testimonials</div>
            <h2>What our customers say.</h2>
          </div>
          <div className="swiper t-swiper">
            <div className="swiper-wrapper">
              <div className="swiper-slide">
                <div className="t-card"><div className="t-quote">&ldquo;</div><p className="msg">Booked an electrician for our office in under ten minutes. He arrived on time, showed his verification badge, and the pricing matched the quote exactly.</p><div className="t-stars">★★★★★</div><div className="t-person"><img src="https://i.pravatar.cc/80?img=5" alt="" /><div><div className="name">Tariro M.</div><div className="loc">Property Manager, Harare</div></div></div></div>
              </div>
              <div className="swiper-slide">
                <div className="t-card"><div className="t-quote">&ldquo;</div><p className="msg">Our hotel uses Trust Connect for all maintenance now. Response time is fast and every technician has been properly background-checked.</p><div className="t-stars">★★★★★</div><div className="t-person"><img src="https://i.pravatar.cc/80?img=15" alt="" /><div><div className="name">David K.</div><div className="loc">Facilities Director, Meridian Hotels</div></div></div></div>
              </div>
              <div className="swiper-slide">
                <div className="t-card"><div className="t-quote">&ldquo;</div><p className="msg">I was nervous about letting a stranger into my home for a repair. The verified badge and live tracking made it feel completely safe.</p><div className="t-stars">★★★★★</div><div className="t-person"><img src="https://i.pravatar.cc/80?img=25" alt="" /><div><div className="name">Rufaro C.</div><div className="loc">Homeowner, Borrowdale</div></div></div></div>
              </div>
            </div>
            <div className="swiper-pagination"></div>
          </div>
        </div>
      </section>

      <section className="appsec">
        <div className="container">
          <div data-aos="fade-right">
            <div className="eyebrow on-dark"><svg className="seal" viewBox="0 0 24 24" fill="none"><path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke="#00B8A9" strokeWidth="1.6"/><path d="M9.3 12l1.8 1.8 3.6-3.8" stroke="#00B8A9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Mobile App</div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.4vw,38px)', marginBottom: '14px' }}>Book and track jobs from your pocket.</h2>
            <p style={{ color: 'rgba(255,255,255,.65)', maxWidth: '440px' }}>The Trust Connect app puts every booking, message and receipt in one place, wherever you are.</p>
            <div className="app-feats">
              <div className="app-feat"><i className="fa-solid fa-map-location-dot"></i><div><strong>Book Anywhere</strong><span>Request a pro from any location</span></div></div>
              <div className="app-feat"><i className="fa-solid fa-route"></i><div><strong>Track Requests</strong><span>See live status and arrival time</span></div></div>
              <div className="app-feat"><i className="fa-solid fa-bell"></i><div><strong>Instant Notifications</strong><span>Updates the moment something changes</span></div></div>
              <div className="app-feat"><i className="fa-solid fa-lock"></i><div><strong>Secure Payments</strong><span>Pay in-app, released on completion</span></div></div>
            </div>
            <div className="store-btns">
              <a href="#" className="store-btn"><i className="fa-brands fa-apple"></i><div><span className="l1">Download on the</span><span className="l2">App Store</span></div></a>
              <a href="#" className="store-btn"><i className="fa-brands fa-google-play"></i><div><span className="l1">Get it on</span><span className="l2">Google Play</span></div></a>
            </div>
          </div>
          <div data-aos="fade-left">
            <div className="phone-mock">
              <div className="phone-screen">
                <div className="phone-notch"></div>
                <div className="phone-ui">
                  <div className="ph-card"><div className="ic"><i className="fa-solid fa-bolt"></i></div><div><b>Electrician confirmed</b><span>Arriving in 12 min</span></div></div>
                  <div className="ph-card"><div className="ic" style={{ background: '#00B8A9' }}><i className="fa-solid fa-check"></i></div><div><b>Payment secured</b><span>Held until job complete</span></div></div>
                  <div className="ph-card"><div className="ic" style={{ background: '#0057D9' }}><i className="fa-solid fa-star"></i></div><div><b>Rate your provider</b><span>Job marked complete</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-final">
        <div className="container">
          <h2 data-aos="fade-up">Book a Trusted Professional Today.</h2>
          <p data-aos="fade-up" data-aos-delay="80">Join thousands of homeowners and organizations who trust verified pros for every job, big or small.</p>
          <div className="hero-ctas" data-aos="fade-up" data-aos-delay="160">
            <Link href="/services" className="btn btn-white rippleize">Book Now</Link>
            <Link href="/providers" className="btn btn-ghost-light rippleize">Become a Provider</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
