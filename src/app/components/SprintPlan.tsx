import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
// Define IdeaInput locally since page.tsx doesn't export it
export interface IdeaInput {
  name: string;
  problem: string;
  solution: string;
  targetAudience: string;
  [key: string]: any;
}

interface SprintPlanProps {
  idea: IdeaInput;
  auditResult: any;
}

interface Task {
  title: string;
  description: string;
  metric: string;
  completed?: boolean;
}

interface DayPlan {
  day: number;
  theme: string;
  tasks: Task[];
}

interface SprintPlanData {
  focusOfTheWeek: string;
  days: DayPlan[];
}

export default function SprintPlan({ idea, auditResult }: SprintPlanProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sprintData, setSprintData] = useState<SprintPlanData | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('co-validator-sprint-plan');
    if (saved) {
      try {
        setSprintData(JSON.parse(saved));
      } catch (e) {
        // ignore parse error
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (sprintData) {
      localStorage.setItem('co-validator-sprint-plan', JSON.stringify(sprintData));
    }
  }, [sprintData]);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const res = await actions.runSprintPlan(idea, auditResult, token);
      if (res.result) {
        setSprintData(res.result);
      } else {
        setError("Failed to generate sprint plan. The AI returned empty data.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (dayIndex: number, taskIndex: number) => {
    if (!sprintData) return;
    const newData = { ...sprintData };
    const task = newData.days[dayIndex].tasks[taskIndex];
    task.completed = !task.completed;
    setSprintData(newData);
  };

  const calculateProgress = () => {
    if (!sprintData) return 0;
    let total = 0;
    let completed = 0;
    sprintData.days.forEach(d => {
      d.tasks.forEach(t => {
         total++;
         if (t.completed) completed++;
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  if (!sprintData && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <h2 className="text-3xl font-black text-orange-500 uppercase tracking-tighter">"Now What?"</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          You have the audit. Now you need a highly tactical, 7-day action plan to kill or validate this idea before next Monday.
        </p>
        <button
          onClick={generatePlan}
          className="px-8 py-4 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          Generate 7-Day Sprint Plan
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-20 animate-fade-in">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-orange-400 font-bold animate-pulse text-sm">Synthesizing Tactical Sprint...</p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Action Engine</h2>
        <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl max-w-2xl mx-auto">
          <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest block mb-2">Focus of the Week</span>
          <p className="text-lg text-white font-bold leading-tight">"{sprintData?.focusOfTheWeek}"</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <div className="flex justify-between items-end mb-4">
           <span className="text-xs font-black uppercase text-gray-400">Sprint Progress</span>
           <span className="text-2xl font-black text-white">{progress}%</span>
        </div>
        <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Days Grid */}
      <div className="space-y-6">
        {sprintData?.days.map((day, dIndex) => (
          <div key={day.day} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-colors">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-4">
              <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">Day {day.day}</span>
              <h3 className="text-sm font-bold text-gray-300">{day.theme}</h3>
            </div>
            <div className="p-6 space-y-6">
              {day.tasks.map((task, tIndex) => (
                <div key={tIndex} className="flex gap-4">
                  <div className="pt-1">
                    <button 
                      onClick={() => toggleTask(dIndex, tIndex)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${task.completed ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/20 hover:border-orange-500/50'}`}
                    >
                      {task.completed && <span>✓</span>}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <h4 className={`text-base font-bold ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h4>
                    <p className={`text-sm leading-relaxed ${task.completed ? 'text-gray-600' : 'text-gray-400'}`}>{task.description}</p>
                    <div className="inline-block px-3 py-1 bg-white/5 rounded text-[10px] font-black uppercase text-orange-400 border border-orange-500/20">
                      🎯 Goal: {task.metric}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center pt-8">
        <button 
          onClick={() => {
            if (confirm("Are you sure? This will delete your current sprint plan and generate a new one.")) {
              setSprintData(null);
            }
          }}
          className="text-xs text-gray-500 uppercase tracking-widest font-bold hover:text-red-400 transition-colors"
        >
          Reset Sprint Plan
        </button>
      </div>
    </div>
  );
}
