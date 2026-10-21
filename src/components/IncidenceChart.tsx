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

  const COLORS = [1, 2, 3, 4, 5].map(index => `var(--athena-chart-${index})`);

  return (
    <>
    <div className="min-w-0 w-full h-[300px] bg-slate-900/40 p-4 rounded-3xl border border-white/5 shadow-xl">
      <div className="mb-4 flex items-center justify-between px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Incidência por Tema</span>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--athena-chart-grid)" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--athena-chart-text)', fontSize: 9, fontWeight: 'bold' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--athena-chart-text)', fontSize: 9, fontWeight: 'bold' }}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
            contentStyle={{ 
              backgroundColor: 'var(--athena-surface)',
              border: '1px solid var(--athena-border)',
              borderRadius: '12px',
              fontSize: '10px',
              color: 'var(--athena-text)'
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
    <details className="athena-chart-data">
      <summary>Dados do gráfico por tema</summary>
      <table>
        <caption>Valores apresentados no gráfico</caption>
        <thead><tr><th scope="col">Tema</th><th scope="col">Incidência</th></tr></thead>
        <tbody>{data.slice(0, 8).map((item, index) => <tr key={index}><th scope="row">{item.topic}</th><td>{item.incidence}%</td></tr>)}</tbody>
      </table>
    </details>
    </>
  );
}
