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

  const COLORS = [1, 2, 3, 4, 5].map(index => `var(--athena-chart-${index})`);

  return (
    <>
    <div className="min-w-0 w-full h-[300px] bg-slate-900/50 p-6 rounded-3xl border border-white/5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--athena-chart-grid)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--athena-chart-text)', fontSize: 10, fontWeight: 'bold' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--athena-chart-text)', fontSize: 10, fontWeight: 'bold' }}
            unit="%"
          />
          <Tooltip 
            cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
            contentStyle={{ 
              backgroundColor: 'var(--athena-surface)',
              border: '1px solid var(--athena-border)',
              borderRadius: '12px',
              fontSize: '11px',
              color: 'var(--athena-text)'
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
    <details className="athena-chart-data">
      <summary>Dados do gráfico de desempenho</summary>
      <table>
        <caption>Acertos por matéria</caption>
        <thead><tr><th scope="col">Matéria</th><th scope="col">Acertos</th><th scope="col">Questões</th></tr></thead>
        <tbody>{data.map((item, index) => <tr key={index}><th scope="row">{item.subjectName}</th><td>{item.correctAnswers}</td><td>{item.totalQuestions}</td></tr>)}</tbody>
      </table>
    </details>
    </>
  );
}
