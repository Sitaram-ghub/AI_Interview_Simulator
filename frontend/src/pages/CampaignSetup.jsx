import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronDown, Tag, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer (iOS/Android)",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Product Manager",
  "UI/UX Designer",
  "QA Engineer",
  "HR Professional"
];

const TIMER_OPTIONS = [
  { label: "1 Minute", value: 60 },
  { label: "2 Minutes", value: 120 },
  { label: "3 Minutes", value: 180 },
  { label: "4 Minutes", value: 240 }
];

const CampaignSetup = () => {
  const navigate = useNavigate();
  
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [githubUsername, setGithubUsername] = useState("");
  const [timerValue, setTimerValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillsInput.trim()) {
      e.preventDefault();
      if (!skillsList.includes(skillsInput.trim())) {
        setSkillsList([...skillsList, skillsInput.trim()]);
      }
      setSkillsInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleGenerateCampaign = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (!role) {
      setError("Please select a Target Role.");
      return;
    }
    if (!experience) {
      setError("Please select an Experience Level.");
      return;
    }
    if (!timerValue) {
      setError("Please select a Timer duration.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      let githubProjects = null;
      let cleanGithubUsername = githubUsername.trim();
      
      if (cleanGithubUsername) {
        // Extract username from URL if needed
        if (cleanGithubUsername.includes('github.com/')) {
          cleanGithubUsername = cleanGithubUsername.split('github.com/')[1].split('/')[0].split('?')[0];
        }
        // Remove any leading @ or trailing whitespace
        cleanGithubUsername = cleanGithubUsername.replace(/^@/, '').trim();
        
        if (cleanGithubUsername) {
          try {
            const ghResponse = await axios.get(`http://localhost:8000/api/interview/github/${cleanGithubUsername}`);
            if (ghResponse.data && ghResponse.data.projects_summary) {
              githubProjects = ghResponse.data.projects_summary;
            }
          } catch (ghErr) {
            console.warn("GitHub fetch failed, continuing without projects:", ghErr);
          }
        }
      }

      // For campaign mode, don't generate questions yet. Just navigate to CampaignRoom
      navigate('/campaign', { state: { role, experience, skillsList, githubProjects, timerSeconds: Number(timerValue) } });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-panel p-5 md:p-8 mb-8 border border-indigo-500/30">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">Day at FAANG Campaign</h1>
        <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base">Set up your profile to face a grueling 3-round FAANG interview.</p>
        
        <form className="space-y-6" onSubmit={handleGenerateCampaign}>
          <div>
            <label className="block text-gray-400 mb-2">Target Role</label>
            <div className="relative">
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field bg-dark-900/50 appearance-none pr-10"
              >
                <option value="" disabled className="bg-dark-900 text-gray-500">Select a Role</option>
                {ROLES.map(r => (
                  <option key={r} value={r} className="bg-dark-900 text-white">{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Experience Level</label>
            <div className="relative">
              <select 
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="input-field bg-dark-900/50 appearance-none pr-10"
              >
                <option value="" disabled className="bg-dark-900 text-gray-500">Select Experience Level</option>
                <option className="bg-dark-900 text-white" value="Junior (0-2 years)">Junior (0-2 years)</option>
                <option className="bg-dark-900 text-white" value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                <option className="bg-dark-900 text-white" value="Senior (5+ years)">Senior (5+ years)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Key Skills / Technologies</label>
            <div className="bg-dark-900/50 border border-white/10 rounded-lg p-3 flex flex-wrap gap-2 items-center focus-within:border-primary-500 transition-colors">
              {skillsList.map(skill => (
                <span key={skill} className="bg-primary-500/20 text-primary-300 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white">&times;</button>
                </span>
              ))}
              <div className="flex-1 min-w-[120px] flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Type a skill and press Enter"
                  className="bg-transparent border-none outline-none text-white w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2 flex items-center gap-2">
              <Timer className="w-4 h-4" /> Question Timer
            </label>
            <div className="relative">
              <select 
                value={timerValue}
                onChange={(e) => setTimerValue(e.target.value)}
                className="input-field bg-dark-900/50 appearance-none pr-10"
              >
                <option value="" disabled className="bg-dark-900 text-gray-500">Select Timer Duration</option>
                {TIMER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-dark-900 text-white">{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Time allowed per question to read and answer.</p>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2">GitHub Username (Optional)</label>
            <div className="relative">
              <input 
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Enter your GitHub username"
                className="input-field focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              AI will fetch your top projects and tailor the interview!
            </p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] w-full flex justify-center items-center gap-2 py-3 text-lg"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Profile...</>
            ) : (
              "Start Campaign"
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default CampaignSetup;
