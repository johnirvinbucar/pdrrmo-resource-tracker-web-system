"use client";
import React from 'react';
import './footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="legal-footer">
      <div className="legal-footer-container">
        {/* Links */}
        <div className="legal-footer-links">
          <a href="/privacy" className="legal-footer-link">
            Privacy Policy
          </a>
          <span className="legal-footer-separator">|</span>
          <a href="/terms" className="legal-footer-link">
            Terms of Service
          </a>
          <span className="legal-footer-separator">|</span>
          <a href="/cookies" className="legal-footer-link">
            Cookie Policy
          </a>
          <span className="legal-footer-separator">|</span>
          <a href="/contact" className="legal-footer-link">
            Contact
          </a>
        </div>
        {/* Copyright */}
        <div className="legal-footer-copyright">
          <p>
            © {currentYear} Developed & Maintained by IT | John Irvin Bucar | All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}