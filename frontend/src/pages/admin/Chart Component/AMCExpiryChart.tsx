import React, { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { format, addDays, parseISO, startOfDay } from 'date-fns';

interface AMCContract {
  amccontract_id: number;
  equipment_id: number;
  equipment_name: string;
  amcprovider_id: number;
  amcprovider_name: string;
  start_date: string;
  end_date: string;
  amc_value: string;
  remarks: string;
  created_at: string;
}

interface MatrixRow {
  equipment: string;
  [date: string]: string | number;
}

const AMCExpiryChart = () => {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);

  const today = startOfDay(new Date());
  const next7Days = Array.from({ length: 7 }, (_, i) =>
    format(addDays(today, i), 'yyyy-MM-dd')
  );

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/amc/contracts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setContracts(data);
      } catch (error) {
        console.error('Failed to fetch AMC contracts:', error);
      }
    };

    fetchContracts();
  }, []);

  useEffect(() => {
    const uniqueEquipment = Array.from(
      new Set(contracts.map(c => c.equipment_name))
    );

    const data: MatrixRow[] = uniqueEquipment.map(name => {
      const row: MatrixRow = { equipment: name };
      next7Days.forEach(date => {
        row[date] = 0;
      });
      return row;
    });

    contracts.forEach(contract => {
      const end = format(parseISO(contract.end_date), 'yyyy-MM-dd');
      if (next7Days.includes(end)) {
        const row = data.find(d => d.equipment === contract.equipment_name);
        if (row) {
          row[end] = '✔️';
        }
      }
    });

    setMatrixData(data);
  }, [contracts]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2 }}>
      <h2>AMC Contracts Expiring Soon (Next 7 Days)</h2>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Equipment</TableCell>
              {next7Days.map(date => (
                <TableCell key={date}>{format(new Date(date), 'MMM dd')}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrixData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.equipment}</TableCell>
                {next7Days.map(date => (
                  <TableCell key={date} align="center">
                    {row[date] === '✔️' ? '✔️' : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default AMCExpiryChart;
