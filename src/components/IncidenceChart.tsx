import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface RaioXItem {
  subject: string;
  topic: string;
  incidence: number;
  level: string;
}

export function IncidenceChart({ data }: { data: RaioXItem[] }) {
  // Take top 8 for better visualization if there are many
  const chartData = data.slice(0, 8).map(item => ({
    name: item.topic.length > 15 ? item.topic.substring(0, 12) + '...' : item.topic,
    incidence: item.incidence,
    fullTopic: item.topic,
    subject: item.subject,
    level: item.level
  }));

  const COLORS = ['#D4AF37', '#E5C15E', '#C5A028', '#F1D279', '#B8860B'];

  return (
    <div className="w-full h-[300px] bg-slate-900/40 p-4 rounded-3xl border border-white/5 shadow-xl">
      <div className="mb-4 flex items-center justify-between px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Incidência por Tema</span>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid rgba(212, 175, 55, 0.2)', 
              borderRadius: '12px',
              fontSize: '10px',
              color: '#f8fafc'
            }}
          />
          <Bar dataKey="incidence" radius={[4, 4, 0, 0]} barSize={32}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
