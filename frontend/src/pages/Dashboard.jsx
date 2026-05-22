import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_interviews: 0, average_score: 0, strengths: 'No data yet', history: [], percentile: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = user?.email || 'guest_user';
        const response = await axios.get(`${API_BASE_URL}/api/interview/stats?user_id=${userId}`);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Your Dashboard</h1>
        {user && <span className="text-gray-400 text-sm truncate">{user.email}</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="glass-card p-4 md:p-6 border-t-4 border-t-primary-500">
          <h3 className="text-gray-400 mb-1 md:mb-2 font-medium text-xs md:text-sm">Total Interviews</h3>
          <p className="text-2xl md:text-4xl font-bold text-white">{stats.total_interviews}</p>
        </div>
        <div className="glass-card p-4 md:p-6 border-t-4 border-t-accent-500">
          <h3 className="text-gray-400 mb-1 md:mb-2 font-medium text-xs md:text-sm">Average Score</h3>
          <p className="text-2xl md:text-4xl font-bold text-accent-400">{stats.average_score}%</p>
        </div>
        <div className="glass-card p-4 md:p-6 border-t-4 border-t-emerald-500">
          <h3 className="text-gray-400 mb-1 md:mb-2 font-medium text-xs md:text-sm">Top Strengths</h3>
          <p className="text-base md:text-xl font-bold text-emerald-400 truncate" title={stats.strengths}>
            {stats.strengths}
          </p>
        </div>
        <div className="glass-card p-4 md:p-6 border-t-4 border-t-amber-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-40 group-hover:opacity-70 transition-opacity">
            <span className="text-4xl md:text-6xl">🏆</span>
          </div>
          <h3 className="text-gray-400 mb-1 md:mb-2 font-medium relative z-10 text-xs md:text-sm">Peer Comparison</h3>
          <p className="text-xl md:text-3xl font-bold text-amber-400 relative z-10">
            {stats.total_interviews > 0 
              ? `Top ${Math.max(1, 100 - (stats.percentile || 0))}%` 
              : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1 relative z-10">
            {stats.total_interviews > 0 ? 'Of all developers' : 'Complete an interview'}
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 md:p-8">
        <h3 className="text-xl font-bold mb-6">Performance Trend</h3>
        <div className="h-80 w-full">
          {stats.history && stats.history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  tick={{fill: '#9CA3AF'}} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  tick={{fill: '#9CA3AF'}} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', borderColor: '#374151', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#E5E7EB' }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} - ${payload[0].payload.date}`;
                    }
                    return label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#111827' }}
                  activeDot={{ r: 6, fill: '#A78BFA' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="mb-2">No interview data available yet.</p>
              <p className="text-sm">Complete your first mock interview to see your progress!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
