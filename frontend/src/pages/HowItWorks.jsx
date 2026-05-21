import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    { num: '01', title: 'Choose Your Role & Experience', desc: 'Select from 12+ roles like Frontend Developer, ML Engineer, DevOps, etc. Set your experience level to get questions matched to your seniority.', color: 'primary' },
    { num: '02', title: 'Link Your GitHub (Optional)', desc: 'Provide your GitHub username or profile URL. Our AI analyzes your top repositories, tech stack, and project complexity to generate personalized questions about YOUR actual code.', color: 'accent' },
    { num: '03', title: 'Answer via Text or Voice', desc: 'Respond to AI-generated questions using text input or the built-in speech recognition. A real-time timer creates authentic interview pressure.', color: 'emerald' },
    { num: '04', title: 'Get Instant AI Feedback', desc: 'Groq AI evaluates your answers in real-time. Receive a score out of 100 along with detailed feedback on correctness, communication, and areas for improvement.', color: 'indigo' },
    { num: '05', title: 'Track Your Progress', desc: 'View your performance trends over time on the analytics dashboard. Compare your scores with peers and identify your strengths and weaknesses.', color: 'amber' },
  ];

  const colorMap = {
    primary: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
    accent: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="glass-panel p-6 md:p-10 mb-8 text-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">How It Works</h1>
        <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">From setup to feedback in under 5 minutes. Here's your complete walkthrough.</p>
      </div>

      <div className="space-y-4 md:space-y-6 mb-10">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            className={`glass-card p-5 md:p-6 border-l-4 ${colorMap[step.color]}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full ${colorMap[step.color]} flex items-center justify-center font-bold text-sm shrink-0`}>
                {step.num}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-6 md:p-8 text-center">
        <h3 className="text-xl font-bold mb-3">Ready to Start?</h3>
        <Link to="/setup" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
          Start Interview <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </motion.div>
  );
};

export default HowItWorks;
