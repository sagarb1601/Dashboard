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
  Chip,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DashboardLayout from '../../components/DashboardLayout';
import { getCurrentYear, getCurrentQuarter, getQuarterInfo } from '../../utils/dateUtils';
import { differenceInMonths, addMonths, startOfMonth, endOfMonth, format, parseISO, isWithinInterval, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addQuarters, addYears, isAfter, isBefore, getQuarter, getYear, setMonth, setDate, getMonth } from 'date-fns';

export {};

interface Project {
  project_id: number;
  project_name: string;
  start_date: string;
  end_date: string;
  duration_years: number;
  grant_received: number;
  reporting_type: 'FY' | 'PQ';
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

interface MissingQuarter {
  year: number;
  quarter: number;
  startDate: Date;
  endDate: Date;
}

interface ReportingPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
  type: 'quarterly' | 'yearly';
  financialYear: string;
  isProjectEnd: boolean;
}

type PeriodType = 'quarterly' | 'yearly' | 'FY';

interface FormData {
  year_number: number;
  period_number: number;
  expenditure_date: string;
  field_entries: {
    field_id: number;
    amount_spent: string;
    remarks: string;
  }[];
}

const BASE_URL = 'http://localhost:5000/api/finance';

// Helper function to get quarter months
const getQuarterMonths = (quarter: number): string => {
  const months = {
    1: 'Apr-Jun',
    2: 'Jul-Sep',
    3: 'Oct-Dec',
    4: 'Jan-Mar'
  };
  return months[quarter as keyof typeof months] || '';
};

const ExpenditurePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [viewMode, setViewMode] = useState<'quarter' | 'year'>('quarter');
  const [missingQuarters, setMissingQuarters] = useState<MissingQuarter[]>([]);
  const [manageProjectId, setManageProjectId] = useState<string | number>('');
  const [manageExpenditures, setManageExpenditures] = useState<Expenditure[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<FormData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [manageBudgetFields, setManageBudgetFields] = useState<BudgetField[]>([]);

  const [formData, setFormData] = useState<FormData>({
    year_number: new Date().getFullYear(),
    period_number: Math.ceil((new Date().getMonth() + 1) / 3),
    expenditure_date: format(new Date(), 'yyyy-MM-dd'),
    field_entries: []
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
      const response = await fetch(
        `${BASE_URL}/projects/${selectedProject.project_id}/expenditures`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch expenditures');
      }

      const data = await response.json();
      
      const convertedData = data.map((exp: any) => ({
        ...exp,
        period_type: exp.period_type === 'FY' ? 'yearly' : exp.period_type
      }));
      
      setExpenditures(convertedData);
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

  const fetchManageExpenditures = async (projectId: string | number) => {
    try {
      const response = await fetch(`${BASE_URL}/projects/${projectId}/expenditures`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setManageExpenditures(data);
      } else {
        setManageExpenditures([]);
      }
    } catch (error) {
      setManageExpenditures([]);
    }
  };

  const fetchManageBudgetFields = async (projectId: string | number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${projectId}/budget-fields-with-grants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setManageBudgetFields(data);
      } else {
        setManageBudgetFields([]);
      }
    } catch (error) {
      setManageBudgetFields([]);
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
        year_number: getCurrentYear(selectedProject.reporting_type, selectedProject.start_date),
        period_number: getCurrentQuarter(selectedProject.reporting_type, selectedProject.start_date),
        field_entries: budgetFields.map(field => ({
          field_id: field.field_id,
          amount_spent: '',
          remarks: ''
        }))
      }));
    }
  }, [selectedProject, budgetFields]);

  useEffect(() => {
    if (selectedProject && expenditures.length > 0) {
      const missing = detectMissingQuarters(selectedProject, expenditures);
      setMissingQuarters(missing);
    } else {
      setMissingQuarters([]);
    }
  }, [selectedProject, expenditures]);

  const handleProjectChange = (event: any) => {
    const project = projects.find(p => p.project_id === event.target.value);
    setSelectedProject(project || null);
  };

  const resetForm = () => {
    if (selectedProject && budgetFields.length > 0) {
      setFormData({
        year_number: getCurrentYear(selectedProject.reporting_type, selectedProject.start_date),
        period_number: getCurrentQuarter(selectedProject.reporting_type, selectedProject.start_date),
        expenditure_date: format(new Date(), 'yyyy-MM-dd'),
        field_entries: budgetFields.map(field => ({
          field_id: field.field_id,
          amount_spent: '',
          remarks: ''
        }))
      });
    }
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
    setDialogError(null);
    resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission from refreshing
    if (!selectedProject) return;

    try {
      setLoading(true);
      setDialogError(null);

      // Validate all entries
      const validEntries = formData.field_entries.filter(entry => {
        const amount = entry.amount_spent.trim();
        return amount !== '' && !isNaN(Number(amount)); // accept any number, including 0 and negatives
      });

      if (validEntries.length === 0) {
        setDialogError('Please enter at least one valid expenditure amount');
        return;
      }

      // Validate date
      if (!formData.expenditure_date) {
        setDialogError('Please select a valid expenditure date');
        return;
      }

      // Prepare the payload with proper number conversion
      const payload = validEntries.map(entry => {
        const amount = parseFloat(entry.amount_spent.trim());
        if (isNaN(amount)) {
          throw new Error(`Invalid amount for ${budgetFields.find(f => f.field_id === entry.field_id)?.field_name}`);
        }
        return {
          project_id: selectedProject.project_id,
          field_id: entry.field_id,
          amount_spent: amount,
          expenditure_date: formData.expenditure_date,
          remarks: entry.remarks?.trim() || ''
        };
      });

      console.log('Submitting payload:', payload);

      const response = await fetch(`${BASE_URL}/expenditures/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ expenditures: payload })
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Server error response:', responseData); // Debug log
        throw new Error(responseData.error || 'Failed to add expenditure');
      }

      // Only close dialog and show success if everything worked
      setSuccess('Expenditure added successfully');
      setOpenDialog(false);
      resetForm();
      await fetchExpenditures(); // Refresh the data
    } catch (error) {
      console.error('Detailed error in handleSubmit:', error); // Debug log
      setDialogError(error instanceof Error ? error.message : 'Failed to add expenditure. Please check all fields and try again.');
    } finally {
      setLoading(false); // Always reset loading state, regardless of success or failure
    }
  };

  const handleDelete = async (expenditureId: number) => {
    if (!selectedProject) return;

    if (!window.confirm('Are you sure you want to delete this expenditure entry?')) {
      return;
    }

    setLoading(true);
    try {
      const deleteResponse = await fetch(
        `${BASE_URL}/expenditures/${expenditureId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete expenditure');
      }

      setSuccess('Expenditure deleted successfully');
      fetchExpenditures();
    } catch (error) {
      console.error('Error deleting expenditure:', error);
      setError('Failed to delete expenditure');
    } finally {
      setLoading(false);
    }
  };

  const getQuarterlyExpenditures = () => {
    const quarters = expenditures.reduce((acc, exp) => {
      const key = `${getExpenditureYear(exp)}-${getExpenditureQuarter(exp)}`;
      if (!acc.has(key)) {
        acc.set(key, {
          year_number: getExpenditureYear(exp),
          period_number: getExpenditureQuarter(exp),
          entries: []
        });
      }
      acc.get(key)!.entries.push(exp);
      return acc;
    }, new Map());

    return Array.from(quarters.values())
      .sort((a, b) => {
        if (a.year_number !== b.year_number) return a.year_number - b.year_number;
        return a.period_number - b.period_number;
      });
  };

  const getYearlyExpenditures = () => {
    const years = expenditures.reduce((acc, exp) => {
      const key = getExpenditureYear(exp);
      if (!acc.has(key)) {
        acc.set(key, {
          year_number: getExpenditureYear(exp),
          entries: []
        });
      }
      acc.get(key)!.entries.push(exp);
      return acc;
    }, new Map());

    return Array.from(years.values())
      .sort((a, b) => a.year_number - b.year_number);
  };

  const getQuarterInfo = (periodNumber: number, yearNumber: number) => {
    const months = ['Apr-Jun', 'Jul-Sep', 'Oct-Dec', 'Jan-Mar'];
    return `FY ${yearNumber}-${(yearNumber + 1).toString().slice(-2)} (${months[periodNumber - 1]})`;
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

  const getBalance = (fieldId: number): number => {
    const totalGrant = getLatestGrantReceived(fieldId);
    const totalExpenditure = getTotalExpenditure(fieldId);
    return totalGrant - totalExpenditure;
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
    if (amount < 0) {
      return `(${Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })})`;
    }
    if (amount === 0) return '0';
    return amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
  };

  const formatGrantAmount = (amount: number) => {
    if (amount === 0) return '-';
    const roundedAmount = Math.round(amount);
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

  const getFilteredExpenditures = () => {
    return [...expenditures];
  };

  const getAvailableYears = () => {
    const years = new Set(expenditures.map(exp => getExpenditureYear(exp)));
    return Array.from(years).sort((a, b) => a - b);
  };

  const getAvailableQuarters = () => {
    const quarters = new Set(expenditures.map(exp => getExpenditureQuarter(exp)));
    return Array.from(quarters).sort((a, b) => a - b);
  };

  const detectMissingQuarters = (project: Project, expenditures: Expenditure[]) => {
    if (!project) return [];

    const startDate = new Date(project.start_date);
    const today = new Date();
    const missing: MissingQuarter[] = [];

    let currentDate = startDate;
    while (currentDate <= today) {
      const year = currentDate.getFullYear();
      const quarter = Math.floor((currentDate.getMonth() + 3) / 3);

      const hasData = expenditures.some(exp =>
        getExpenditureYear(exp) === year &&
        getExpenditureQuarter(exp) === quarter
      );

      if (!hasData) {
        const quarterStart = startOfMonth(currentDate);
        const quarterEnd = endOfMonth(addMonths(currentDate, 2));

        missing.push({
          year,
          quarter,
          startDate: quarterStart,
          endDate: quarterEnd
        });
      }

      currentDate = addMonths(currentDate, 3);
    }

    return missing;
  };

  const MissingQuartersWarning = () => {
    if (missingQuarters.length === 0) return null;

    return (
      <Alert 
        severity="warning" 
        sx={{ mb: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => {
              const earliest = missingQuarters[0];
              setFormData(prev => ({
                ...prev,
                year_number: earliest.year,
                period_number: earliest.quarter,
                expenditure_date: earliest.startDate.toISOString().split('T')[0]
              }));
              setOpenDialog(true);
            }}
          >
            Add Missing Data
          </Button>
        }
      >
        <Typography variant="subtitle2" gutterBottom>
          Missing expenditure data for {missingQuarters.length} quarter(s):
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {missingQuarters.map((q, index) => (
            <Chip
              key={`${q.year}-${q.quarter}`}
              label={`FY ${q.year}-${(q.year + 1).toString().slice(-2)} Q${q.quarter}`}
              size="small"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  year_number: q.year,
                  period_number: q.quarter,
                  expenditure_date: q.startDate.toISOString().split('T')[0]
                }));
                setOpenDialog(true);
              }}
            />
          ))}
        </Stack>
      </Alert>
    );
  };

  // Helper to get all years present in budget entries
  const getBudgetYears = (): number[] => {
    const years = new Set<number>();
    budgetEntries.forEach(entry => years.add(entry.year_number));
    return Array.from(years).sort((a, b) => a - b);
  };

  // Helper to get the financial year end (31-Mar-YYYY) for a given date
  const getFinancialYearEnd = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month >= 4 ? year + 1 : year;
  };

  // Update getExpenditureYear to use financial year end
  const getExpenditureYear = (exp: Expenditure) => getFinancialYearEnd(new Date(exp.expenditure_date));

  // Update getExpenditureYears to use financial year end
  const getExpenditureYears = (): number[] => {
    const years = new Set<number>();
    expenditures.forEach(exp => years.add(getExpenditureYear(exp)));
    return Array.from(years).sort((a, b) => a - b);
  };

  // Update getExpenditureAmount to use financial year end
  const getExpenditureAmount = (fieldId: number, year: number, quarter?: number) => {
    if (quarter) {
      return expenditures.filter(e => e.field_id === fieldId && getExpenditureYear(e) === year && getExpenditureQuarter(e) === quarter)
        .reduce((sum, e) => sum + Number(e.amount_spent), 0);
    } else {
      return expenditures.filter(e => e.field_id === fieldId && getExpenditureYear(e) === year)
        .reduce((sum, e) => sum + Number(e.amount_spent), 0);
    }
  };

  // Helper to get latest grant received for a field
  const getLatestGrantReceived = (fieldId: number) => {
    // Assuming budgetFields has total_grant_received updated
    const field = budgetFields.find(f => f.field_id === fieldId);
    return field ? Number(field.total_grant_received) : 0;
  };

  // Helper to get total expenditure for a field
  const getTotalExpenditure = (fieldId: number) => {
    return expenditures.filter(e => e.field_id === fieldId).reduce((sum, e) => sum + Number(e.amount_spent), 0);
  };

  // Helper to get grand total expenditure
  const getGrandTotalExpenditure = () => {
    return budgetFields.reduce((sum, field) => sum + getTotalExpenditure(field.field_id), 0);
  };

  // Helper to get grand total balance
  const getGrandTotalBalance = () => {
    const totalGrant = budgetFields.reduce((sum, field) => sum + getLatestGrantReceived(field.field_id), 0);
    const totalExpenditure = budgetFields.reduce((sum, field) => sum + getTotalExpenditure(field.field_id), 0);
    return totalGrant - totalExpenditure;
  };

  // Helper to get totals for each year
  const getYearTotalBudget = (year: number): number => {
    return budgetFields.reduce((sum, field) => sum + getBudgetAmount(field.field_id, year), 0);
  };
  const getYearTotalExpenditure = (year: number): number => {
    return budgetFields.reduce((sum, field) => sum + getExpenditureAmount(field.field_id, year), 0);
  };

  // Helper to get grand totals
  const getGrandTotalBudget = () => budgetFields.reduce((sum, field) => sum + getFieldTotalBudget(field.field_id), 0);

  // Add this helper function
  const getGrandTotalGrantReceived = () => {
    return budgetFields.reduce((sum, field) => sum + getLatestGrantReceived(field.field_id), 0);
  };

  // Helper to get the quarter for a given date
  const getExpenditureQuarter = (exp: Expenditure) => Math.floor((new Date(exp.expenditure_date).getMonth() + 3) / 3);

  const handleEditExpenditureGroup = async (date: string) => {
    if (!manageProject) return;
    // Ensure data is loaded
    if (manageBudgetFields.length === 0) await fetchManageBudgetFields(manageProject.project_id);
    if (manageExpenditures.length === 0) await fetchManageExpenditures(manageProject.project_id);
    // Get all expenditures for this project and date
    const entries = manageExpenditures.filter(e => e.expenditure_date === date);
    // Prepare form data for all budget fields
    const field_entries = manageBudgetFields.map(field => {
      const entry = entries.find(e => e.field_id === field.field_id);
      return {
        field_id: field.field_id,
        amount_spent: entry ? String(entry.amount_spent) : '',
        remarks: entry ? entry.remarks || '' : ''
      };
    });
    setEditFormData({
      year_number: 0, // not used
      period_number: 0, // not used
      expenditure_date: date,
      field_entries
    });
    setEditDate(date);
    setEditModalOpen(true);
    setEditError(null);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditDate(null);
    setEditFormData(null);
    setEditError(null);
  };

  const handleEditFormChange = (fieldId: number, key: 'amount_spent' | 'remarks', value: string) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      field_entries: editFormData.field_entries.map(entry =>
        entry.field_id === fieldId ? { ...entry, [key]: value } : entry
      )
    });
  };

  const handleEditDateChange = (date: string) => {
    if (!editFormData) return;
    setEditFormData({ ...editFormData, expenditure_date: date });
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageProject || !editFormData || !editDate) return;
    setEditLoading(true);
    setEditError(null);
    try {
      // Prepare payload: only include fields with a valid number
      const validEntries = editFormData.field_entries.filter(entry => entry.amount_spent !== '' && !isNaN(Number(entry.amount_spent)));
      if (validEntries.length === 0) {
        setEditError('Please enter at least one valid expenditure amount');
        setEditLoading(false);
        return;
      }

      // Convert the input date to local date first, then to UTC
      const localDate = new Date(editFormData.expenditure_date);
      const originalLocalDate = new Date(editDate);
      
      // Adjust for timezone offset to get the correct local date
      const timezoneOffset = localDate.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
      const utcDate = new Date(localDate.getTime() + timezoneOffset);
      const utcOriginalDate = new Date(originalLocalDate.getTime() + timezoneOffset);
      
      // Format dates as YYYY-MM-DD
      const formattedNewDate = utcDate.toISOString().split('T')[0];
      const formattedOriginalDate = utcOriginalDate.toISOString().split('T')[0];
      
      console.log('Date conversion:', {
        inputDate: editFormData.expenditure_date,
        localDate: localDate.toISOString(),
        utcDate: utcDate.toISOString(),
        formattedNewDate,
        originalInputDate: editDate,
        originalLocalDate: originalLocalDate.toISOString(),
        utcOriginalDate: utcOriginalDate.toISOString(),
        formattedOriginalDate
      });
      
      const payload = validEntries.map(entry => ({
        project_id: manageProject.project_id,
        field_id: entry.field_id,
        amount_spent: parseFloat(entry.amount_spent),
        expenditure_date: formattedNewDate,
        remarks: entry.remarks?.trim() || ''
      }));
      
      // Send to backend (bulk update: delete old and insert new for this date/project)
      const response = await fetch(`${BASE_URL}/expenditures/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          expenditures: payload,
          originalDate: formattedOriginalDate
        })
      });
      if (!response.ok) {
        const data = await response.json();
        setEditError(data.error || 'Failed to update expenditures');
        setEditLoading(false);
        return;
      }
      setEditModalOpen(false);
      setEditDate(null);
      setEditFormData(null);
      await fetchManageExpenditures(manageProject.project_id);
      await fetchManageBudgetFields(manageProject.project_id);
    } catch (error) {
      setEditError('Failed to update expenditures');
    } finally {
      setEditLoading(false);
    }
  };

  const handleManageProjectChange = async (event: any) => {
    const projectId = event.target.value;
    setManageProjectId(projectId);
    if (projectId) {
      await fetchManageExpenditures(projectId);
      await fetchManageBudgetFields(projectId);
    } else {
      setManageExpenditures([]);
      setManageBudgetFields([]);
    }
  };

  const manageProject = projects.find(p => p.project_id === manageProjectId);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4">Expenditure Tracking</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={viewMode === 'quarter'}
                      onChange={(e) => setViewMode(e.target.checked ? 'quarter' : 'year')}
                    />
                  }
                  label={`View by ${viewMode === 'quarter' ? 'Quarter' : 'Year'}`}
                />
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
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                disabled={!selectedProject}
              >
                Add Expenditure
              </Button>
            </Box>
          </Box>

          {selectedProject && (
            <Paper>
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6">Budget and Expenditure Summary</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Particulars</TableCell>
                      {/* Budget columns by year */}
                      {getBudgetYears().map((year, idx) => (
                        <TableCell key={`budget-${year}`} sx={{ fontWeight: 'bold' }}>{`${idx + 1} Yr`}</TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Budget</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Grant Received</TableCell>
                      {/* Expenditure columns by year, labeled as 31-Mar-YY */}
                      {getExpenditureYears().map(year => {
                        const shortYear = year.toString().slice(-2);
                        return (
                          <TableCell key={`exp-${year}`} sx={{ fontWeight: 'bold' }}>{`31-Mar-${shortYear}`}</TableCell>
                        );
                      })}
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Expenditure</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetFields.map(field => (
                      <TableRow key={field.field_id}>
                        <TableCell>{field.field_name}</TableCell>
                        {/* Budget by year */}
                        {getBudgetYears().map(year => (
                          <TableCell key={`budget-${field.field_id}-${year}`}>{formatAmount(getBudgetAmount(field.field_id, year))}</TableCell>
                        ))}
                        <TableCell>{formatAmount(getFieldTotalBudget(field.field_id))}</TableCell>
                        <TableCell>{formatAmount(getLatestGrantReceived(field.field_id))}</TableCell>
                        {/* Expenditure by year */}
                        {getExpenditureYears().map(year => {
                          const amount = getExpenditureAmount(field.field_id, year);
                          return (
                            <TableCell key={`exp-${field.field_id}-${year}`} sx={amount < 0 ? { backgroundColor: '#ffcccc' } : {}}>
                              {formatAmount(amount)}
                            </TableCell>
                          );
                        })}
                        <TableCell>{formatAmount(getTotalExpenditure(field.field_id))}</TableCell>
                        <TableCell sx={getBalance(field.field_id) < 0 ? { backgroundColor: '#ffcccc' } : {}}>
                          {formatAmount(getBalance(field.field_id))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                      <TableCell>Total</TableCell>
                      {getBudgetYears().map(year => (
                        <TableCell key={`total-budget-${year}`}>{formatAmount(getYearTotalBudget(year))}</TableCell>
                      ))}
                      <TableCell>{formatAmount(getGrandTotalBudget())}</TableCell>
                      <TableCell>{formatAmount(getGrandTotalGrantReceived())}</TableCell>
                      {getExpenditureYears().map(year => (
                        <TableCell key={`total-exp-${year}`}>{formatAmount(getYearTotalExpenditure(year))}</TableCell>
                      ))}
                      <TableCell>{formatAmount(getGrandTotalExpenditure())}</TableCell>
                      <TableCell sx={getGrandTotalBalance() < 0 ? { backgroundColor: '#ffcccc' } : {}}>
                        {formatAmount(getGrandTotalBalance())}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <Box sx={{ mt: 8, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, background: '#fafbfc' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Manage Expenditures</Typography>
            <FormControl sx={{ minWidth: 300, mb: 2 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={manageProjectId}
                onChange={handleManageProjectChange}
                label="Select Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {manageProject && (
              <Paper sx={{ mt: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Expenditure Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Group expenditures by date */}
                      {Array.from(new Set(manageExpenditures.map(e => e.expenditure_date))).sort().map(date => (
                        <TableRow key={date}>
                          <TableCell>{format(parseISO(date), 'dd-MM-yyyy')}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditExpenditureGroup(date)}
                              disabled={manageBudgetFields.length === 0 || manageExpenditures.length === 0}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>

          <Dialog 
            open={openDialog} 
            onClose={(event, reason) => {
              // Only allow closing via button or escape key
              if (reason === 'backdropClick') {
                return;
              }
              handleCloseDialog();
            }} 
            maxWidth="md" 
            fullWidth
          >
            <form onSubmit={handleSubmit}>
              <DialogTitle>
                Add Expenditure
                {selectedProject && (
                  <Typography variant="subtitle2" color="text.secondary">
                    {selectedProject.project_name} ({selectedProject.reporting_type === 'FY' ? 'Yearly' : 'Quarterly'} Reporting)
                  </Typography>
                )}
              </DialogTitle>
              <DialogContent>
                {dialogError && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 2 }} 
                    onClose={() => setDialogError(null)}
                    action={
                      <Button color="inherit" size="small" onClick={() => setDialogError(null)}>
                        Dismiss
                      </Button>
                    }
                  >
                    {dialogError}
                  </Alert>
                )}
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Expenditure Date"
                          value={new Date(formData.expenditure_date)}
                          onChange={(newValue) => {
                            if (newValue) {
                              const date = newValue.toISOString().split('T')[0];
                              setFormData(prev => ({
                                ...prev,
                                expenditure_date: date
                              }));
                            }
                          }}
                          sx={{ width: '100%' }}
                        />
                      </LocalizationProvider>
                    </Box>
                  </Stack>

                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Budget Field Expenditures</Typography>
                  <Grid container spacing={2}>
                    {budgetFields.map((field) => (
                      <Grid item xs={12} key={field.field_id}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <TextField
                            fullWidth
                            label={field.field_name}
                            type="number"
                            value={formData.field_entries.find(entry => entry.field_id === field.field_id)?.amount_spent || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || !isNaN(Number(value))) {
                                setFormData(prev => ({
                                  ...prev,
                                  field_entries: prev.field_entries.map(entry => 
                                    entry.field_id === field.field_id 
                                      ? { ...entry, amount_spent: value }
                                      : entry
                                  )
                                }));
                              }
                            }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                            helperText={`Budget: ${formatAmount(getFieldTotalBudget(field.field_id))}`}
                          />
                          <TextField
                            fullWidth
                            label="Remarks"
                            value={formData.field_entries.find(entry => entry.field_id === field.field_id)?.remarks || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                field_entries: prev.field_entries.map(entry => 
                                  entry.field_id === field.field_id 
                                    ? { ...entry, remarks: e.target.value }
                                    : entry
                                )
                              }));
                            }}
                            multiline
                            rows={1}
                            size="small"
                          />
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          <Dialog open={editModalOpen} onClose={handleEditModalClose} maxWidth="md" fullWidth>
            <form onSubmit={handleEditFormSubmit}>
              <DialogTitle>Edit Expenditures for {editDate ? format(parseISO(editDate), 'dd-MM-yyyy') : ''}</DialogTitle>
              <DialogContent>
                {editError && (
                  <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>
                )}
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Box>
                    <TextField
                      label="Expenditure Date"
                      type="date"
                      value={editFormData?.expenditure_date ? format(parseISO(editFormData.expenditure_date), 'yyyy-MM-dd') : ''}
                      onChange={e => handleEditDateChange(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 200 }}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Budget Field Expenditures</Typography>
                  <Grid container spacing={2}>
                    {manageBudgetFields.map(field => {
                      const entry = editFormData?.field_entries.find(e => e.field_id === field.field_id);
                      return (
                        <Grid item xs={12} key={field.field_id}>
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            <TextField
                              fullWidth
                              label={field.field_name}
                              type="number"
                              value={entry?.amount_spent || ''}
                              onChange={e => handleEditFormChange(field.field_id, 'amount_spent', e.target.value)}
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                            <TextField
                              fullWidth
                              label="Remarks"
                              value={entry?.remarks || ''}
                              onChange={e => handleEditFormChange(field.field_id, 'remarks', e.target.value)}
                              multiline
                              rows={1}
                              size="small"
                            />
                          </Stack>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleEditModalClose} disabled={editLoading}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={editLoading} startIcon={editLoading ? <CircularProgress size={20} /> : null}>
                  {editLoading ? 'Saving...' : 'Save'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default ExpenditurePage; 