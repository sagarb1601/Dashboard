import React, { useEffect, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { format, addDays, parseISO, startOfDay } from 'date-fns';

interface Vehicle {
  vehicle_id: number;
  registration_no: string;
  company_name: string;
  model: string;
}

interface Insurance {
  insurance_id: number;
  vehicle_id: number;
  insurance_end_date: string;
  registration_no: string;
}

interface MatrixRow {
  vehicle: string;
  [date: string]: string | number;
}

const InsuranceExpiryChart = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);

  const today = startOfDay(new Date());
  const next7Days = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/vehicles', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setVehicles(data);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };

    const fetchInsurances = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/vehicles/1/insurance', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setInsurances(data);
      } catch (error) {
        console.error('Failed to fetch insurances:', error);
      }
    };

    fetchVehicles();
    fetchInsurances();
  }, []);

  useEffect(() => {
    const data: MatrixRow[] = vehicles.map(vehicle => {
      const row: MatrixRow = { vehicle: vehicle.registration_no };
      next7Days.forEach(date => {
        row[date] = 0;
      });
      return row;
    });

    insurances.forEach(insurance => {
      const end = format(parseISO(insurance.insurance_end_date), 'yyyy-MM-dd');
      if (next7Days.includes(end)) {
        const row = data.find(d => d.vehicle === insurance.registration_no);
        if (row) {
          const currentValue = row[end];
          row[end] = typeof currentValue === 'number' ? currentValue + 1 : 1;
        }
      }
    });

    setMatrixData(data);
  }, [vehicles, insurances]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2 }}>
      <h2>Insurance Expiry per Vehicle (Next 7 Days)</h2>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle Registration No</TableCell>
              {next7Days.map(date => (
                <TableCell key={date}>{format(new Date(date), 'MMM dd')}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrixData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.vehicle}</TableCell>
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

export default InsuranceExpiryChart;
