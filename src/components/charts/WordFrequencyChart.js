import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const WordFrequencyChart = ({ data }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No word frequency data available</p>
      </div>
    );
  }

  // Koala brand colors
  const KOALA_GREEN = '#95C93D';

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
          <XAxis type="number" tick={{ fill: '#6B7280' }} />
          <YAxis 
            type="category" 
            dataKey="word" 
            width={80}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <Tooltip 
            formatter={(value) => [`${value} mentions`, 'Frequency']} 
            contentStyle={{ 
              borderColor: '#7EB4A3', 
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          <Bar 
            name="Word Frequency" 
            dataKey="count" 
            fill={KOALA_GREEN} 
            radius={[0, 4, 4, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WordFrequencyChart;
