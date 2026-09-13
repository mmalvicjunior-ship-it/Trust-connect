export default function HomeFooter() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <a href="/" className="nav-logo">
              <svg className="mark" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fGrad)"/><path d="M20 9L28 13V20C28 25 24.5 28.8 20 31C15.5 28.8 12 25 12 20V13L20 9Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M16.2 19.6L18.7 22.2L23.8 16.8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fGrad" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#0057D9"/><stop offset="1" stopColor="#00B8A9"/></linearGradient></defs></svg>
              Trust Connect
            </a>
            <p>Making it simple, safe and fast for anyone to hire trusted professionals.</p>
            <div className="foot-social">
              <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#"><i className="fa-brands fa-instagram"></i></a>
              <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
              <a href="#"><i className="fa-brands fa-x-twitter"></i></a>
            </div>
          </div>
          <div className="foot-col"><h5>Company</h5><a href="/about">About Us</a><a href="#">Careers</a><a href="#">Press</a><a href="/contact">Contact</a></div>
          <div className="foot-col"><h5>Services</h5><a href="/services">Electricians</a><a href="/services">Plumbers</a><a href="/services">Cleaners</a><a href="/services">All Services</a></div>
          <div className="foot-col"><h5>Providers</h5><a href="/providers">Become a Provider</a><a href="#">Provider Dashboard</a><a href="#">Help Center</a></div>
          <div className="foot-news">
            <h5>Newsletter</h5>
            <p>Tips on hiring trusted pros, straight to your inbox.</p>
            <div className="news-input"><input type="email" placeholder="Your email" /><button>Join</button></div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>&copy; 2026 Trust Connect. All rights reserved.</span>
          <div><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>
        </div>
      </div>
    </footer>
  );
}
