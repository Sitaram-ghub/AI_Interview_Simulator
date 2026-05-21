import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useInterviewStore from '../store/interviewStore';
import { Loader2, Mic, MicOff, Volume2, Video, Trophy, TrendingUp, AlertTriangle, CheckCircle2, Award, Activity, Sparkles, ChevronRight, BookOpen } from 'lucide-react';
import axios from 'axios';
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js';

// Top-level helpers for AI Smart-Cam Emotion Optimization
const mapExpressionsToInterviewStats = (expressions, behavior) => {
  if (!expressions) return { happy: 0, neutral: 100, confident: 0, nervous: 0, sad: 0 };
  
  const { happy = 0, neutral = 0, sad = 0, angry = 0, fearful = 0, surprised = 0, disgusted = 0 } = expressions;
  const isStable = behavior?.isStable !== false; // default to true
  const eyeContactDetected = behavior?.eyeContactDetected !== false; // default to true
  const isListening = !!behavior?.isListening;

  // 1. Happy/Smile Boosting: Natural smiles can be subtle (0.03 - 0.20 raw).
  // We amplify happy expressions and scale with voice/energetic engagement.
  let happyScore = happy > 0.03 ? Math.min(1.0, happy * 5.0) : happy;
  if (happyScore > 0.1 && isListening) {
    happyScore = Math.min(1.0, happyScore * 1.3);
  }

  // 2. Confident Score: Incorporate eye contact, stable posture, facial stability, and vocal confidence.
  let confidentScore = 0;
  if (eyeContactDetected) confidentScore += 0.35;
  if (isStable) confidentScore += 0.35;
  if (isListening) confidentScore += 0.20;
  
  // Confident facial expressions (pleasant interest or focused response)
  if (happy >= 0.02 && happy <= 0.4) {
    confidentScore += happy * 1.5;
  }
  if (surprised > 0.1 && fearful < 0.1 && angry < 0.1) {
    confidentScore += surprised * 0.8;
  }
  confidentScore = Math.min(1.0, confidentScore);

  // 3. Nervous Score: Detect fear, anger, disgust, or postural fidgeting (eye contact is true but posture unstable).
  let nervousScore = fearful * 2.5 + angry * 1.5 + disgusted * 1.0;
  if (eyeContactDetected && !isStable) {
    nervousScore += 0.40; // Fidgeting boost
  }
  if (surprised > 0.25 && (fearful > 0.1 || angry > 0.1)) {
    nervousScore += surprised * 1.0;
  }
  nervousScore = Math.min(1.0, nervousScore);

  // 4. Sad Score: Flat expressions, elevated raw sad, or complete disengagement.
  let sadScore = sad > 0.05 ? Math.min(1.0, sad * 4.5) : sad;
  sadScore = Math.min(1.0, sadScore);

  // 5. Neutral (Calm) Score: The resting baseline.
  // We significantly dampen the raw neutral value (which otherwise sits at 95%+)
  // to allow the active behavioral signals (like Confident, Happy) to shine.
  let neutralScore = neutral * 0.18;
  if (!isListening && isStable && eyeContactDetected && happy < 0.05 && sad < 0.05 && fearful < 0.05) {
    // Resting calmly
    neutralScore += 0.25;
  }
  neutralScore = Math.min(1.0, Math.max(0.05, neutralScore));

  // Sum up and normalize to 100%
  const sum = happyScore + confidentScore + nervousScore + sadScore + neutralScore;
  if (sum > 0) {
    const rawStats = {
      happy: (happyScore / sum) * 100,
      neutral: (neutralScore / sum) * 100,
      confident: (confidentScore / sum) * 100,
      nervous: (nervousScore / sum) * 100,
      sad: (sadScore / sum) * 100
    };

    // Return rounded stats that sum precisely to 100
    const rounded = {
      happy: Math.round(rawStats.happy),
      neutral: Math.round(rawStats.neutral),
      confident: Math.round(rawStats.confident),
      nervous: Math.round(rawStats.nervous),
      sad: Math.round(rawStats.sad)
    };

    // Adjust any rounding discrepancy to make sure sum is exactly 100
    const roundedSum = rounded.happy + rounded.neutral + rounded.confident + rounded.nervous + rounded.sad;
    const diff = 100 - roundedSum;
    if (diff !== 0) {
      const maxKey = Object.keys(rounded).reduce((a, b) => rounded[a] > rounded[b] ? a : b);
      rounded[maxKey] += diff;
    }
    return rounded;
  }

  return { happy: 0, neutral: 100, confident: 0, nervous: 0, sad: 0 };
};

