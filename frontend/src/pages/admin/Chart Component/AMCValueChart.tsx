import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Paper } from '@mui/material';

interface AMCProvider {
  amcprovider_id: number;
  amcprovider_name: string;
  contact_person_name: string;
  contact_number: string;
  email: string;
  address: string;
  created_at: string;
}

interface AMCEntry {
  amccontract_id: number;
  equipment_id: number;
  amcprovider_id: number;
  amc_value: string;
  equipment_name: string;
  amcprovider_name: string;
}

interface ChartData {
  provider: string;
  [equipmentType: string]: string | number; // dynamic equipment names
}

const AMCValueChart = () => {
  const [providers, setProviders] = useState<AMCProvider[]>([]);
  const [amcData, setAmcData] = useState<AMCEntry[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/amc/providers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setProviders(data);
      } catch (error) {
        console.error('Failed to fetch AMC providers:', error);
      }
    };

    const fetchAMCValues = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/amc/contracts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setAmcData(data);
      } catch (error) {
        console.error('Failed to fetch AMC entries:', error);
      }
    };

    fetchProviders();
    fetchAMCValues();
  }, []);

  useEffect(() => {
    const groupedData: { [provider: string]: { [equipment: string]: number } } = {};

    amcData.forEach(entry => {
      const provider = entry.amcprovider_name;
      const equipment = entry.equipment_name;
      const value = parseFloat(entry.amc_value);

      if (!groupedData[provider]) {
        groupedData[provider] = {};
      }

      if (!groupedData[provider][equipment]) {
        groupedData[provider][equipment] = 0;
      }

      groupedData[provider][equipment] += value;
    });

    const formatted: ChartData[] = Object.entries(groupedData).map(([provider, equipmentMap]) => {
      return {
        provider,
        ...equipmentMap
      };
    });

    setChartData(formatted);
  }, [amcData]);

  // Get unique equipment types for dynamic Bar rendering
  const equipmentTypes = Array.from(
    new Set(amcData.map(entry => entry.equipment_name))
  );

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2, height: 500 }}>
      <h2>AMC Value per Provider (Equipment-wise Breakdown)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="provider" />
          <YAxis />
          <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
          <Legend />
          {equipmentTypes.map((type, index) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="a"
              fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a1c4fd', '#e07a5f'][index % 6]}
              name={type}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default AMCValueChart;
