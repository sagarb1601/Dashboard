import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DashboardLayout from '../../components/DashboardLayout';
import { getCurrentYear, getCurrentQuarter, getQuarterInfo } from '../../utils/dateUtils';

interface Project {
  project_id: number;
  project_name: string;
  start_date: string;
  duration_years: number;
  grant_received: number;
}

interface BudgetField {
  field_id: number;
  field_name: string;
  total_budget: number;
  total_grant_received: number;
}

interface ExpenditureEntry {
  field_id: number;
  amount_spent: string;
  remarks?: string;
}

interface Expenditure {
  expenditure_id: number;
  project_id: number;
  field_id: number;
  year_number: number;
  period_type: 'PQ' | 'FY';
  period_number: number;
  amount_spent: number;
  expenditure_date: string;
  remarks?: string;
}

interface ConsolidatedExpenditure {
  field_id: number;
  field_name: string;
  year_number: number;
  period_type: 'PQ' | 'FY';
  period_number: number;
  entries: Expenditure[];
  total_amount: number;
}

interface BudgetEntry {
  project_id: number;
  field_id: number;
  year_number: number;
  amount: number;
}

const ExpenditurePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [viewMode, setViewMode] = useState<'quarter' | 'year'>('quarter');
  const [showInLakhs, setShowInLakhs] = useState(false);

  const [formData, setFormData] = useState({
    year_number: 1,
    period_type: 'FY' as 'PQ' | 'FY',
    period_number: 1,
    expenditure_date: new Date().toISOString().split('T')[0],
    entries: [] as ExpenditureEntry[],
  });

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/finance/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  };

  const fetchProjectBudgetFields = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/budget-fields-with-grants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBudgetFields(data);
      }
    } catch (error) {
      console.error('Error fetching project budget fields:', error);
      setError('Failed to fetch project budget fields');
    }
  };

  const fetchExpenditures = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/expenditures`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenditures(data);
      }
    } catch (error) {
      console.error('Error fetching expenditures:', error);
      setError('Failed to fetch expenditures');
    }
  };

  const fetchProjectBudgetEntries = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/budget-entries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBudgetEntries(data);
      }
    } catch (error) {
      console.error('Error fetching project budget entries:', error);
      setError('Failed to fetch project budget entries');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectBudgetFields();
      fetchExpenditures();
      fetchProjectBudgetEntries();
    } else {
      setBudgetFields([]);
      setExpenditures([]);
      setBudgetEntries([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && budgetFields.length > 0) {
      setFormData(prev => ({
        ...prev,
        year_number: getCurrentYear(prev.period_type, selectedProject.start_date),
        period_number: getCurrentQuarter(prev.period_type, selectedProject.start_date),
        entries: budgetFields.map(field => ({
          field_id: field.field_id,
          amount_spent: '',
          remarks: ''
        }))
      }));
    }
  }, [selectedProject, budgetFields]);

  const handleProjectChange = (event: any) => {
    const project = projects.find(p => p.project_id === event.target.value);
    setSelectedProject(project || null);
  };

  const resetForm = () => {
    if (!selectedProject) return;
    
    setFormData({
      year_number: getCurrentYear('FY', selectedProject.start_date),
      period_type: 'FY',
      period_number: getCurrentQuarter('FY', selectedProject.start_date),
      expenditure_date: new Date().toISOString().split('T')[0],
      entries: budgetFields.map(field => ({
        field_id: field.field_id,
        amount_spent: '',
        remarks: ''
      }))
    });
  };

  const handleOpenDialog = () => {
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }
    if (budgetFields.length === 0) {
      setError('No budget fields are mapped to this project. Please map budget fields in the Budget Fields section first.');
      return;
    }
    resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setLoading(true);
    try {
      const expenditures = formData.entries
        .filter(entry => entry.amount_spent !== '') // Only submit entries with amounts
        .map(entry => ({
          project_id: selectedProject.project_id,
          field_id: entry.field_id,
          year_number: formData.year_number,
          period_type: formData.period_type,
          period_number: formData.period_number,
          amount_spent: Number(entry.amount_spent),
          expenditure_date: formData.expenditure_date,
          remarks: entry.remarks
        }));

      const response = await fetch('http://localhost:5000/api/finance/expenditures/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ expenditures }),
      });

      if (response.ok) {
        setSuccess('Expenditures added successfully');
        fetchExpenditures();
        handleCloseDialog();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add expenditures');
      }
    } catch (error) {
      console.error('Error saving expenditures:', error);
      setError('Failed to add expenditures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenditureId: number) => {
    if (!selectedProject) return;

    if (!window.confirm('Are you sure you want to delete this expenditure entry?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/finance/expenditures/${expenditureId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        setSuccess('Expenditure deleted successfully');
        fetchExpenditures();
      } else {
        setError('Failed to delete expenditure');
      }
    } catch (error) {
      console.error('Error deleting expenditure:', error);
      setError('Failed to delete expenditure');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodTypeChange = (newType: 'PQ' | 'FY') => {
    if (!selectedProject) return;

    setFormData({
      ...formData,
      period_type: newType,
      year_number: getCurrentYear(newType, selectedProject.start_date),
      period_number: getCurrentQuarter(newType, selectedProject.start_date),
    });
  };

  const getMaxQuarters = () => {
    if (!selectedProject || formData.period_type === 'FY') return 4;
    
    const totalMonths = selectedProject.duration_years * 12;
    return Math.ceil(totalMonths / 3);
  };

  const handleEntryChange = (fieldId: number, key: 'amount_spent' | 'remarks', value: string) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.field_id === fieldId ? { ...entry, [key]: value } : entry
      )
    }));
  };

  const getQuarterlyExpenditures = () => {
    const quarters = expenditures.reduce((acc, exp) => {
      const key = `${exp.year_number}-${exp.period_type}-${exp.period_number}`;
      if (!acc.has(key)) {
        acc.set(key, {
          year_number: exp.year_number,
          period_type: exp.period_type,
          period_number: exp.period_number,
          entries: []
        });
      }
      acc.get(key)!.entries.push(exp);
      return acc;
    }, new Map());

    return Array.from(quarters.values())
      .sort((a, b) => {
        if (a.year_number !== b.year_number) return a.year_number - b.year_number;
        if (a.period_type !== b.period_type) return a.period_type.localeCompare(b.period_type);
        return a.period_number - b.period_number;
      });
  };

  const getYearlyExpenditures = () => {
    const years = expenditures.reduce((acc, exp) => {
      const key = exp.year_number;
      if (!acc.has(key)) {
        acc.set(key, {
          year_number: exp.year_number,
          entries: []
        });
      }
      acc.get(key)!.entries.push(exp);
      return acc;
    }, new Map());

    return Array.from(years.values())
      .sort((a, b) => a.year_number - b.year_number);
  };

  const getBudgetAmount = (fieldId: number, yearNumber: number): number => {
    const entry = budgetEntries.find(e => e.field_id === fieldId && e.year_number === yearNumber);
    return entry ? Number(entry.amount) : 0;
  };

  const getFieldTotalBudget = (fieldId: number): number => {
    return budgetEntries
      .filter(e => e.field_id === fieldId)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
  };

  const getFieldBalance = (fieldId: number): string => {
    const budgetTotal = budgetEntries
      .filter(e => e.field_id === fieldId)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    
    const expenditureTotal = expenditures
      .filter(exp => exp.field_id === fieldId)
      .reduce((sum, exp) => sum + Number(exp.amount_spent), 0);
    
    const balance = budgetTotal - expenditureTotal;
    return balance !== 0 ? Number(balance).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : '-';
  };

  const getTotalBalance = (): string => {
    const budgetTotal = budgetEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expenditureTotal = expenditures.reduce((sum, exp) => sum + Number(exp.amount_spent), 0);
    const balance = budgetTotal - expenditureTotal;
    return balance !== 0 ? Number(balance).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : '-';
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return '-';
    
    if (showInLakhs) {
      const inLakhs = amount / 100000;
      return inLakhs.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      }) + ' L';
    }
    return amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
  };

  const formatGrantAmount = (amount: number) => {
    if (amount === 0) return '-';
    
    // Convert to integer to avoid decimal issues
    const roundedAmount = Math.round(amount);
    
    if (showInLakhs) {
      const inLakhs = roundedAmount / 100000;
      return inLakhs.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      }) + ' L';
    }
    
    // Ensure the amount is treated as a number and use Indian locale
    return roundedAmount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      useGrouping: true,
      style: 'decimal'
    });
  };

  const getProjectYears = () => {
    if (!selectedProject) return [];
    return Array.from({ length: selectedProject.duration_years }, (_, i) => i + 1);
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">Expenditure Tracking</Typography>
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={selectedProject?.project_id || ''}
                  onChange={handleProjectChange}
                  label="Select Project"
                >
                  {projects.map((project) => (
                    <MenuItem key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>View Mode</InputLabel>
                <Select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'quarter' | 'year')}
                  label="View Mode"
                >
                  <MenuItem value="quarter">Quarter-wise</MenuItem>
                  <MenuItem value="year">Year-wise</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInLakhs}
                    onChange={(e) => setShowInLakhs(e.target.checked)}
                  />
                }
                label="Show in Lakhs"
              />
            </Stack>
          </Box>

          {selectedProject && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                >
                  Add Expenditures
                </Button>
              </Box>

              {/* Main expenditure table */}
              <Paper sx={{ mb: 3 }}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6">Budget and Expenditure Summary</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Particulars</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center" colSpan={selectedProject?.duration_years + 1}>Budget</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Grant Received</TableCell>
                        {viewMode === 'quarter' ? (
                          getQuarterlyExpenditures().map((quarter) => (
                            <TableCell key={`${quarter.year_number}-${quarter.period_number}`} sx={{ fontWeight: 'bold' }}>
                              {quarter.period_type === 'FY' 
                                ? `${getQuarterInfo(quarter.period_type, quarter.period_number)}`
                                : `Q${quarter.period_number}`
                              }
                            </TableCell>
                          ))
                        ) : (
                          getYearlyExpenditures().map((year) => (
                            <TableCell key={year.year_number} sx={{ fontWeight: 'bold' }}>
                              {`FY ${year.year_number}-${(year.year_number + 1).toString().slice(-2)}`}
                            </TableCell>
                          ))
                        )}
                        <TableCell sx={{ fontWeight: 'bold' }}>Total Expenditure</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell></TableCell>
                        {getProjectYears().map(yearNum => (
                          <TableCell key={yearNum} sx={{ fontWeight: 'bold' }}>
                            {`${yearNum}${getOrdinalSuffix(yearNum)} Yr`}
                          </TableCell>
                        ))}
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell></TableCell>
                        {viewMode === 'quarter' ? (
                          getQuarterlyExpenditures().map((quarter) => (
                            <TableCell key={`${quarter.year_number}-${quarter.period_number}`}></TableCell>
                          ))
                        ) : (
                          getYearlyExpenditures().map((year) => (
                            <TableCell key={year.year_number}></TableCell>
                          ))
                        )}
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgetFields.map(field => {
                        const fieldExpenditures = expenditures.filter(exp => exp.field_id === field.field_id);
                        const totalExpenditure = fieldExpenditures.reduce((sum, exp) => sum + Number(exp.amount_spent), 0);
                        
                        return (
                          <TableRow key={field.field_id}>
                            <TableCell>{field.field_name}</TableCell>
                            {getProjectYears().map(yearNum => (
                              <TableCell key={yearNum}>
                                {formatAmount(getBudgetAmount(field.field_id, yearNum))}
                              </TableCell>
                            ))}
                            <TableCell>{formatAmount(getFieldTotalBudget(field.field_id))}</TableCell>
                            <TableCell>
                              {field.total_grant_received > 0 
                                ? formatGrantAmount(field.total_grant_received)
                                : '-'
                              }
                            </TableCell>
                            {viewMode === 'quarter' ? (
                              getQuarterlyExpenditures().map((quarter) => {
                                const quarterAmount = quarter.entries
                                  .filter((entry: Expenditure) => entry.field_id === field.field_id)
                                  .reduce((sum: number, entry: Expenditure) => sum + Number(entry.amount_spent), 0);
                                return (
                                  <TableCell key={`${quarter.year_number}-${quarter.period_number}`}>
                                    {quarterAmount > 0 ? formatAmount(quarterAmount) : '-'}
                                  </TableCell>
                                );
                              })
                            ) : (
                              getYearlyExpenditures().map((year) => {
                                const yearAmount = year.entries
                                  .filter((entry: Expenditure) => entry.field_id === field.field_id)
                                  .reduce((sum: number, entry: Expenditure) => sum + Number(entry.amount_spent), 0);
                                return (
                                  <TableCell key={year.year_number}>
                                    {yearAmount > 0 ? formatAmount(yearAmount) : '-'}
                                  </TableCell>
                                );
                              })
                            )}
                            <TableCell>
                              {totalExpenditure > 0 ? formatAmount(totalExpenditure) : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        {getProjectYears().map(yearNum => (
                          <TableCell key={yearNum} sx={{ fontWeight: 'bold' }}>
                            {formatAmount(budgetEntries
                              .filter(e => e.year_number === yearNum)
                              .reduce((sum, entry) => sum + Number(entry.amount), 0))}
                          </TableCell>
                        ))}
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatAmount(budgetEntries.reduce((sum, entry) => sum + Number(entry.amount), 0))}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatGrantAmount(budgetFields.reduce((sum, field) => sum + Number(field.total_grant_received || 0), 0))}
                        </TableCell>
                        {viewMode === 'quarter' ? (
                          getQuarterlyExpenditures().map((quarter) => {
                            const quarterTotal = quarter.entries
                              .reduce((sum: number, entry: Expenditure) => sum + Number(entry.amount_spent), 0);
                            return (
                              <TableCell key={`${quarter.year_number}-${quarter.period_number}`} sx={{ fontWeight: 'bold' }}>
                                {quarterTotal > 0 ? formatAmount(quarterTotal) : '-'}
                              </TableCell>
                            );
                          })
                        ) : (
                          getYearlyExpenditures().map((year) => {
                            const yearTotal = year.entries
                              .reduce((sum: number, entry: Expenditure) => sum + Number(entry.amount_spent), 0);
                            return (
                              <TableCell key={year.year_number} sx={{ fontWeight: 'bold' }}>
                                {yearTotal > 0 ? formatAmount(yearTotal) : '-'}
                              </TableCell>
                            );
                          })
                        )}
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatAmount(expenditures.reduce((sum, exp) => sum + Number(exp.amount_spent), 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Detailed entries table */}
              <Paper sx={{ mt: 3 }}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6">Detailed Entries</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Quarter</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Budget Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenditures.map((entry: Expenditure) => {
                        const field = budgetFields.find(f => f.field_id === entry.field_id);
                        return (
                          <TableRow key={entry.expenditure_id}>
                            <TableCell>{new Date(entry.expenditure_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {entry.period_type === 'FY' 
                                ? `FY ${entry.year_number}-${(entry.year_number + 1).toString().slice(-2)} Q${entry.period_number}`
                                : `Year ${entry.year_number + 1} Q${entry.period_number}`
                              }
                            </TableCell>
                            <TableCell>{field?.field_name}</TableCell>
                            <TableCell>{formatAmount(Number(entry.amount_spent))}</TableCell>
                            <TableCell>{entry.remarks || '—'}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => handleDelete(entry.expenditure_id)}
                                size="small"
                                color="error"
                                title="Delete entry"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Stack>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              Add Expenditures
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                  <FormControl sx={{ minWidth: { xs: '100%', md: '45%' } }}>
                    <InputLabel>Period Type</InputLabel>
                    <Select
                      value={formData.period_type}
                      onChange={(e) => handlePeriodTypeChange(e.target.value as 'PQ' | 'FY')}
                      label="Period Type"
                    >
                      <MenuItem value="PQ">Project Quarter (from start date)</MenuItem>
                      <MenuItem value="FY">Financial Year (Apr-Mar)</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                    {formData.period_type === 'FY' ? (
                      <TextField
                        fullWidth
                        label="Financial Year"
                        type="number"
                        value={formData.year_number}
                        onChange={(e) => setFormData({ ...formData, year_number: Number(e.target.value) })}
                        required
                        helperText={`FY ${formData.year_number}-${(formData.year_number + 1).toString().slice(-2)}`}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label="Project Year"
                        type="number"
                        value={formData.year_number + 1}
                        onChange={(e) => setFormData({ ...formData, year_number: Number(e.target.value) - 1 })}
                        required
                        inputProps={{ min: 1, max: selectedProject?.duration_years }}
                        helperText={`Year ${formData.year_number + 1} of ${selectedProject?.duration_years}`}
                      />
                    )}
                  </Box>

                  <FormControl sx={{ width: { xs: '100%', md: '45%' } }}>
                    <InputLabel>Quarter</InputLabel>
                    <Select
                      value={formData.period_number}
                      onChange={(e) => setFormData({ ...formData, period_number: Number(e.target.value) })}
                      label="Quarter"
                    >
                      {Array.from({ length: getMaxQuarters() }, (_, i) => i + 1).map((quarter) => (
                        <MenuItem key={quarter} value={quarter}>
                          {getQuarterInfo(formData.period_type, quarter, selectedProject?.start_date)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Expenditure Date"
                        value={new Date(formData.expenditure_date)}
                        onChange={(newValue) => {
                          if (newValue) {
                            setFormData({
                              ...formData,
                              expenditure_date: newValue.toISOString().split('T')[0]
                            });
                          }
                        }}
                        sx={{ width: '100%' }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Stack>

                <Typography variant="h6" sx={{ mt: 2 }}>Budget Field Expenditures</Typography>

                <Stack spacing={2}>
                  {formData.entries.map((entry) => {
                    const field = budgetFields.find(f => f.field_id === entry.field_id);
                    if (!field) return null;

                    return (
                      <Box key={field.field_id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>{field.field_name}</Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <TextField
                            sx={{ minWidth: 300, flex: '1 1 45%' }}
                            label="Amount Spent"
                            type="number"
                            value={entry.amount_spent}
                            onChange={(e) => handleEntryChange(field.field_id, 'amount_spent', e.target.value)}
                            inputProps={{
                              step: "0.01",
                              min: "0"
                            }}
                          />
                          <TextField
                            sx={{ minWidth: 300, flex: '1 1 45%' }}
                            label="Remarks (Optional)"
                            value={entry.remarks || ''}
                            onChange={(e) => handleEntryChange(field.field_id, 'remarks', e.target.value)}
                            helperText="Add any additional notes if needed"
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Saving...' : 'Save All'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ExpenditurePage; 