const mapRawToInterviewEmotion = (expressions, behavior) => {
  if (!expressions) return 'neutral';
  const stats = mapExpressionsToInterviewStats(expressions, behavior);
  
  let maxEmo = 'neutral';
  let maxVal = -1;
  Object.entries(stats).forEach(([emo, val]) => {
    if (val > maxVal) {
      maxVal = val;
      maxEmo = emo;
    }
  });
  return maxEmo;
};

const getMode = (arr) => {
  if (arr.length === 0) return '';
  const counts = {};
  let maxCount = 0;
  let mode = arr[0];
  arr.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      mode = val;
    }
  });
  return mode;
};

const InterviewRoom = () => {
  const navigate = useNavigate();
  const { questions, currentQuestionIndex, nextQuestion, interviewId, addEvaluation, timerSeconds, evaluations } = useInterviewStore();
  
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  
  // Timer State — uses the user-selected duration from setup
  const INITIAL_TIME = timerSeconds || 180;
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const timerRef = useRef(null);
  
  // Hint State
  const [hint, setHint] = useState(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  
  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isVoiceModeRef = useRef(false);
  const voicesLoadedRef = useRef(false);

  // Camera & AI Emotion Tracking State
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [dominantEmotion, setDominantEmotion] = useState('');
  const [eyeContactDetected, setEyeContactDetected] = useState(true);
  const [questionEmotions, setQuestionEmotions] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Refs for video & detection
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const questionEmotionsRef = useRef([]);
  const emotionHistoryRef = useRef([]);
  const lastBoxRef = useRef(null);
  const isListeningRef = useRef(false);

  // Keep ref updated to prevent stale closures
  useEffect(() => {
    questionEmotionsRef.current = questionEmotions;
  }, [questionEmotions]);

  // Keep voice mode ref in sync with state
  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  // Keep isListening ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Preload speech synthesis voices (Chrome loads them asynchronously)
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) voicesLoadedRef.current = true;
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Auto-read question aloud when question changes and voice mode is ON
  useEffect(() => {
    if (isVoiceMode && questions && questions.length > 0) {
      // Small delay to let the UI update first
      const timeout = setTimeout(() => {
        readQuestionOutLoud(currentQuestionIndex);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentQuestionIndex, isVoiceMode]);

  // Model loading helper
  const loadFaceApiModels = async () => {
    if (modelsLoaded) return;
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load face-api models from CDN", err);
      throw err;
    }
  };

  // Start webcam and model detection
  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    
    // Step 1: Open camera first (independent of AI models)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' } 
      });
      streamRef.current = stream;
      setIsCameraReady(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError("Please enable your webcam to start the interview.");
      setIsCameraEnabled(false);
      setIsCameraReady(false);
      setIsCameraLoading(false);
      return;
    }
    
    // Step 2: Load AI models in background (camera already works)
    try {
      await loadFaceApiModels();
    } catch (err) {
      console.warn("AI emotion models failed to load. Camera preview will work but emotion detection is disabled.", err);
    }
    
    setIsCameraLoading(false);
  };

  // Stop webcam
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    setDominantEmotion('');
    setEyeContactDetected(true);
  };

  // Track state to start/stop camera
  useEffect(() => {
    if (isCameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraEnabled]);

  // Feed stream to video ref
  useEffect(() => {
    if (isCameraReady && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraReady, videoRef.current]);

  // Detection loop (only runs when models are loaded)
  useEffect(() => {
    if (isCameraEnabled && isCameraReady && modelsLoaded && videoRef.current) {
      detectionIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        
        try {
          const detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceExpressions();
          
          if (detection) {
            setEyeContactDetected(true);
            const expressions = detection.expressions;
            const box = detection.box || (detection.detection && detection.detection.box);
            
            let isStable = true;
            if (box) {
              if (lastBoxRef.current) {
                const deltaX = Math.abs(box.x - lastBoxRef.current.x);
                const deltaY = Math.abs(box.y - lastBoxRef.current.y);
                isStable = deltaX < 15 && deltaY < 15;
              }
              lastBoxRef.current = { x: box.x, y: box.y };
            }
            
            const behavior = {
              isStable,
              eyeContactDetected: true,
              isListening: isListeningRef.current
            };
            
            // Map raw face-api detection to professional interview emotion
            const currentEmotion = mapRawToInterviewEmotion(expressions, behavior);
            
            // Push to rolling history buffer for real-time smoothing
            emotionHistoryRef.current.push(currentEmotion);
            if (emotionHistoryRef.current.length > 5) {
              emotionHistoryRef.current.shift();
            }
            
            // Get smoothed dominant emotion using mode
            const smoothedEmotion = getMode(emotionHistoryRef.current);
            setDominantEmotion(smoothedEmotion);
            
            // Calculate proportional mapped distribution for telemetry
            const mappedDist = mapExpressionsToInterviewStats(expressions, behavior);
            
            setQuestionEmotions(prev => [...prev, {
              timestamp: Date.now(),
              expressions: mappedDist,
              faceDetected: true
            }]);
          } else {
            setEyeContactDetected(false);
            setDominantEmotion('');
            emotionHistoryRef.current = []; // Reset smoothing history when no face is found
            lastBoxRef.current = null;
            
            setQuestionEmotions(prev => [...prev, {
              timestamp: Date.now(),
              expressions: null,
              faceDetected: false
            }]);
          }
        } catch (err) {
          console.error("Detection error:", err);
        }
      }, 1500);
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isCameraEnabled, isCameraReady, modelsLoaded]);

  // Calculate stats for current question
  const calculateQuestionEmotions = () => {
    const logs = questionEmotionsRef.current;
    if (logs.length === 0) return null;
    
    const totals = {
      neutral: 0,
      happy: 0,
      confident: 0,
      nervous: 0,
      sad: 0
    };
    
    let detectedFrames = 0;
    const totalFrames = logs.length;
    
    logs.forEach(log => {
      if (log.faceDetected && log.expressions) {
        detectedFrames++;
        Object.keys(totals).forEach(emo => {
          totals[emo] += log.expressions[emo] || 0;
        });
      }
    });
    
    const avgEmotions = {};
    if (detectedFrames > 0) {
      Object.keys(totals).forEach(emo => {
        avgEmotions[emo] = Math.round(totals[emo] / detectedFrames);
      });
    } else {
      Object.keys(totals).forEach(emo => {
        avgEmotions[emo] = 0;
      });
    }
    
    const eyeContactScore = Math.round((detectedFrames / totalFrames) * 100);
    
    return {
      avgEmotions,
      eyeContactScore
    };
  };

  // Border glow styles based on emotion
  const getAuraColor = (emotion) => {
    switch (emotion) {
      case 'happy': return 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]';
      case 'confident': return 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]';
      case 'neutral': return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]';
      case 'sad': return 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
      case 'nervous': return 'border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)]';
      default: return 'border-white/10 shadow-none';
    }
  };

  useEffect(() => {
    // Setup Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setAnswer(prev => {
          return currentTranscript; 
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Timer Effect
  useEffect(() => {
    if (feedback !== null || !questions || questions.length === 0 || !isCameraReady) {
      clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerRef.current);
  }, [feedback, currentQuestionIndex, questions, isCameraReady]);

  // Handle timeout auto-submit
  useEffect(() => {
    if (timeLeft === 0 && !isEvaluating && !feedback) {
      if (isListening) toggleListening();
      window.speechSynthesis.cancel();
      
      const hasAnswer = !!answer.trim();
      setIsEvaluating(true);
      
      const submitTimeout = async () => {
        const cameraAnalysis = calculateQuestionEmotions();
        if (!hasAnswer) {
          // Empty answer: bypass backend
          setFeedback({
            score: "Not Evaluated",
            feedback: "Time expired without response. Please try to provide a verbal or written answer next time.",
            metrics: { 
              technical: "Not Evaluated", 
              communication: "Not Evaluated", 
              confidence: "Not Evaluated", 
              grammar: "Not Evaluated", 
              fluency: "Not Evaluated" 
            },
            emotions: cameraAnalysis?.avgEmotions || null,
            eyeContactScore: cameraAnalysis?.eyeContactScore !== undefined ? cameraAnalysis.eyeContactScore : null,
            noAnswer: true,
            noAnswerReason: "Time expired without response"
          });
          setIsEvaluating(false);
        } else {
          // User wrote something: evaluate normally
          try {
            const response = await axios.post('http://localhost:8000/api/interview/evaluate', {
              question_text: questions[currentQuestionIndex].text,
              answer: answer,
              hint_used: hintUsed
            });
            setFeedback({
              ...response.data,
              emotions: cameraAnalysis?.avgEmotions || null,
              eyeContactScore: cameraAnalysis?.eyeContactScore !== undefined ? cameraAnalysis.eyeContactScore : null
            });
          } catch (err) {
            setFeedback({
              score: 0,
              feedback: "Time is up, but failed to connect to evaluation server.",
              metrics: { technical: 0, communication: 0, confidence: 0, grammar: 0, fluency: 0 },
              emotions: null,
              eyeContactScore: null
            });
          } finally {
            setIsEvaluating(false);
          }
        }
      };
      submitTimeout();
    }
  }, [timeLeft]);

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      // Switching TO voice mode: read out the question
      readQuestionOutLoud();
    } else {
      // Switching OFF voice mode
      if (isListening) toggleListening();
      window.speechSynthesis.cancel();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        // Clear answer when starting to speak
        setAnswer('');
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const readQuestionOutLoud = (questionIndex = currentQuestionIndex) => {
    if (!questions || questions.length === 0) return;
    const idx = Math.min(questionIndex, questions.length - 1);
    const questionText = questions[idx].text;
    if (!questionText) return;

    window.speechSynthesis.cancel();

    const speakWithVoice = () => {
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      // Try to get a decent English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google'))
        || voices.find(v => v.lang.includes('en-US'))
        || voices.find(v => v.lang.includes('en'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    };

    // If voices aren't loaded yet (Chrome async loading), wait for them
    if (!voicesLoadedRef.current && window.speechSynthesis.getVoices().length === 0) {
      const onVoicesReady = () => {
        voicesLoadedRef.current = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesReady);
        speakWithVoice();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesReady);
      // Fallback: if voices never load within 500ms, speak anyway with default voice
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesReady);
        if (window.speechSynthesis.speaking) return; // already speaking
        speakWithVoice();
      }, 500);
    } else {
      speakWithVoice();
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-bold mb-4">No Interview Active</h2>
        <button onClick={() => navigate('/setup')} className="btn-primary">Go to Setup</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmitAnswer = async (customAnswer = null) => {
    // Prevent React event object from being treated as customAnswer
    const answerText = typeof customAnswer === 'string' ? customAnswer : answer;
    
    if (isListening) toggleListening(); // stop listening before evaluating
    window.speechSynthesis.cancel();
    clearInterval(timerRef.current);
    
    setIsEvaluating(true);
    
    // If empty answer, bypass backend evaluate endpoint and mock response
    if (!answerText.trim()) {
      const cameraAnalysis = calculateQuestionEmotions();
      setTimeout(() => {
        setFeedback({
          score: "Not Evaluated",
          feedback: "No answer submitted. You skipped this question or the time expired without a response.",
          metrics: { 
            technical: "Not Evaluated", 
            communication: "Not Evaluated", 
            confidence: "Not Evaluated", 
            grammar: "Not Evaluated", 
            fluency: "Not Evaluated" 
          },
          emotions: cameraAnalysis?.avgEmotions || null,
          eyeContactScore: cameraAnalysis?.eyeContactScore !== undefined ? cameraAnalysis.eyeContactScore : null,
          noAnswer: true,
          noAnswerReason: "No answer submitted"
        });
        setIsEvaluating(false);
      }, 500);
      return;
    }
    
    try {
      const cameraAnalysis = calculateQuestionEmotions();
      const response = await axios.post('http://localhost:8000/api/interview/evaluate', {
        question_text: currentQuestion.text,
        answer: answerText,
        hint_used: hintUsed
      });
      setFeedback({
        ...response.data,
        emotions: cameraAnalysis?.avgEmotions || null,
        eyeContactScore: cameraAnalysis?.eyeContactScore !== undefined ? cameraAnalysis.eyeContactScore : null
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        score: 0,
        feedback: "Failed to connect to evaluation server.",
        metrics: { technical: 0, communication: 0, confidence: 0, grammar: 0, fluency: 0 },
        emotions: null,
        eyeContactScore: null
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    addEvaluation(feedback);
    setAnswer('');
    setFeedback(null);
    setHint(null);
    setHintUsed(false);
    setTimeLeft(INITIAL_TIME);
    setQuestionEmotions([]); // Clear emotions for next question
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      nextQuestion();
      // Voice auto-read is now handled by the useEffect watching currentQuestionIndex + isVoiceMode
    } else {
      navigate('/reports');
    }
  };

  const handleGetHint = async () => {
    if (hint || isHintLoading) return;
    
    // Confirm with user about the penalty
    if (!window.confirm("Using a hint will deduct 10 points from your score for this question. Do you want to proceed?")) {
      return;
    }
    
    setIsHintLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/interview/hint', {
        question_text: currentQuestion.text
      });
      setHint(response.data.hint);
      setHintUsed(true);
    } catch (err) {
      console.error("Failed to get hint", err);
      alert("Failed to get a hint. Please try again.");
    } finally {
      setIsHintLoading(false);
    }
  };

  if (!isCameraReady) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel text-center flex flex-col items-center justify-center border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.15)] relative overflow-hidden">
        {/* Subtle glowing backgrounds */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-20 h-20 rounded-full bg-dark-900/60 border border-white/10 flex items-center justify-center mb-6 shadow-inner relative">
          <Video className="w-10 h-10 text-primary-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-dark-950 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">Webcam Access Required</h2>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
          To ensure interview authenticity and enable real-time AI behavior & emotion analysis, you must enable webcam access.
        </p>

        {cameraError ? (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-semibold max-w-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-300 text-xs font-medium max-w-xs flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-400 flex-shrink-0" />
            <span>Waiting for webcam activation...</span>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              setIsCameraEnabled(true);
              startCamera();
            }}
            disabled={isCameraLoading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            {isCameraLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing...
              </>
            ) : (
              "Enable Webcam"
            )}
          </button>
          
          <button
            onClick={() => navigate('/setup')}
            className="btn-secondary w-full py-2.5 text-xs text-gray-400 hover:text-white border-white/5 hover:bg-white/5"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto min-h-[80vh] flex flex-col pb-12"
    >
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Tech Interview</h1>
        <div className={`glass-card px-3 md:px-4 py-2 text-primary-400 font-bold flex items-center gap-2 md:gap-4 text-sm md:text-base`}>
          <span>Q {currentQuestionIndex + 1}/{questions.length}</span>
        </div>
      </div>
      
      <div className={`flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6`}>
        {/* Left Panel: Question & Camera */}
        <div className={`md:col-span-2 glass-panel p-4 md:p-6 flex flex-col relative`}>
          <div className="flex-grow flex flex-col">
            <div className="bg-dark-900/50 rounded-lg p-4 md:p-6 mb-4 md:mb-6 border border-white/5 relative overflow-hidden">
              {/* Timer Progress Bar */}
              <div className="absolute top-0 left-0 h-1 bg-dark-800 w-full">
                <motion.div 
                  className={`h-full ${timeLeft > 45 ? 'bg-emerald-500' : timeLeft > 15 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / INITIAL_TIME) * 100}%` }}
                  transition={{ ease: "linear", duration: 1 }}
                />
              </div>

              <div className="flex justify-between items-start mb-2 mt-2">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    currentQuestion.type === 'hr' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-accent-500/20 text-accent-400'
                  }`}>
                    {currentQuestion.type || 'Technical'} Question
                  </span>
                  
                  <span className={`text-sm font-bold flex items-center gap-1 ${timeLeft > 45 ? 'text-emerald-400' : timeLeft > 15 ? 'text-yellow-400' : 'text-rose-500 animate-pulse'}`}>
                    ⏱ {timeLeft}s
                  </span>
                </div>
                
                {isVoiceMode && (
                  <button onClick={readQuestionOutLoud} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors" title="Read aloud">
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <p className="text-lg text-gray-200 mt-2">
                "{currentQuestion.text}"
              </p>
              
              {hint && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-sm text-yellow-200"
                >
                  <span className="font-bold">💡 Hint: </span>
                  {hint}
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="mt-auto flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4 flex-wrap w-full">
              <div className="flex gap-4 p-1 bg-dark-900/50 rounded-lg border border-white/5 flex-wrap justify-center">
                <button 
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${!isVoiceMode ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => isVoiceMode && toggleVoiceMode()}
                >
                  Text Mode
                </button>
                <button 
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${isVoiceMode ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => !isVoiceMode && toggleVoiceMode()}
                >
                  <Mic className="w-4 h-4" /> Voice Mode
                </button>
              </div>

              <button 
                className="px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 border bg-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                disabled={true}
              >
                <Video className="w-4 h-4" /> AI Smart-Cam: Active
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {/* Webcam Preview Card (1 col) */}
              {isCameraEnabled && (
                <div className="sm:col-span-1 flex flex-col gap-2">
                  <div className={`relative aspect-video sm:aspect-square bg-dark-950 rounded-lg border overflow-hidden flex items-center justify-center transition-all duration-300 ${getAuraColor(dominantEmotion)}`}>
                    {isCameraLoading ? (
                      <div className="flex flex-col items-center gap-2 text-gray-400 p-2 text-center text-xs">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        <span>Initializing Smart-Cam...</span>
                      </div>
                    ) : isCameraReady ? (
                      <>
                        <video 
                          ref={videoRef}
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover scale-x-[-1] rounded-lg"
                        />
                        <div className="absolute top-2 left-2 bg-dark-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/30 animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> AI LIVE
                        </div>
                        
                        {!eyeContactDetected && (
                          <div className="absolute inset-0 bg-rose-950/50 backdrop-blur-[2px] flex items-center justify-center text-center p-2 border border-rose-500/30">
                            <span className="text-rose-200 text-xs font-bold bg-dark-950/90 px-3 py-1.5 rounded-md border border-rose-500/20 shadow-lg animate-bounce">
                              ⚠️ Check Eye Contact
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500 text-xs text-center p-4">Camera inactive. Click toggle to start.</div>
                    )}
                  </div>
                  {isCameraReady && (
                    <div className="bg-dark-900/50 border border-white/5 rounded-md p-2 text-center text-xs flex flex-col gap-0.5">
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Mood:</span>
                        <span className="font-semibold text-white capitalize">{dominantEmotion || 'Calm (Neutral)'}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Presence:</span>
                        <span className={`font-semibold ${eyeContactDetected ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {eyeContactDetected ? 'Active Focus' : 'Looking Away'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Input Area (Textarea or Voice Mode) (takes remaining cols) */}
              <div className={isCameraEnabled ? 'sm:col-span-2' : 'sm:col-span-3'}>
                {isVoiceMode ? (
                  <div className="flex flex-col items-center justify-center h-48 bg-dark-900/30 rounded-lg border border-white/5 p-6 text-center">
                    <motion.button
                      animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
                      onClick={toggleListening}
                      className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                        isListening ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.5)]' : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
                      }`}
                    >
                      {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                    </motion.button>
                    <p className="text-gray-300 font-medium h-12 overflow-hidden text-ellipsis w-full">
                      {isListening ? (answer || "Listening...") : (answer || (feedback ? (feedback.noAnswerReason || "No answer submitted") : "Click microphone to speak"))}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea 
                      className={`input-field h-48 resize-none w-full`} 
                      placeholder={feedback ? (feedback.noAnswerReason || "No answer submitted") : "Type your answer here..."}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={isEvaluating || feedback !== null}
                      spellCheck={true}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col mt-4 gap-4">
              {!feedback ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    className="btn-secondary flex-1 flex items-center gap-2 justify-center text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300 py-2" 
                    onClick={handleGetHint}
                    disabled={isEvaluating || isHintLoading || hint !== null}
                    title="Costs 10 points"
                  >
                    {isHintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "💡 Hint"}
                  </button>
                  <button 
                    className="btn-secondary flex-1 flex items-center gap-2 justify-center text-gray-400 hover:text-white py-2" 
                    onClick={() => handleSubmitAnswer("")}
                    disabled={isEvaluating}
                  >
                    Skip
                  </button>
                  <button 
                    className="btn-primary flex-[2] flex items-center gap-2 justify-center py-2" 
                    onClick={() => handleSubmitAnswer()}
                    disabled={isEvaluating || !answer.trim()}
                  >
                    {isEvaluating ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating</> : "Submit"}
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    className="btn-secondary w-full sm:w-auto justify-center" 
                    onClick={() => setFeedback(null)}
                  >
                    Resubmit Answer
                  </button>
                  <button 
                    className="btn-primary bg-emerald-600 hover:bg-emerald-500 from-emerald-600 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] w-full sm:w-auto justify-center" 
                    onClick={handleNextQuestion}
                  >
                    {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel: AI Feedback */}
        <div className="md:col-span-1 glass-panel p-6 flex flex-col h-[75vh] md:h-auto overflow-hidden">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-3 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-400" /> AI Feedback
          </h3>

          <div className="flex-grow overflow-y-auto pr-1">
            {!feedback ? (
              <div className="text-gray-400 text-sm italic flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <BookOpen className="w-10 h-10 text-gray-600 mb-2" />
                Submit your answer to receive real-time AI evaluation and metrics.
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-gray-400">Score</span>
                  <span className={`text-3xl font-bold ${typeof feedback.score === 'number' && feedback.score >= 80 ? 'text-emerald-400' : typeof feedback.score === 'number' && feedback.score >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
                    {typeof feedback.score === 'number' ? `${feedback.score}/100` : feedback.score}
                  </span>
                </div>
                
                {feedback.metrics && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Technical', value: feedback.metrics.technical },
                        { label: 'Communication', value: feedback.metrics.communication },
                        { label: 'Confidence', value: feedback.metrics.confidence },
                        { label: 'Grammar', value: feedback.metrics.grammar },
                        { label: 'Fluency', value: feedback.metrics.fluency }
                      ].map(metric => (
                        <div key={metric.label}>
                          <div className="flex justify-between text-sm mb-0.5">
                            <span className="text-gray-300">{metric.label}</span>
                            <span className="text-primary-400 font-medium">
                              {typeof metric.value === 'number' ? `${metric.value}%` : 'Not Evaluated'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${typeof metric.value === 'number' ? metric.value : 0}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                typeof metric.value === 'number' && metric.value >= 80 ? 'bg-emerald-500' : 
                                typeof metric.value === 'number' && metric.value >= 60 ? 'bg-yellow-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm text-gray-400 mb-2">Detailed Feedback</h4>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {feedback.feedback}
                  </p>
                  {feedback.weak_topic && feedback.weak_topic !== "N/A" && feedback.weak_topic !== "Unknown" && (
                    <div className="mt-3 inline-block px-2 py-1 bg-rose-500/20 text-rose-300 text-xs rounded-md">
                      ⚠️ Needs Improvement: {feedback.weak_topic}
                    </div>
                  )}
                </div>
                
                {feedback.correct_answer && (
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm text-emerald-400 mb-2 font-medium">✅ Ideal Answer / Correction</h4>
                    <div className="text-gray-300 text-sm leading-relaxed bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg whitespace-pre-line">
                      {feedback.correct_answer}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewRoom;
