'use client';

interface Task {
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}

interface Phase {
  name: string;
  duration: string;
  tasks: Task[];
}

interface RoadmapProps {
  roadmap: {
    phases: Phase[];
    criticalMilestone: string;
    resourceAdvice: string;
  };
}

export default function Roadmap({ roadmap }: RoadmapProps) {
  if (!roadmap || !roadmap.phases) return null;

  return (
    <div className="space-y-8 animate-fade-in print:break-inside-avoid">
      <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
        <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">VI</span>
        EXECUTION ROADMAP: 3-6 MONTHS
      </h3>

      <div className="glass-card !bg-purple-500/5 border-purple-500/20">
        <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4">The Critical Milestone</h4>
        <p className="text-xl font-black text-white italic">"{roadmap.criticalMilestone}"</p>
        <p className="text-sm text-gray-400 mt-2 font-medium">Advice: {roadmap.resourceAdvice}</p>
      </div>

      <div className="grid gap-6">
        {roadmap.phases.map((phase, idx) => (
          <div key={idx} className="glass-card border-l-4 border-purple-500/50 bg-white/5">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black text-white uppercase">{phase.name}</h4>
              <span className="text-xs font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full">{phase.duration}</span>
            </div>
            
            <div className="space-y-4">
              {phase.tasks.map((t, i) => (
                <div key={i} className="p-4 bg-black/40 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{t.task}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      t.priority === 'High' ? 'bg-red-500/20 text-red-400' : 
                      t.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 italic">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
