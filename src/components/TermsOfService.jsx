import React from 'react';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-content">
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using this web application, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this application's particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
        </section>

        <section className="legal-section">
          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily use this software for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials.</p>
        </section>

        <section className="legal-section">
          <h2>3. Disclaimer</h2>
          <p>The materials on this web application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </section>

        <section className="legal-section">
          <h2>4. Limitations</h2>
          <p>In no event shall this application or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application.</p>
        </section>
        
        <button className="legal-back-btn" onClick={() => window.location.href = '/'}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default TermsOfService;
