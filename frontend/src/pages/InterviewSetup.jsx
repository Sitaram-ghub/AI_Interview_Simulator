import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronDown, Tag, Timer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import useInterviewStore from '../store/interviewStore';

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

const InterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setInterviewData, setIsGenerating, isGenerating, error, setError } = useInterviewStore();
  
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [githubUsername, setGithubUsername] = useState("");
  const [timerValue, setTimerValue] = useState("");

  // If navigated from ATS Checker, pre-fill role and skills
  useEffect(() => {
    if (location.state) {
      if (location.state.role) setRole(location.state.role);
      if (location.state.predefinedSkills && location.state.predefinedSkills.length > 0) {
        setSkillsList(location.state.predefinedSkills);
      }
    }
  }, [location.state]);

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

  const handleGenerateInterview = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (!role) {
      setError("Please select a Role.");
      return;
    }
    if (!experience) {
      setError("Please select an Experience Level.");
      return;
    }
    if (!interviewType) {
      setError("Please select an Interview Type.");
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
            const ghResponse = await axios.get(`${API_BASE_URL}/api/interview/github/${cleanGithubUsername}`);
            if (ghResponse.data && ghResponse.data.projects_summary) {
              githubProjects = ghResponse.data.projects_summary;
            }
          } catch (ghErr) {
            console.warn("GitHub fetch failed, continuing without projects:", ghErr);
            // Don't block interview generation - just continue without GitHub data
          }
        }
      }

      const response = await axios.post(`${API_BASE_URL}/api/interview/generate`, {
        role: role,
        experience: experience,
        skills: skillsList.length > 0 ? skillsList : ["General Software Engineering"],
        interview_type: interviewType,
        github_projects: githubProjects
      });
      
      setInterviewData(response.data.interview_id, role, response.data.questions, Number(timerValue));
      navigate('/room');
    } catch (err) {
      console.error(err);
      setError("Failed to generate interview. Please check if the backend is running and API keys are set.");
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
      <div className="glass-panel p-5 md:p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Configure Your Interview</h1>
        <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base">Set up the parameters for your AI mock interview.</p>
        
        <form className="space-y-6" onSubmit={handleGenerateInterview}>
          <div>
            <label className="block text-gray-400 mb-2">Role</label>
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
            <label className="block text-gray-400 mb-2">Interview Type</label>
            <div className="relative">
              <select 
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="input-field bg-dark-900/50 appearance-none pr-10"
              >
                <option value="" disabled className="bg-dark-900 text-gray-500">Select Interview Type</option>
                <option value="Mixed" className="bg-dark-900 text-white">Mixed (Technical & HR)</option>
                <option value="Behavioral" className="bg-dark-900 text-white">Behavioral / HR Only</option>
                <option value="Technical" className="bg-dark-900 text-white">Technical Only</option>
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
            <p className="text-xs text-gray-500 mt-2">These skills will be used to generate specific technical questions.</p>
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
                className="input-field"
              />
            </div>
            <p className="text-xs text-primary-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
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
            className="btn-primary w-full flex justify-center items-center gap-2 py-3 text-lg"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Interview...</>
            ) : (
              "Start AI Interview"
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default InterviewSetup;
