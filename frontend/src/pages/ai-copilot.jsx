import React, { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, endpoints } from '../utils/api';

export default function AiCopilotPage() {
  const { session } = useAuth();
  const [question, setQuestion] = useState('What should I prioritize this week to improve delivery and sales outcomes?');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askCopilot = async (e) => {
    e.preventDefault();
    if (!question.trim() || !session?.access_token) return;

    const prompt = question.trim();
    setMessages((prev) => [...prev, { role: 'user', text: prompt }]);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}${endpoints.aiCopilot}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question: prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to get copilot response');

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer, source: data.source },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Bot className="h-8 w-8 text-blue-400" /> AI Copilot</h1>
        <p className="text-gray-400 mt-2">Ask natural-language questions about your projects, leads, and workforce.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-gray-800/50 border border-white/10 rounded-2xl p-4 min-h-[420px]">
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="text-sm text-gray-400 rounded-xl border border-dashed border-white/20 p-4">
                Try: "Which projects are at risk and what should we do first?"
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-xl ${m.role === 'user' ? 'bg-blue-600/30 ml-10' : 'bg-gray-900/80 mr-10 border border-white/10'}`}>
                <p className="text-sm text-white">{m.text}</p>
                {m.source && <p className="text-xs text-gray-400 mt-1">source: {m.source}</p>}
              </div>
            ))}
          </div>

          <form onSubmit={askCopilot} className="mt-4 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask AI Copilot..."
              className="w-full bg-gray-900/60 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold disabled:bg-gray-600 flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> {loading ? 'Thinking...' : 'Send'}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="xl:col-span-4 bg-gray-800/50 border border-white/10 rounded-2xl p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-400" /> Suggested prompts</h2>
          <ul className="text-sm text-gray-300 mt-3 space-y-2 list-disc pl-5">
            <li>Which deals should sales close first this month?</li>
            <li>Where should we reassign team capacity to reduce project risk?</li>
            <li>Summarize business health in 5 bullet points.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
