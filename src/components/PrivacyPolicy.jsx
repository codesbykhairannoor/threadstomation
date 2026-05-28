import React, { useEffect } from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "threadstomation Privacy Policy";
  }, []);

  return (
    <div className="legal-page-container">
      <div className="legal-content">
        <div className="legal-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/favicon.svg" alt="threadstomation App Icon" style={{ width: '64px', height: '64px', marginBottom: '1rem' }} />
          <h1 className="legal-title">threadstomation Privacy Policy</h1>
          <p className="legal-last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>Welcome to <strong>threadstomation</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, and safeguard your information when you use our web application (the "Service") and connect your social media accounts, including TikTok and Threads, to our Service.</p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>We collect information you provide directly to us, information collected automatically, and information obtained via third-party APIs with your authorization:</p>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '10px' }}>
            <li style={{ marginBottom: '10px' }}><strong>TikTok API Integration:</strong> When you connect your TikTok account via OAuth, we request authorization scopes including <code>user.info.basic</code> and <code>video.publish</code>. Through this, we collect:
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                <li>Your TikTok Unique Identifier (<code>open_id</code>).</li>
                <li>Your TikTok display name, username (handle), and avatar URL.</li>
                <li>Temporary authentication tokens (access token and refresh token) required to publish media on your behalf.</li>
              </ul>
            </li>
            <li style={{ marginBottom: '10px' }}><strong>Threads API Integration:</strong> When you connect your Threads account, we collect your Threads user identifier, display name, and access tokens necessary to post threads on your behalf.</li>
            <li style={{ marginBottom: '10px' }}><strong>Application Data:</strong> We collect user-defined scheduling configurations, custom prompts, and history logs of generated content.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following business purposes:</p>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '10px' }}>
            <li style={{ marginBottom: '10px' }}>To link your social media accounts and provide the automated post-scheduling services.</li>
            <li style={{ marginBottom: '10px' }}>To generate personalized visual carousel content (images and captions) using Google Gemini AI and OpenAI models based on your configuration.</li>
            <li style={{ marginBottom: '10px' }}>To publish posts, images, and carousels directly to your authorized TikTok or Threads accounts on your scheduled times.</li>
            <li style={{ marginBottom: '10px' }}>To display posting history and log successful/failed events in your local dashboard.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Storage, Protection & Security</h2>
          <p>We take the security of your data seriously. We store your account tokens, prompt settings, and post history in a secure database hosted on Supabase.
          All API requests, tokens, and communications are transmitted securely using HTTPS/SSL protocols. We implement row-level security policies to prevent unauthorized access.</p>
        </section>

        <section className="legal-section">
          <h2>5. Sharing of Information & Third Parties</h2>
          <p>We do not sell, trade, or share your personal data or TikTok/Threads profile details with third-party advertisers. We only interact with the following services to run the application:</p>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '10px' }}>
            <li style={{ marginBottom: '5px' }}><strong>TikTok API:</strong> Used to authenticate your account and publish carousels/videos.</li>
            <li style={{ marginBottom: '5px' }}><strong>Threads API:</strong> Used to post status updates and media.</li>
            <li style={{ marginBottom: '5px' }}><strong>Google Gemini & OpenAI:</strong> Used to generate text and creative layouts based on your prompts.</li>
            <li style={{ marginBottom: '5px' }}><strong>Supabase:</strong> Used as our hosting database and secure media storage provider.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Data Retention and Deletion Request</h2>
          <p>We store your tokens and accounts as long as they are active and required to perform the scheduling services. You can delete your account and remove all associated tokens from our system at any time by disconnecting your account from the dashboard settings.
          To request permanent deletion of your account and all associated user data, please contact us at: <a href="mailto:khairking6@gmail.com" style={{ color: '#38bdf8' }}>khairking6@gmail.com</a>. We will process your request within 48 hours.</p>
        </section>

        <section className="legal-section">
          <h2>7. Cookies</h2>
          <p>We use cookies to understand and save your preferences for future visits and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future.</p>
        </section>

        <section className="legal-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
          <h2>8. Contact Us</h2>
          <p>If you have any questions or concerns about this Privacy Policy or our data practices, please reach out to us:</p>
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

export default PrivacyPolicy;
