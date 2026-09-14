export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2>Trust <span>Connect</span></h2>
          <p>Connecting you with trusted service providers across Zimbabwe.</p>
          <div className="footer-socials">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-tiktok"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <a href="/">Home</a>
          <a href="/about">About Us</a>
          <a href="/services">Services</a>
          <a href="/providers">Providers</a>
          <a href="/booking">Book a Service</a>
          <a href="/contact">Contact</a>
        </div>
        <div className="footer-col">
          <h4>Resources</h4>
          <a href="#">Help Center</a>
          <a href="#">FAQ</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
        <div className="footer-col">
          <h4>For Clients</h4>
          <a href="#">How It Works</a>
          <a href="/booking">Book a Service</a>
          <a href="/signin">Client Login</a>
          <a href="/register">Create Account</a>
        </div>
        <div className="footer-col">
          <h4>Contact Us</h4>
          <p><i className="fas fa-envelope"></i> mmalvicjunior@gmail.com</p>
          <p><i className="fas fa-phone"></i> +263 780 375 311</p>
          <p><i className="fas fa-map-marker-alt"></i> Vic-Falls, Zimbabwe</p>
          <a href="/contact" className="btn btn-accent btn-sm"><i className="fas fa-paper-plane"></i> Get In Touch</a>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 Trust Connect. All Rights Reserved.</div>
    </footer>
  );
}
