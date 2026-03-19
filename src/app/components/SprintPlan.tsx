import React, { useState, useEffect } from 'react';
import * as actions from '../actions';

export interface IdeaInput {
  name: string;
  problem: string;
  solution: string;
  targetAudience: string;
  [key: string]: any;
}

export interface AuditResult {
  [key: string]: any;
}

interface SprintPlanProps {
  idea: IdeaInput;
  auditResult: any;
  rawData?: any;
}

interface TaskInfo {
  id: string;
  title: string;
  description: string;
  metric: string;
  gradingCriteria: string;
  estimatedMinutes?: number;
  priority?: 'high' | 'medium' | 'low';
  dependsOn?: string[];
  
  // State extensions
  status?: 'pending' | 'grading' | 'PASS' | 'FAIL' | 'INCOMPLETE';
  reportedOutcome?: string;
  aiCoaching?: string;
}

interface DayPlan {
  day: number;
  theme: string;
  tasks: TaskInfo[];
}

interface SprintPlanData {
  focusOfTheWeek: string;
  days: DayPlan[];
}

interface WeekHistory {
  week: number;
  data: SprintPlanData;
}

export default function SprintPlan({ idea, auditResult, rawData }: SprintPlanProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekHistory, setWeekHistory] = useState<WeekHistory[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Grading Modal State
  const [gradingTask, setGradingTask] = useState<{ dayIndex: number, taskIndex: number, text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-sprint-weeks');
    if (saved) {
      try {
        setWeekHistory(JSON.parse(saved));
        return;
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (weekHistory.length > 0) {
      localStorage.setItem('co-validator-sprint-weeks', JSON.stringify(weekHistory));
    }
  }, [weekHistory]);

  const generatePlan = async (isNextWeek: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      
      let previousSummary: string | undefined = undefined;
      if (isNextWeek && weekHistory.length > 0) {
        const lastWeek = weekHistory[weekHistory.length - 1].data;
        const completedCount = lastWeek.days.flatMap(d => d.tasks).filter(t => t.status === 'PASS').length;
        const total = lastWeek.days.flatMap(d => d.tasks).length;
        previousSummary = `In Week ${weekHistory.length}, we completed ${completedCount}/${total} tasks. Focus was: ${lastWeek.focusOfTheWeek}. Failed/Incomplete tasks might need new approaches.`;
      }

      const res = await actions.runSprintPlan(idea, auditResult, previousSummary, rawData, token);
      
      if (res.result && res.result.days) {
        // Initialize task states
        res.result.days.forEach((day: DayPlan) => {
          day.tasks.forEach((task: TaskInfo) => {
            task.status = 'pending';
          });
        });

        const newWeekHistory = [...weekHistory, { week: weekHistory.length + 1, data: res.result }];
        setWeekHistory(newWeekHistory);
        setCurrentWeek(newWeekHistory.length - 1);
      } else {
        setError("Failed to parse sprint plan from AI.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred generating the sprint plan.");
    } finally {
      setLoading(false);
    }
  };

  const submitTaskGrade = async () => {
    if (!gradingTask || !gradingTask.text.trim()) return;
    
    const token = localStorage.getItem('AUDIT_SECRET') || undefined;
    const { dayIndex, taskIndex, text } = gradingTask;
    const currentData = { ...weekHistory[currentWeek].data };
    const task = currentData.days[dayIndex].tasks[taskIndex];
    
    // Optimistic UI
    task.status = 'grading';
    task.reportedOutcome = text;
    
    const updatedHistory = [...weekHistory];
    updatedHistory[currentWeek].data = currentData;
    setWeekHistory(updatedHistory);
    setGradingTask(null);

    try {
      const gradeRes = await actions.gradeSprintTask(task.title, task.gradingCriteria, text, token);
      
      const newHistoryState = [...updatedHistory];
      const gradedTask = newHistoryState[currentWeek].data.days[dayIndex].tasks[taskIndex];
      
      if (gradeRes.result) {
        gradedTask.status = gradeRes.result.status || 'INCOMPLETE';
        gradedTask.aiCoaching = gradeRes.result.coaching || gradeRes.result.reasoning;
      } else {
        gradedTask.status = 'INCOMPLETE';
        gradedTask.aiCoaching = "AI failed to grade, marking incomplete for review.";
      }
      
      setWeekHistory(newHistoryState);
    } catch (err) {
      console.error(err);
      alert("Failed to grade task.");
      // Rollback
      const revertHistory = [...updatedHistory];
      revertHistory[currentWeek].data.days[dayIndex].tasks[taskIndex].status = 'pending';
      setWeekHistory(revertHistory);
    }
  };

  const resetProgress = () => {
    if (confirm("Are you sure you want to clear all sprint history?")) {
      setWeekHistory([]);
      localStorage.removeItem('co-validator-sprint-weeks');
    }
  };

  const isBlocked = (task: TaskInfo, allTasks: TaskInfo[]) => {
    if (!task.dependsOn || task.dependsOn.length === 0) return false;
    // It is blocked if ANY dependency is NOT PASS
    return task.dependsOn.some(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'PASS';
    });
  };

  if (weekHistory.length === 0 && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <div className="text-4xl">🏃</div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">7-Day Execution Sprint</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Ideas are worthless without momentum. Generate a ruthless, day-by-day sprint plan engineered specifically to test your core assumptions and exploit competitor weaknesses.
        </p>
        <button
          onClick={() => generatePlan(false)}
          className="px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg shadow-white/10"
        >
          Generate Zero-BS Plan
        </button>
      </div>
    );
  }

  if (loading && weekHistory.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-20 animate-fade-in">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-white font-bold animate-pulse text-sm">Drafting tactical tasks with AI grading rules...</p>
      </div>
    );
  }

  const activePlan = weekHistory[currentWeek]?.data;
  const allTasksInWeek = activePlan ? activePlan.days.flatMap(d => d.tasks) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 relative">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div className="flex gap-2 text-xs font-black uppercase tracking-widest text-gray-500 overflow-x-auto hide-scrollbar">
          {weekHistory.map((_, i) => (
            <button 
              key={i}
              onClick={() => setCurrentWeek(i)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${i === currentWeek ? 'bg-white text-black' : 'hover:bg-white/10 text-gray-400'}`}
            >
              Week {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => generatePlan(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
          >
            {loading ? 'Drafting...' : '+ Next Week'}
          </button>
          <button 
            onClick={resetProgress}
            className="text-[10px] text-red-500/50 hover:text-red-500 uppercase tracking-widest font-bold transition-all"
          >
            Reset All
          </button>
        </div>
      </div>

      {activePlan && (
        <div className="space-y-8 animate-slide-up">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Week {currentWeek + 1} Objective</span>
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{activePlan.focusOfTheWeek}</h2>
          </div>

          <div className="space-y-6">
            {activePlan.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                <div className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 backdrop-blur z-10">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-black border border-white/20">
                      {day.day}
                    </span>
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm">{day.theme}</h3>
                  </div>
                </div>
                
                <div className="divide-y divide-white/5">
                  {day.tasks.map((task, tIdx) => {
                    const blocked = isBlocked(task, allTasksInWeek);
                    
                    return (
                      <div key={tIdx} className={`p-6 transition-all relative ${blocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        
                        <div className="flex items-start gap-4">
                          {/* Left Status Column */}
                          <div className="pt-1 flex flex-col items-center gap-2">
                            <button
                              disabled={task.status === 'PASS' || blocked || task.status === 'grading'}
                              onClick={() => setGradingTask({ dayIndex: dIdx, taskIndex: tIdx, text: '' })}
                              className={`w-6 h-6 rounded border flex items-center justify-center transition-all 
                                ${task.status === 'PASS' ? 'bg-green-500 border-green-500' : 
                                  task.status === 'FAIL' ? 'bg-red-500/20 border-red-500 text-red-500' : 
                                  task.status === 'grading' ? 'bg-transparent border-yellow-500 animate-pulse' :
                                  'bg-transparent border-white/30 hover:border-blue-400'}`}
                            >
                              {task.status === 'PASS' && <span className="text-white font-black text-xs">✓</span>}
                              {task.status === 'FAIL' && <span className="text-xs font-black">×</span>}
                            </button>
                            
                            {task.priority === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="High Priority" />}
                            {task.priority === 'medium' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Medium Priority" />}
                          </div>

                          {/* Task Content List */}
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className={`text-lg font-bold ${task.status === 'PASS' ? 'line-through text-gray-500' : 'text-white'}`}>
                                {task.title}
                              </h4>
                              {task.estimatedMinutes && (
                                <span className="shrink-0 text-[9px] uppercase font-black tracking-widest text-gray-400 bg-white/5 px-2 py-1 rounded">
                                  ⏱ {task.estimatedMinutes}m
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{task.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-4">
                              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Goal</span>
                                <span className="text-xs text-blue-200 font-bold">{task.metric}</span>
                              </div>
                              
                              {task.dependsOn && task.dependsOn.length > 0 && (
                                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                                  <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Requires</span>
                                  <span className="text-xs text-purple-200 font-bold">{task.dependsOn.join(', ')}</span>
                                </div>
                              )}
                            </div>

                            {/* Grading Result Frame */}
                            {(task.status === 'PASS' || task.status === 'FAIL') && task.reportedOutcome && (
                              <div className={`mt-4 p-4 rounded-xl border ${task.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className="text-[10px] uppercase font-black text-gray-500 mb-2">Outcome Reported:</div>
                                <p className="text-xs text-gray-300 italic mb-3">"{task.reportedOutcome}"</p>
                                
                                <div className="flex gap-2 items-start mt-3 pt-3 border-t border-white/5">
                                  <span className="text-lg">🤖</span>
                                  <div>
                                    <span className={`text-[10px] uppercase font-black tracking-widest ${task.status === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>
                                      AI Grading: {task.status}
                                    </span>
                                    <p className={`text-xs mt-1 ${task.status === 'PASS' ? 'text-green-200/70' : 'text-red-200/70'}`}>
                                      {task.aiCoaching}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grading Input Modal Overlay */}
      {gradingTask && activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111] border border-white/20 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button onClick={() => setGradingTask(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-2xl font-black text-white tracking-tight">Report Outcome</h3>
            
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-1">Grading Criteria</span>
              <p className="text-xs text-gray-300">
                {activePlan.days[gradingTask.dayIndex].tasks[gradingTask.taskIndex].gradingCriteria}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">What actually happened?</label>
              <textarea 
                rows={4}
                autoFocus
                value={gradingTask.text}
                onChange={(e) => setGradingTask({ ...gradingTask, text: e.target.value })}
                placeholder="'Reached 5 people, 3 replied, 0 agreed to pay...'"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <button 
              onClick={submitTaskGrade}
              disabled={!gradingTask.text.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
            >
              Submit to Advisor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
