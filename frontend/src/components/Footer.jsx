import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative z-10 mt-4">
      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
      
      <div className="container mx-auto px-6 py-5 md:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-7 h-7 text-primary-500" />
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-accent-500">
                AI Interviewer
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Transform Your Potential into Success with Personalized AI-Powered Interview Preparation.
            </p>
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} AI Interviewer · All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-300 mb-5">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/setup" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">Mock Interview</Link></li>
              <li><Link to="/campaign-setup" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">FAANG Campaign</Link></li>
              <li><Link to="/ats" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">ATS Checker</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-300 mb-5">Resources</h4>
            <ul className="space-y-3">
              <li><Link to="/how-it-works" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">How It Works</Link></li>
              <li><Link to="/interview-tips" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">Interview Tips</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-primary-400 text-sm transition-colors hover:translate-x-1 inline-block">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-300 mb-5">Connect</h4>
            <div className="flex flex-col gap-3.5">
              <a 
                href="https://www.linkedin.com/in/sitaramkum/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-blue-400 text-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-all group-hover:scale-105">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                LinkedIn
              </a>

              <a 
                href="https://wa.me/918527220201" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-green-400 text-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 group-hover:border-green-500/40 transition-all group-hover:scale-105">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <p className="text-right text-gray-400 text-xs mt-4">Developed by Sitaram</p>
      </div>
    </footer>
  );
};

export default Footer;
