import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, Loader2, ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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

const AtsChecker = () => {
  const navigate = useNavigate();
  
  const [role, setRole] = useState(ROLES[0]);
  const [file, setFile] = useState(null);
  
  const [atsResult, setAtsResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAtsResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setAtsResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_role', role);
      
      const resumeResponse = await axios.post(`${API_BASE_URL}/api/resume/analyze`, formData);
      
      setAtsResult(resumeResponse.data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProceedToInterview = () => {
    // Optionally pass the skills to the setup page via state if desired
    navigate('/setup', { state: { predefinedSkills: atsResult?.skills_extracted, role: role } });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="glass-panel p-8 mb-8">
        <h1 className="text-3xl font-bold mb-6">ATS Resume Checker</h1>
        <p className="text-gray-400 mb-8">Upload your resume to see how well it matches your target role. Get an ATS score, extracted skills, and actionable suggestions to improve your chances.</p>
        
        <form className="space-y-6" onSubmit={handleAnalyze}>
          <div>
            <label className="block text-gray-400 mb-2">Target Role</label>
            <div className="relative">
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field bg-dark-900/50 appearance-none pr-10"
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="bg-dark-900 text-white">{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2">Upload Resume (PDF only)</label>
            <div 
              className={`border-2 border-dashed ${file ? 'border-primary-500 bg-primary-500/10' : 'border-white/20 hover:bg-white/5'} rounded-lg p-10 text-center transition-colors relative cursor-pointer group`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Click to upload resume"
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-10 h-10 text-primary-500" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <p className="text-sm text-primary-400 mt-2 group-hover:underline">Click or drag to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-dark-900/50 rounded-full group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  </div>
                  <p className="text-gray-300 font-medium">Drag & drop your resume PDF here</p>
                  <p className="text-sm text-gray-500">or click to browse from your computer</p>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary w-full flex justify-center items-center gap-2"
            disabled={isAnalyzing || !file}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Resume...</>
            ) : (
              "Check ATS Score"
            )}
          </button>
        </form>
      </div>

      {/* ATS Results Section */}
      {atsResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 mb-8 border-t-4 border-t-primary-500"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">ATS Resume Analysis</h2>
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-dark-900/50" />
                <circle 
                  cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`} 
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - atsResult.ats_score / 100)}`}
                  className={`${atsResult.ats_score >= 80 ? 'text-emerald-500' : atsResult.ats_score >= 50 ? 'text-yellow-500' : 'text-rose-500'} transition-all duration-1000 ease-out`} 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{atsResult.ats_score}</span>
                <span className="text-xs text-gray-400">ATS Match</span>
              </div>
            </div>
            
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="bg-dark-900/50 p-4 rounded-lg">
                <h3 className="font-bold text-emerald-400 mb-2">Detected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {atsResult.skills_extracted?.map(skill => (
                    <span key={skill} className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-lg">
                <h3 className="font-bold text-rose-400 mb-2">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {atsResult.missing_keywords?.map(keyword => (
                    <span key={keyword} className="bg-rose-500/20 text-rose-300 text-xs px-2 py-1 rounded">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-900/30 p-4 rounded-lg border border-white/5 mb-8">
            <h3 className="font-bold text-gray-300 mb-2">Suggestions to Improve</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
              {atsResult.suggestions?.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>

          <button 
            type="button" 
            onClick={handleProceedToInterview}
            className="btn-primary w-full flex justify-center items-center gap-2 text-lg py-3"
          >
            Start Live AI Interview <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AtsChecker;
