import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VoteChartProps {
  title: string;
  data: Record<string, number>;
}

export const VoteChart: React.FC<VoteChartProps> = ({ title, data }) => {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10

  const totalVotes = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (totalVotes === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        <div className="text-sm text-gray-500">No votes yet</div>
      </div>
    );
  }

  const colors = ['#A8FF60', '#965FD4', '#7E1012', '#646464', '#888888'];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <div className="text-sm text-gray-400 mb-2">Total votes: {totalVotes}</div>

      {/* Top result */}
      {chartData.length > 0 && (
        <div className="mb-4 p-4 bg-eva-secondary/10 border border-eva-secondary/30 rounded-lg">
          <div className="text-sm text-gray-400">Most voted:</div>
          <div className="text-2xl font-bold text-eva-secondary">
            {chartData[0].name}
          </div>
          <div className="text-sm text-gray-400">
            {chartData[0].value} votes ({((chartData[0].value / totalVotes) * 100).toFixed(1)}%)
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="name"
            stroke="#666"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#666" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

