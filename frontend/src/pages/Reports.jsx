import { motion } from 'framer-motion';
import useInterviewStore from '../store/interviewStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Video, Eye, Smile } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const Reports = () => {
  const navigate = useNavigate();
  const { role, evaluations, interviewId, resetInterview } = useInterviewStore();
  const { user } = useAuthStore();
  const [isSaved, setIsSaved] = useState(false);

  const numericEvaluations = evaluations?.filter(ev => typeof ev.score === 'number') || [];
  const averageScore = numericEvaluations.length > 0 
    ? Math.round(numericEvaluations.reduce((acc, ev) => acc + ev.score, 0) / numericEvaluations.length)
    : "Not Evaluated";

  // AI Smart-Cam analytics calculations
  const hasCameraData = evaluations?.some(ev => ev.emotions !== undefined && ev.emotions !== null);
  
  let totalEyeContact = 0;
  let eyeContactCount = 0;
  
  const aggregatedEmotions = {
    neutral: 0,
    happy: 0,
    confident: 0,
    nervous: 0,
    sad: 0
  };
  let emotionCount = 0;
  
  evaluations?.forEach(ev => {
    if (ev.emotions) {
      emotionCount++;
      
      // Dynamic backward-compatible adapter: if old keys exist, map them to the 5-emotion system
      const emos = ev.emotions;
      const parsedEmotions = {
        neutral: emos.neutral !== undefined ? emos.neutral : 0,
        happy: emos.happy !== undefined ? emos.happy : 0,
        confident: emos.confident !== undefined ? emos.confident : 0,
        nervous: emos.nervous !== undefined ? emos.nervous : 0,
        sad: emos.sad !== undefined ? emos.sad : 0
      };
      
      // Convert old keys (fearful, angry, surprised, disgusted) into new categories
      if (emos.fearful !== undefined || emos.angry !== undefined || emos.surprised !== undefined || emos.disgusted !== undefined) {
        const angry = emos.angry || 0;
        const fearful = emos.fearful || 0;
        const surprised = emos.surprised || 0;
        const disgusted = emos.disgusted || 0;
        
        parsedEmotions.nervous = Math.min(100, parsedEmotions.nervous + fearful + angry + disgusted);
        parsedEmotions.confident = Math.min(100, parsedEmotions.confident + surprised);
      }

      Object.keys(aggregatedEmotions).forEach(emo => {
        aggregatedEmotions[emo] += parsedEmotions[emo] || 0;
      });
    }
    if (ev.eyeContactScore !== undefined && ev.eyeContactScore !== null) {
      totalEyeContact += ev.eyeContactScore;
      eyeContactCount++;
    }
  });
  
  const finalAvgEmotions = {};
  if (emotionCount > 0) {
    Object.keys(aggregatedEmotions).forEach(emo => {
      finalAvgEmotions[emo] = Math.round(aggregatedEmotions[emo] / emotionCount);
    });
  }
  
  const avgEyeContact = eyeContactCount > 0 ? Math.round(totalEyeContact / eyeContactCount) : null;

  const radarData = hasCameraData ? [
    { subject: 'Neutral (Calm)', A: finalAvgEmotions.neutral || 0, fullMark: 100 },
    { subject: 'Happy (Enthusiasm)', A: finalAvgEmotions.happy || 0, fullMark: 100 },
    { subject: 'Confident (Poised)', A: finalAvgEmotions.confident || 0, fullMark: 100 },
    { subject: 'Nervous (Anxious)', A: finalAvgEmotions.nervous || 0, fullMark: 100 },
    { subject: 'Sad (Disengaged)', A: finalAvgEmotions.sad || 0, fullMark: 100 }
  ] : [];

  const getBehavioralTips = () => {
    const tips = [];
    if (avgEyeContact !== null && avgEyeContact < 75) {
      tips.push({
        title: "Improve Eye Contact",
        desc: "Your eye contact score was under 75%. Try looking directly at the camera instead of looking down or away. Good eye contact builds trust and shows confidence."
      });
    }
    
    if (hasCameraData) {
      const nonNeutralEmotions = { ...finalAvgEmotions };
      delete nonNeutralEmotions.neutral;
      
      let maxEmo = '';
      let maxVal = -1;
      Object.entries(nonNeutralEmotions).forEach(([emo, val]) => {
        if (val > maxVal) {
          maxVal = val;
          maxEmo = emo;
        }
      });
      
      if (maxVal > 15) {
        if (maxEmo === 'nervous') {
          tips.push({
            title: "Manage Interview Anxiety",
            desc: "The AI detected signs of nervousness or tension. Practice taking a slow breath before responding, and use hand gestures to naturally channel nervous energy."
          });
        } else if (maxEmo === 'sad') {
          tips.push({
            title: "Boost Your Energy Levels",
            desc: "Your expressions leaned toward being slightly disengaged or flat. Try raising your vocal inflection and showing active posture to convey interest."
          });
        } else if (maxEmo === 'happy') {
          tips.push({
            title: "Great Positive Energy!",
            desc: "You maintained a positive, warm, and highly engaging facial tone. This creates an open, friendly atmosphere that builds immediate rapport."
          });
        } else if (maxEmo === 'confident') {
          tips.push({
            title: "Outstanding Professional Poise",
            desc: "You projected strong confidence and focused engagement. This high-poise demeanor strongly conveys technical authority and composure."
          });
        }
      }
    }
    
    if (tips.length === 0) {
      tips.push({
        title: "Excellent Composure",
        desc: "You maintained calm, professional expressions and solid eye contact. Outstanding body language!"
      });
    }
    
    return tips;
  };

  useEffect(() => {
    const saveReport = async () => {
      if (evaluations.length > 0 && interviewId && !isSaved) {
        try {
          await axios.post('http://localhost:8000/api/interview/save', {
            user_id: user?.email || "guest_user",
            interview_id: interviewId,
            role: role || "Unknown Role",
            average_score: typeof averageScore === 'number' ? averageScore : 0,
            evaluations: evaluations
          });
          setIsSaved(true);
        } catch (error) {
          console.error("Failed to save report:", error);
        }
      }
    };
    saveReport();
  }, [evaluations, interviewId, role, averageScore, isSaved, user]);

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-bold mb-4">No Report Available</h2>
        <button onClick={() => navigate('/setup')} className="btn-primary">Start an Interview</button>
      </div>
    );
  }

  const technicalEvaluations = evaluations?.filter(ev => typeof ev.metrics?.technical === 'number') || [];
  const avgTechnical = technicalEvaluations.length > 0
    ? `${Math.round(technicalEvaluations.reduce((acc, ev) => acc + ev.metrics.technical, 0) / technicalEvaluations.length)}%`
    : "Not Evaluated";

  const communicationEvaluations = evaluations?.filter(ev => typeof ev.metrics?.communication === 'number') || [];
  const avgCommunication = communicationEvaluations.length > 0
    ? `${Math.round(communicationEvaluations.reduce((acc, ev) => acc + ev.metrics.communication, 0) / communicationEvaluations.length)}%`
    : "Not Evaluated";

  const confidenceEvaluations = evaluations?.filter(ev => typeof ev.metrics?.confidence === 'number') || [];
  const avgConfidence = confidenceEvaluations.length > 0
    ? `${Math.round(confidenceEvaluations.reduce((acc, ev) => acc + ev.metrics.confidence, 0) / confidenceEvaluations.length)}%`
    : "Not Evaluated";

  const grammarEvaluations = evaluations?.filter(ev => typeof ev.metrics?.grammar === 'number') || [];
  const avgGrammar = grammarEvaluations.length > 0
    ? `${Math.round(grammarEvaluations.reduce((acc, ev) => acc + ev.metrics.grammar, 0) / grammarEvaluations.length)}%`
    : "Not Evaluated";

  const fluencyEvaluations = evaluations?.filter(ev => typeof ev.metrics?.fluency === 'number') || [];
  const avgFluency = fluencyEvaluations.length > 0
    ? `${Math.round(fluencyEvaluations.reduce((acc, ev) => acc + ev.metrics.fluency, 0) / fluencyEvaluations.length)}%`
    : "Not Evaluated";

  // Extract unique weak topics that are not "N/A" or "Unknown"
  const weakTopics = [...new Set(evaluations
    .map(ev => ev.weak_topic)
    .filter(topic => topic && topic !== "N/A" && topic !== "Unknown")
  )];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-8 text-center">Interview Feedback Report</h1>
      
      <div className="glass-panel p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{role || "Technical Role"}</h2>
            <p className="text-gray-400">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Overall Score</p>
            <p className={`text-4xl font-bold ${typeof averageScore === 'number' && averageScore >= 80 ? 'text-emerald-400' : typeof averageScore === 'number' && averageScore >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
              {typeof averageScore === 'number' ? `${averageScore}/100` : averageScore}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-dark-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Technical</p>
            <p className="text-xl font-bold text-primary-400">{avgTechnical}</p>
          </div>
          <div className="bg-dark-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Communication</p>
            <p className="text-xl font-bold text-primary-400">{avgCommunication}</p>
          </div>
          <div className="bg-dark-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Confidence</p>
            <p className="text-xl font-bold text-primary-400">{avgConfidence}</p>
          </div>
          <div className="bg-dark-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Grammar</p>
            <p className="text-xl font-bold text-primary-400">{avgGrammar}</p>
          </div>
          <div className="bg-dark-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Fluency</p>
            <p className="text-xl font-bold text-primary-400">{avgFluency}</p>
          </div>
        </div>

        {weakTopics.length > 0 && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <h3 className="text-rose-400 font-bold mb-2 flex items-center gap-2">
              Areas for Improvement (Weak Topics)
            </h3>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Smart-Cam Analysis Section */}
        {hasCameraData && (
          <div className="mb-8 p-6 bg-dark-900/50 border border-white/5 rounded-lg">
            <h3 className="text-lg font-bold border-b border-white/10 pb-3 mb-6 flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-400" /> Non-Verbal Communication Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Radar Chart */}
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Facial Expressions Spectrum</h4>
                <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="55%" margin={{ top: 15, right: 45, bottom: 15, left: 45 }} data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                      <Radar name="Candidate" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Eye Contact and Tips */}
              <div className="flex flex-col gap-5">
                {avgEyeContact !== null && (
                  <div className="bg-dark-950/40 p-4 rounded-lg border border-white/5 flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="10" fill="transparent" />
                        <circle 
                          cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="10" fill="transparent" 
                          strokeDasharray={`${2 * Math.PI * 40}`} 
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - avgEyeContact / 100)}`}
                          className="transition-all duration-1000 ease-out" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {avgEyeContact}%
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-200 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-emerald-400" /> Focus & Eye Contact
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">Percentage of interview frames where you directly faced the camera.</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-300 flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-emerald-400" /> Behavioral Coaching Tips
                  </h4>
                  {getBehavioralTips().map((tip, idx) => (
                    <div key={idx} className="p-3 bg-primary-950/10 border border-primary-500/10 rounded-md text-xs">
                      <h5 className="font-bold text-primary-400 mb-1">💡 {tip.title}</h5>
                      <p className="text-gray-400 leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-lg font-bold border-b border-white/10 pb-2">Question Breakdown</h3>
          {evaluations.map((ev, index) => (
            <div key={index} className="bg-dark-900/30 p-4 rounded-lg border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-300">Question {index + 1}</h4>
                <span className={`font-bold ${typeof ev.score === 'number' && ev.score >= 80 ? 'text-emerald-400' : typeof ev.score === 'number' && ev.score >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
                  Score: {typeof ev.score === 'number' ? `${ev.score}/100` : ev.score}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">{ev.feedback}</p>
              
              {/* Question Emotion Stats */}
              {ev.emotions && (
                <div className="border-t border-white/5 pt-3 mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Non-Verbal Stats:
                  </span>
                  {Object.entries(ev.emotions)
                    .filter(([_, val]) => val > 10) // Only show emotions with >10% score
                    .map(([emo, val], idx) => (
                      <span key={idx} className="bg-dark-950/50 px-2 py-0.5 rounded border border-white/5">
                        <span className="capitalize">{emo}</span>: {val}%
                      </span>
                    ))}
                  {ev.eyeContactScore !== undefined && ev.eyeContactScore !== null && (
                    <span className="bg-dark-950/50 px-2 py-0.5 rounded border border-white/5">
                      Eye Contact: {ev.eyeContactScore}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <button 
            className="btn-primary"
            onClick={() => {
              resetInterview();
              navigate('/setup');
            }}
          >
            Start New Interview
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;
