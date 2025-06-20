import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Paper } from '@mui/material';

interface AMCEntry {
  amccontract_id: number;
  equipment_id: number;
  amcprovider_id: number;
  amc_value: string;
  equipment_name: string;
  amcprovider_name: string;
}

interface ChartData {
  equipment: string;
  value: number;
}

const AMCValueByEquipmentChart = () => {
  const [amcData, setAmcData] = useState<AMCEntry[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
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

    fetchAMCValues();
  }, []);

  useEffect(() => {
    const groupedData: { [equipment: string]: number } = {};

    amcData.forEach(entry => {
      const equipment = entry.equipment_name;
      const value = parseFloat(entry.amc_value);
      groupedData[equipment] = (groupedData[equipment] || 0) + value;
    });

    const formatted: ChartData[] = Object.entries(groupedData).map(([equipment, value]) => ({
      equipment,
      value,
    }));

    setChartData(formatted);
  }, [amcData]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2, height: 500 }}>
      <h2>AMC Value per Equipment Type</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="equipment" />
          <YAxis />
          <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" name="AMC Value" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default AMCValueByEquipmentChart;
