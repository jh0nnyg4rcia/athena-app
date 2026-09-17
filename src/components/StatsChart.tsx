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

interface StatItem {
  subjectName: string;
  correctAnswers: number;
  totalQuestions: number;
}

export function StatsChart({ data }: { data: StatItem[] }) {
  const chartData = data.map(item => ({
    name: item.subjectName.split(' ')[0],
    accuracy: item.totalQuestions > 0 ? (item.correctAnswers / item.totalQuestions) * 100 : 0,
    fullSubject: item.subjectName
  }));

  const COLORS = ['#D4AF37', '#E5C15E', '#C5A028', '#F1D279', '#B8860B'];

  return (
    <div className="w-full h-[300px] bg-slate-900/50 p-6 rounded-3xl border border-white/5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
            unit="%"
          />
          <Tooltip 
            cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid rgba(212, 175, 55, 0.2)', 
              borderRadius: '12px',
              fontSize: '11px',
              color: '#f8fafc'
            }}
          />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} barSize={40}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
