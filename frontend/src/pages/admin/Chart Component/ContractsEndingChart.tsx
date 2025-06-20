import React, { useEffect, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { format, addDays, isWithinInterval, parseISO, startOfDay } from 'date-fns';

interface Department {
  department_id: number;
  department_name: string;
}

interface Contract {
  contract_id: number;
  department_id: number;
  end_date: string;
  department_name: string;
  status: string;
}

interface MatrixRow {
  department: string;
  [date: string]: string | number;
}

const ContractsEndingChart = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);

  const today = startOfDay(new Date());
  const next7Days = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/departments', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setDepartments(data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };

    const fetchContracts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/contractors/mappings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setContracts(data);
      } catch (error) {
        console.error('Failed to fetch contract mappings:', error);
      }
    };

    fetchDepartments();
    fetchContracts();
  }, []);

  useEffect(() => {
    const data: MatrixRow[] = departments.map(dept => {
      const row: MatrixRow = { department: dept.department_name };
      next7Days.forEach(date => {
        row[date] = 0;
      });
      return row;
    });

    contracts.forEach(contract => {
      const end = format(parseISO(contract.end_date), 'yyyy-MM-dd');
      if (next7Days.includes(end)) {
        const row = data.find(d => d.department === contract.department_name);
        if (row) {
          const currentValue = row[end];
          row[end] = typeof currentValue === 'number' ? currentValue + 1 : 1;
        }
      }
    });

    setMatrixData(data);
  }, [departments, contracts]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2 }}>
      <h2>Contracts Ending in Next 7 Days</h2>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              {next7Days.map(date => (
                <TableCell key={date}>{format(new Date(date), 'MMM dd')}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrixData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.department}</TableCell>
                {next7Days.map(date => (
                  <TableCell key={date} align="center">
                    {row[date] && typeof row[date] === 'number' && row[date] > 0 ? '✔️' : ''}
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

export default ContractsEndingChart;
