import React, { useState, useEffect } from 'react';
import * as actions from '../actions';

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
  estimatedMinutes?: number;
  priority?: 'high' | 'medium' | 'low';
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

interface WeekHistory {
  week: number;
  data: SprintPlanData;
}

export default function SprintPlan({ idea, auditResult }: SprintPlanProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekHistory, setWeekHistory] = useState<WeekHistory[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-sprint-weeks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWeekHistory(parsed);
        setCurrentWeek(parsed.length - 1);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (weekHistory.length > 0) {
      localStorage.setItem('co-validator-sprint-weeks', JSON.stringify(weekHistory));
    }
  }, [weekHistory]);

  const sprintData = weekHistory[currentWeek]?.data || null;

  const generatePlan = async (isNextWeek = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;

      let previousWeekSummary: string | undefined;
      if (isNextWeek && weekHistory.length > 0) {
        const lastWeek = weekHistory[weekHistory.length - 1].data;
        const completedTasks = lastWeek.days.flatMap(d => d.tasks.filter(t => t.completed).map(t => t.title));
        const incompleteTasks = lastWeek.days.flatMap(d => d.tasks.filter(t => !t.completed).map(t => t.title));
        previousWeekSummary = `Week ${weekHistory.length} Summary:\nFocus: ${lastWeek.focusOfTheWeek}\nCompleted: ${completedTasks.join(', ') || 'None'}\nIncomplete: ${incompleteTasks.join(', ') || 'None'}`;
      }

      const res = await actions.runSprintPlan(idea, auditResult, token, previousWeekSummary);
      if (res.result) {
        const newWeek: WeekHistory = { week: weekHistory.length + 1, data: res.result };
        const updated = [...weekHistory, newWeek];
        setWeekHistory(updated);
        setCurrentWeek(updated.length - 1);
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
    setWeekHistory(prev => {
      const next = [...prev];
      const weekData = { ...next[currentWeek].data };
      const days = [...weekData.days];
      const tasks = [...days[dayIndex].tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], completed: !tasks[taskIndex].completed };
      days[dayIndex] = { ...days[dayIndex], tasks };
      weekData.days = days;
      next[currentWeek] = { ...next[currentWeek], data: weekData };
      return next;
    });
  };

  const calculateProgress = () => {
    if (!sprintData) return 0;
    let total = 0, completed = 0;
    sprintData.days.forEach(d => {
      d.tasks.forEach(t => { total++; if (t.completed) completed++; });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  if (weekHistory.length === 0 && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <h2 className="text-3xl font-black text-orange-500 uppercase tracking-tighter">"Now What?"</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          You have the audit. Now you need a highly tactical, 7-day action plan to kill or validate this idea before next Monday.
        </p>
        <button
          onClick={() => generatePlan(false)}
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
      {/* Week Selector */}
      {weekHistory.length > 1 && (
        <div className="flex gap-2 justify-center">
          {weekHistory.map((w, i) => (
            <button key={i} onClick={() => setCurrentWeek(i)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentWeek === i ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >Week {w.week}</button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Action Engine</h2>
        <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl max-w-2xl mx-auto">
          <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest block mb-2">Focus of Week {weekHistory[currentWeek]?.week || 1}</span>
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
          <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${progress}%` }} />
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
                    <button onClick={() => toggleTask(dIndex, tIndex)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${task.completed ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/20 hover:border-orange-500/50'}`}
                    >
                      {task.completed && <span>✓</span>}
                    </button>
                  </div>
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-base font-bold ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h4>
                      {task.priority && (
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${priorityColors[task.priority] || priorityColors.medium}`}>
                          {task.priority}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-white/5 text-gray-400 border border-white/10">
                          ⏱ {task.estimatedMinutes}m
                        </span>
                      )}
                    </div>
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

      {/* Week 2 Button */}
      <div className="text-center pt-8 space-y-4">
        {progress >= 50 && currentWeek === weekHistory.length - 1 && (
          <button onClick={() => generatePlan(true)}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
          >
            Generate Week {weekHistory.length + 1} Sprint
          </button>
        )}
        <div>
          <button onClick={() => {
            if (confirm("Delete all sprint data?")) { setWeekHistory([]); localStorage.removeItem('co-validator-sprint-weeks'); }
          }}
            className="text-xs text-gray-500 uppercase tracking-widest font-bold hover:text-red-400 transition-colors"
          >
            Reset All Sprints
          </button>
        </div>
      </div>
    </div>
  );
}
