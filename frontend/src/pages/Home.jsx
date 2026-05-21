import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Target, Zap, Users, TrendingUp, Shield, Code2, Sparkles, CheckCircle2 } from 'lucide-react';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const stats = [
    { value: '10K+', label: 'Interviews Taken' },
    { value: '95%', label: 'Success Rate' },
    { value: '50+', label: 'Roles Covered' },
    { value: '4.9★', label: 'User Rating' },
  ];

  const features = [
    {
      icon: Target,
      title: 'Role Specific Questions',
      desc: 'AI generates questions based on your exact role, experience level, and tech stack.',
      color: 'primary'
    },
    {
      icon: Code2,
      title: 'GitHub Portfolio Analysis',
      desc: 'Connect your GitHub and get questions tailored to your actual projects and code.',
      color: 'accent'
    },
    {
      icon: Zap,
      title: 'Instant AI Feedback',
      desc: 'Get detailed scoring on correctness, communication, and confidence after every answer.',
      color: 'emerald'
    },
    {
      icon: Shield,
      title: 'FAANG Campaign Mode',
      desc: 'Experience a realistic 3-round FAANG interview with pass/fail elimination rounds.',
      color: 'indigo'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      desc: 'Track your progress over time with detailed charts and peer comparison rankings.',
      color: 'amber'
    },
    {
      icon: Bot,
      title: 'ATS Resume Checker',
      desc: 'Get your resume scored against ATS systems to maximize your callback rate.',
      color: 'rose'
    },
  ];

  const howItWorks = [
    { step: '01', title: 'Choose Your Role', desc: 'Select your target position and experience level.' },
    { step: '02', title: 'Link GitHub (Optional)', desc: 'AI analyzes your repos to personalize questions.' },
    { step: '03', title: 'Practice & Answer', desc: 'Answer via text or voice in a realistic environment.' },
    { step: '04', title: 'Get AI Feedback', desc: 'Receive detailed scoring and improvement tips.' },
  ];

  const colorMap = {
    primary: 'bg-primary-500/15 text-primary-400',
    accent: 'bg-accent-500/15 text-accent-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    indigo: 'bg-indigo-500/15 text-indigo-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-8">
      
      {/* ===== HERO SECTION ===== */}
      <section className="flex flex-col items-center justify-center min-h-[75vh] md:min-h-[80vh] text-center px-2">
        <motion.div 
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary-500/30 text-primary-400 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Interview Practice — Free & Open Source</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 md:mb-6 leading-[1.1]">
            Master Your Next <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-indigo-400">
              Tech Interview
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto px-2 leading-relaxed">
            Experience hyper-realistic AI mock interviews tailored to your resume and target role. Get instant, actionable feedback and land your dream job at top tech companies.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/setup" className="btn-primary text-base md:text-lg w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4">
              Start Mock Interview <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base md:text-lg w-full sm:w-auto px-8 py-4 text-center">
              View Analytics
            </Link>
          </motion.div>

          {/* Stats Strip */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-4 md:p-5 text-center">
                <p className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-400">{stat.value}</p>
                <p className="text-xs md:text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <motion.section 
        className="px-2"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Ace Your Interview</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            Powered by Groq AI with real-time evaluation, GitHub integration, and multi-round FAANG simulations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, i) => (
            <motion.div 
              key={feature.title}
              className="glass-card p-5 md:p-6 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${colorMap[feature.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ===== HOW IT WORKS ===== */}
      <motion.section 
        className="px-2"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-indigo-400">Works</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            From setup to feedback in minutes. No sign-up required to start practicing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {howItWorks.map((item, i) => (
            <motion.div 
              key={item.step}
              className="glass-panel p-5 md:p-6 relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <span className="absolute top-3 right-4 text-5xl md:text-6xl font-black text-white/5 group-hover:text-primary-500/10 transition-colors">
                {item.step}
              </span>
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ===== CTA SECTION ===== */}
      <motion.section 
        className="px-2"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="glass-panel p-8 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-accent-500/10 to-indigo-500/10 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8 text-sm md:text-base">
              Join thousands of developers who have improved their interview skills with AI-powered practice sessions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/setup" className="btn-primary text-base md:text-lg px-8 py-4 w-full sm:w-auto inline-flex justify-center items-center gap-2">
                Start Practicing Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/campaign-setup" className="btn-secondary text-base md:text-lg px-8 py-4 w-full sm:w-auto text-center">
                Try FAANG Campaign
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-400 text-xs md:text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free to use</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Powered by Groq AI</span>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
