import { create } from 'zustand';

const useInterviewStore = create((set) => ({
  interviewId: null,
  role: '',
  questions: [],
  evaluations: [],
  currentQuestionIndex: 0,
  isGenerating: false,
  error: null,
  timerSeconds: 180,
  
  setInterviewData: (id, role, questions, timerSeconds = 180) => set({ 
    interviewId: id,
    role: role,
    questions: questions,
    evaluations: [],
    currentQuestionIndex: 0,
    error: null,
    timerSeconds: timerSeconds
  }),

  addEvaluation: (evaluation) => set((state) => ({
    evaluations: [...state.evaluations, evaluation]
  })),
  
  setIsGenerating: (status) => set({ isGenerating: status }),
  
  setError: (error) => set({ error }),
  
  nextQuestion: () => set((state) => ({
    currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1)
  })),
  
  resetInterview: () => set({
    interviewId: null,
    role: '',
    questions: [],
    evaluations: [],
    currentQuestionIndex: 0,
    isGenerating: false,
    error: null,
    timerSeconds: 180
  })
}));

export default useInterviewStore;
