import React, { useEffect } from 'react';
import './LegalPages.css';

const TermsOfService = () => {
  useEffect(() => {
    document.title = "threadstomation Terms of Service";
  }, []);

  return (
    <div className="legal-page-container">
      <div className="legal-content">
        <div className="legal-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="threadstomation App Icon" style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '16px' }} />
          <h1 className="legal-title">threadstomation Terms of Service</h1>
          <p className="legal-last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the <strong>threadstomation</strong> web application (the "Service"), you agree to comply with and be bound by these Terms of Service (the "Terms"). If you do not agree to these Terms, please do not use the Service.</p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p><strong>threadstomation</strong> is a social media scheduling and automation platform. It allows users to create visual photo carousels and write text content using Google Gemini AI and OpenAI models, and schedule them for automatic posting to third-party social media platforms, including TikTok and Threads.</p>
        </section>

        <section className="legal-section">
          <h2>3. Integration with Third-Party Platforms (TikTok & Threads)</h2>
          <p>To use key features of the Service, you must authorize the Service to access your third-party social media accounts (such as TikTok or Threads) via OAuth. You agree that:</p>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '10px' }}>
            <li style={{ marginBottom: '10px' }}>You will comply with all developer terms, policies, and community guidelines of the respective platforms (including TikTok's Developer Terms and Content Posting guidelines).</li>
            <li style={{ marginBottom: '10px' }}>You represent that you own the connected accounts and have the right to grant authorization to this Service.</li>
            <li style={{ marginBottom: '10px' }}>We are not responsible for any issues, blocks, suspensions, or bans applied to your accounts by TikTok or Threads for violations of their rules.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Content and AI-Generated Posts</h2>
          <p>The Service utilizes generative AI models to create post text, images, and captions based on your custom prompts. You understand and agree that:</p>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '10px' }}>
            <li style={{ marginBottom: '10px' }}>You are solely responsible for the prompts you provide and the final content published to your accounts.</li>
            <li style={{ marginBottom: '10px' }}>You must review all generated contents before posting or scheduling them to ensure they comply with applicable laws, copyright regulations, and third-party terms.</li>
            <li style={{ marginBottom: '10px' }}>You will not use the Service to publish spam, malicious code, hate speech, violent media, harassment, or any other prohibited content.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Intellectual Property Rights</h2>
          <p>All software code, user interface designs, logos, graphics, and technical systems of <strong>threadstomation</strong> are the exclusive property of the application developers. You retain ownership of all original text prompts and custom visual media generated for your specific postings.</p>
        </section>

        <section className="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>The Service is provided on an "as is" and "as available" basis without warranties of any kind. Under no circumstances shall <strong>threadstomation</strong> or its developers be liable for any direct, indirect, incidental, or consequential damages resulting from:</p>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '10px' }}>
            <li style={{ marginBottom: '5px' }}>The use or inability to use the Service.</li>
            <li style={{ marginBottom: '5px' }}>Any temporary outages or permanent API deprecations by third-party social networks.</li>
            <li style={{ marginBottom: '5px' }}>The deletion, failure to post, or loss of any scheduled media or post history.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Termination of Service</h2>
          <p>We reserve the right to suspend or terminate your access to the Service at any time, without prior notice, if you violate these Terms or use the Service in a manner that may cause harm, security risks, or violate TikTok's Developer policies.</p>
        </section>

        <section className="legal-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
          <h2>8. Contact Information</h2>
          <p>If you have any questions or feedback regarding these Terms of Service, please contact us:</p>
          <p>Email: <a href="mailto:khairking6@gmail.com" style={{ color: '#38bdf8' }}>khairking6@gmail.com</a></p>
          <p>GitHub Project: <a href="https://github.com/codesbykhairannoor/threadstomation" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>codesbykhairannoor/threadstomation</a></p>
        </section>
        
        <button className="legal-back-btn" onClick={() => window.location.href = '/'}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default TermsOfService;
