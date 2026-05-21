import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="glass-panel p-6 md:p-10">
        <h1 className="text-2xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-300 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p className="text-gray-400">We collect minimal information necessary to provide our service. This includes your email address for authentication, interview responses for AI evaluation, and optionally your GitHub username for portfolio-based question generation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Data</h2>
            <p className="text-gray-400">Your interview responses are processed by Groq AI in real-time for evaluation. We store your performance history to provide analytics and track your progress. We do not sell or share your personal data with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. GitHub Integration</h2>
            <p className="text-gray-400">When you provide your GitHub username, we fetch only your public repository data (name, language, description) through GitHub's public API. We do not access your private repositories or source code.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Data Security</h2>
            <p className="text-gray-400">All data is transmitted over HTTPS. Passwords are securely hashed before storage. We implement industry-standard security practices to protect your information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Data Retention</h2>
            <p className="text-gray-400">Your interview data is retained as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Contact</h2>
            <p className="text-gray-400">For privacy-related inquiries, reach out via <a href="https://www.linkedin.com/in/sitaramkum/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">LinkedIn</a> or <a href="https://wa.me/918527220201" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">WhatsApp</a>.</p>
          </section>

          <p className="text-gray-500 text-xs pt-4 border-t border-white/10">Last updated: May 2026</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
