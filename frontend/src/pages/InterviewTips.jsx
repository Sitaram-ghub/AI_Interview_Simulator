import { motion } from 'framer-motion';
import { Lightbulb, MessageSquare, Brain, Clock, Target, Smile } from 'lucide-react';

const InterviewTips = () => {
  const tips = [
    { icon: Brain, title: 'Understand the Fundamentals', desc: 'Brush up on data structures, algorithms, and system design basics. Most FAANG interviews test these core skills regardless of your role.' },
    { icon: Clock, title: 'Practice Under Time Pressure', desc: 'Set a timer when practicing. Real interviews have strict time limits — get comfortable thinking and answering within 2–3 minutes per question.' },
    { icon: MessageSquare, title: 'Think Aloud', desc: "Interviewers want to see your thought process. Don't just jump to the answer — explain your reasoning, trade-offs, and approach clearly." },
    { icon: Target, title: 'Use the STAR Method', desc: 'For behavioral questions, structure your answers: Situation, Task, Action, Result. This keeps your answers concise and impactful.' },
    { icon: Lightbulb, title: 'Ask Clarifying Questions', desc: "Don't assume. Asking smart clarifying questions shows maturity and prevents you from solving the wrong problem." },
    { icon: Smile, title: 'Stay Calm & Confident', desc: "It's okay to not know everything. If you're stuck, explain what you do know and how you'd approach finding the answer." },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="glass-panel p-6 md:p-10 mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Interview Tips & Strategies</h1>
        <p className="text-gray-400 text-sm md:text-base">Pro tips to help you ace your next technical interview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {tips.map((tip, i) => (
          <motion.div 
            key={tip.title}
            className="glass-card p-5 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary-500/15 text-primary-400 flex items-center justify-center mb-3">
              <tip.icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">{tip.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{tip.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default InterviewTips;
