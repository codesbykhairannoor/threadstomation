import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-content">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>We only collect information about you if we have a reason to do so, for example, to provide our Services, to communicate with you, or to make our Services better. We collect information in three ways: if and when you provide information to us, automatically through operating our services, and from outside sources.</p>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Information</h2>
          <p>We use the information we collect to provide and improve our services, monitor usage, and protect against security threats. We also use it to communicate with you about updates, offers, and promotions.</p>
        </section>

        <section className="legal-section">
          <h2>3. Data Protection</h2>
          <p>We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information. However, no method of transmission over the Internet, or method of electronic storage, is 100% secure.</p>
        </section>

        <section className="legal-section">
          <h2>4. Cookies</h2>
          <p>We use cookies to understand and save your preferences for future visits and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future.</p>
        </section>
        
        <button className="legal-back-btn" onClick={() => window.location.href = '/'}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
