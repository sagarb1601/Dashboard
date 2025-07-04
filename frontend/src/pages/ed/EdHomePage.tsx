import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Badge, Avatar, Typography, Space, Divider, Button, Dropdown, Menu, Select, Table, Spin, Alert, Tooltip } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  FileTextOutlined, 
  DollarOutlined, 
  CreditCardOutlined, 
  CalendarOutlined,
  TeamOutlined,
  ProjectOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LogoutOutlined,
  KeyOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { Moment } from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import './EdHomePage.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAntDesignDropdownFix } from '../../utils/resizeObserverFix';

const { Title, Text } = Typography;

interface BusinessData {
  totalClients: number;
  businessEntities: number;
  purchaseOrders: number;
  totalOrderValue: number;
  invoicesValue: number;
  paymentsReceived: number;
}

interface BudgetData {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
}

interface CalendarEvent {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  event_type: string;
}

// Budget and Expenditure interfaces
interface Project {
  project_id: number;
  project_name: string;
}

interface BudgetField {
  field_id: number;
  field_name: string;
  total_grant_received?: number;
  latest_grant_received?: number;
  grant_received?: number;
}

interface BudgetEntry {
  field_id: number;
  year_number: number;
  amount: number;
}

interface Expenditure {
  field_id: number;
  expenditure_date: string;
  amount_spent: number;
}

interface ProjectsInfo {
  total_projects: number;
  total_publications: number;
  total_patents: number;
  total_proposals: number;
}

interface FinanceInfo {
  total_projects: number;
  total_value: number;
  completed_projects: number;
  ongoing_projects: number;
}

// Weekly Grid Calendar Component
const WeeklyGridCalendar: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM (business hours)
  const days = Array.from({ length: 7 }, (_, i) => 
    selectedDate.startOf('week').add(i, 'day')
  );

  console.log('WeeklyGridCalendar events:', events);
  console.log('WeeklyGridCalendar selectedDate:', selectedDate.format('YYYY-MM-DD'));

  // Get events for the week
  const weekEvents = events.filter(event => {
    const eventStart = dayjs(event.start_time);
    const eventEnd = dayjs(event.end_time);
    const weekStart = selectedDate.startOf('week');
    const weekEnd = selectedDate.endOf('week');
    
    // Check if event spans across any day in the week
    const isInWeek = eventStart.isSameOrBefore(weekEnd, 'day') && 
                    eventEnd.isSameOrAfter(weekStart, 'day');
    
    // Check if event has any overlap with business hours (6 AM to 10 PM)
    const startHour = eventStart.hour() + eventStart.minute() / 60;
    const endHour = eventEnd.hour() + eventEnd.minute() / 60;
    const hasBusinessHourOverlap = (startHour < 22 && endHour > 6);
    
    return isInWeek && hasBusinessHourOverlap;
  });

  // Group events by day and handle overlapping events within each day
  const getDayEvents = (dayIndex: number) => {
    const dayStart = days[dayIndex].startOf('day');
    const dayEnd = days[dayIndex].endOf('day');
    
    const dayEvents = weekEvents.filter(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      return eventStart.isSameOrBefore(dayEnd, 'day') && 
             eventEnd.isSameOrAfter(dayStart, 'day');
    });

    // Sort events by start time
    const sortedEvents = dayEvents.sort((a, b) => 
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    );
    
    const groups: CalendarEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      
      let addedToGroup = false;
      
      for (const group of groups) {
        const groupHasOverlap = group.some(groupEvent => {
          const groupEventStart = dayjs(groupEvent.start_time);
          const groupEventEnd = dayjs(groupEvent.end_time);
          
          // Check if events overlap
          return (eventStart.isBefore(groupEventEnd) && eventEnd.isAfter(groupEventStart));
        });
        
        if (groupHasOverlap) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([event]);
      }
    });
    
    return groups;
  };

  const getEventPosition = (event: CalendarEvent, dayIndex: number, groupIndex: number, groupSize: number) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    const startHour = startTime.hour() + startTime.minute() / 60;
    const endHour = endTime.hour() + endTime.minute() / 60;
    
    // Ensure events are within business hours (6 AM to 10 PM)
    const adjustedStartHour = Math.max(6, Math.min(22, startHour));
    const adjustedEndHour = Math.max(adjustedStartHour + 0.5, Math.min(22, endHour));
    const duration = adjustedEndHour - adjustedStartHour;
    
    // Calculate position within the 17-hour timeline (6 AM to 10 PM)
    const top = ((adjustedStartHour - 6) / 17) * 100;
    const height = (duration / 17) * 100;
    
    // Calculate horizontal position for the day
    const dayLeft = (dayIndex / 7) * 100;
    const dayWidth = (1 / 7) * 100;
    
    // Calculate position within the day for overlapping events
    const eventLeft = dayLeft + (groupIndex / groupSize) * dayWidth;
    const eventWidth = (1 / groupSize) * dayWidth - 2; // Leave 2px gap between events
    
    // Ensure the event is within the timeline bounds
    const constrainedTop = Math.max(0, Math.min(100 - height, top));
    
    return { 
      top: `${constrainedTop}%`, 
      height: `${height}%`, 
      left: `${eventLeft}%`, 
      width: `${eventWidth}%` 
    };
  };

  const eventTypeColors: Record<string, string> = {
    'meeting': 'blue',
    'event': 'purple',
    'training': 'green',
    'other': 'orange',
    'default': 'purple'
  };

  console.log('Filtered events for week:', weekEvents);

  return (
    <div className="weekly-grid-calendar" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="calendar-header">
        <h4 style={{ margin: 0 }}>
          {selectedDate.startOf('week').format('MMM D')} - {selectedDate.endOf('week').format('MMM D, YYYY')}
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="Previous Week">
            <Button 
              size="small"
              onClick={() => setSelectedDate(selectedDate.subtract(1, 'week'))}
            >
              ‹
            </Button>
          </Tooltip>
          <Tooltip title="Next Week">
            <Button 
              size="small"
              onClick={() => setSelectedDate(selectedDate.add(1, 'week'))}
            >
            ›
            </Button>
          </Tooltip>
        </div>
      </div>
      
      {/* Week Grid */}
      <div className="calendar-grid">
        {/* Time Labels */}
        <div className="time-labels">
          <div className="time-header"></div>
          {hours.map(hour => (
            <div key={hour} className="time-label">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>
        
        {/* Days Headers and Events */}
        <div className="days-container">
          {/* Days Headers */}
          <div className="days-header">
            {days.map((day, index) => (
              <div 
                key={index}
                className={`day-header ${day.isSame(dayjs(), 'day') ? 'today' : ''}`}
              >
                <div>{day.format('ddd')}</div>
                <div>{day.format('D')}</div>
              </div>
            ))}
          </div>
          
          {/* Events Area */}
          <div className="events-area">
            {/* Day Grid Lines */}
            {days.map((_, index) => (
              <div key={index} className="day-grid-line" style={{ left: `${(index / 7) * 100}%` }} />
            ))}
            
            {/* Events */}
            {days.map((day, dayIndex) => 
              getDayEvents(dayIndex).map((group, groupIndex) => 
                group.map((event, eventIndex) => {
                  const position = getEventPosition(event, dayIndex, eventIndex, group.length);
                  return (
                    <div
                      key={`${event.id}-${dayIndex}-${eventIndex}`}
                      className="calendar-event"
                      style={{
                        left: position.left,
                        top: position.top,
                        height: position.height,
                        width: position.width,
                        backgroundColor: eventTypeColors[event.event_type] || eventTypeColors.default
                      }}
                      title={`${event.title}
Event Type: ${event.event_type}
Start: ${dayjs(event.start_time).format('MMM D, YYYY h:mm A')}
End: ${dayjs(event.end_time).format('MMM D, YYYY h:mm A')}
Duration: ${dayjs(event.end_time).diff(dayjs(event.start_time), 'hour', true).toFixed(1)} hours`}
                    >
                      <div className="event-title">{event.title}</div>
                      <div className="event-time">
                        {dayjs(event.start_time).format('h:mm A')}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ 
        padding: '12px 16px',
        backgroundColor: '#fafafa',
        borderTop: '1px solid #d9d9d9',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px'
      }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'blue', borderRadius: '3px' }}></div>
            <span style={{ fontWeight: '500' }}>Meeting</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'purple', borderRadius: '3px' }}></div>
            <span style={{ fontWeight: '500' }}>Event</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'green', borderRadius: '3px' }}></div>
            <span style={{ fontWeight: '500' }}>Training</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'orange', borderRadius: '3px' }}></div>
            <span style={{ fontWeight: '500' }}>Other</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EdHomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData>({
    totalClients: 0,
    businessEntities: 0,
    purchaseOrders: 0,
    totalOrderValue: 0,
    invoicesValue: 0,
    paymentsReceived: 0
  });
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 0,
    spentAmount: 0,
    remainingBudget: 0
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [projectsInfo, setProjectsInfo] = useState<ProjectsInfo>({
    total_projects: 0,
    total_publications: 0,
    total_patents: 0,
    total_proposals: 0
  });
  const [financeInfo, setFinanceInfo] = useState<FinanceInfo>({
    total_projects: 0,
    total_value: 0,
    completed_projects: 0,
    ongoing_projects: 0
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Use specific Ant Design Dropdown fix
  useAntDesignDropdownFix();

  // Navigation function for Project Info cards
  const navigateToProjectsDashboard = (tab: string) => {
    navigate(`/ed/projects-dashboard?tab=${tab}`);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    console.log('Logout clicked!');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePassword = () => {
    console.log('Change Password clicked!');
    navigate('/change-password');
  };

  const userMenu = (
    <Menu style={{
      position: 'absolute',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)'
    }}>
      <Menu.Item key="change-password" onClick={handleChangePassword}>
        🔑 Change Password
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        🚪 Logout
      </Menu.Item>
    </Menu>
  );

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch business data
      const businessResponse = await fetch('/api/business/dashboard/summary', {
        headers
      });
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        setBusinessData({
          totalClients: businessData.total_clients || 0,
          businessEntities: businessData.total_entities || 0,
          purchaseOrders: businessData.total_purchase_orders || 0,
          totalOrderValue: businessData.total_order_value || 0,
          invoicesValue: businessData.total_invoice_value || 0,
          paymentsReceived: businessData.total_payments_received || 0
        });
      }

      // Fetch budget data
      const budgetResponse = await fetch('/api/finance/dashboard/summary', {
        headers
      });
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json();
        console.log('Budget data received:', budgetData);
        setBudgetData({
          totalBudget: budgetData.total_value || 0,
          spentAmount: budgetData.current_year_spent || 0,
          remainingBudget: budgetData.current_year_pending || 0
        });
      } else {
        console.error('Failed to fetch budget data:', budgetResponse.status);
        const errorText = await budgetResponse.text();
        console.error('Budget error response:', errorText);
      }

      // Fetch calendar events
      console.log('Fetching calendar events...');
      const calendarResponse = await fetch('/api/calendar-events', {
        headers
      });
      console.log('Calendar response status:', calendarResponse.status);
      
      if (calendarResponse.ok) {
        const events = await calendarResponse.json();
        console.log('Calendar events fetched:', events);
        console.log('Number of events:', events.length);
        
        // Log each event details
        events.forEach((event: CalendarEvent, index: number) => {
          console.log(`Event ${index + 1}:`, {
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            end_time: event.end_time,
            event_type: event.event_type,
            startDate: dayjs(event.start_time).format('YYYY-MM-DD HH:mm'),
            endDate: dayjs(event.end_time).format('YYYY-MM-DD HH:mm')
          });
        });
        
        setCalendarEvents(events);
      } else {
        console.error('Failed to fetch calendar events:', calendarResponse.status);
        const errorText = await calendarResponse.text();
        console.error('Error response:', errorText);
      }

      // Fetch projects info
      const projectsInfoResponse = await fetch('/api/edoffice/dashboard/projects-info', {
        headers
      });
      if (projectsInfoResponse.ok) {
        const projectsInfoData = await projectsInfoResponse.json();
        setProjectsInfo(projectsInfoData);
      }

      // Fetch finance info using api utility (same as finance dashboard)
      try {
        const [financeRes, projectStatusRes] = await Promise.all([
          api.get('/finance/dashboard/summary'),
          api.get('/finance/dashboard/project-status')
        ]);
        
        const financeData = financeRes.data;
        const projectStatusData = projectStatusRes.data;
        
        console.log('Finance data received:', financeData);
        console.log('Project status data received:', projectStatusData);
        
        // Calculate completed and ongoing projects from project status data
        const completedProjects = projectStatusData.find((item: any) => 
          item.status?.toLowerCase() === 'completed'
        )?.count || 0;
        
        const ongoingProjects = projectStatusData.find((item: any) => 
          item.status?.toLowerCase() === 'ongoing' || 
          item.status?.toLowerCase() === 'active'
        )?.count || 0;
        
        // Map the finance data correctly
        setFinanceInfo({
          total_projects: financeData.total_projects || 0,
          total_value: financeData.total_value || 0,
          completed_projects: completedProjects,
          ongoing_projects: ongoingProjects
        });
      } catch (financeError) {
        console.error('Error fetching finance data:', financeError);
        // Don't fail the entire function if finance data fails
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Utility function to format numbers in crore representation
  const formatInCrores = (amount: number) => {
    if (isNaN(amount) || amount === null) {
      return '₹0';
    }
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 10000000) {
      const crores = (absAmount / 10000000).toFixed(2);
      const formatted = isNegative ? `-₹${crores} Cr` : `₹${crores} Cr`;
      return formatted;
    } else if (absAmount >= 100000) {
      const lakhs = (absAmount / 100000).toFixed(1);
      const formatted = isNegative ? `-₹${lakhs} L` : `₹${lakhs} L`;
      return formatted;
    } else if (absAmount >= 1000) {
      const thousands = (absAmount / 1000).toFixed(0);
      const formatted = isNegative ? `-₹${thousands} K` : `₹${thousands} K`;
      return formatted;
    } else {
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(absAmount);
      return isNegative ? `-₹${formatted}` : `₹${formatted}`;
    }
  };

  const formatCurrency = (amount: number) => {
    return formatInCrores(amount);
  };

  // Budget and Expenditure helper functions
  const getFinancialYearEnd = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month >= 4 ? year + 1 : year;
  };

  const getExpenditureYear = (exp: any) => getFinancialYearEnd(new Date(exp.expenditure_date));

  const getExpenditureYears = (): number[] => {
    if (!expenditures.length) return [];
    const years = new Set(expenditures.map(getExpenditureYear));
    return Array.from(years).sort();
  };

  const getBudgetYears = (): number[] => {
    if (!budgetEntries.length) return [];
    const years = new Set<number>();
    budgetEntries.forEach(entry => years.add(entry.year_number));
    return Array.from(years).sort();
  };

  const getBudgetAmount = (fieldId: number, yearNumber: number): number => {
    const budgetEntry = budgetEntries.find(entry =>
        entry.field_id === fieldId && entry.year_number === yearNumber
    );
    const amount = Number(budgetEntry?.amount) || 0;
    if (isNaN(amount)) {
        return 0;
    }
    return amount;
  };

  const getFieldTotalBudget = (fieldId: number): number => {
      const total = budgetEntries
          .filter(entry => entry.field_id === fieldId)
          .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getLatestGrantReceived = (fieldId: number): number => {
      const field = budgetFields.find(f => f.field_id === fieldId);
      const amount = Number(field?.total_grant_received || field?.latest_grant_received || field?.grant_received || 0);
      if (isNaN(amount)) {
          return 0;
      }
      return amount;
  };

  const getExpenditureAmount = (fieldId: number, year: number): number => {
      const yearExpenditures = expenditures.filter(exp => {
          const expYear = getExpenditureYear(exp);
          return exp.field_id === fieldId && expYear === year;
      });
      const total = yearExpenditures.reduce((sum, exp) => sum + (Number(exp.amount_spent) || 0), 0);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getTotalExpenditure = (fieldId: number): number => {
      const fieldExpenditures = expenditures.filter(exp => exp.field_id === fieldId);
      const total = fieldExpenditures.reduce((sum, exp) => sum + (Number(exp.amount_spent) || 0), 0);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getBalance = (fieldId: number): number => {
      const grantReceived = getLatestGrantReceived(fieldId);
      const totalExpenditure = getTotalExpenditure(fieldId);
      return grantReceived - totalExpenditure;
  };

  // Fetch projects for dropdown
  const fetchProjects = async () => {
    try {
      const response = await api.get('/finance/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Fetch budget fields for selected project
  const fetchBudgetFields = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/budget-fields-with-grants`);
      setBudgetFields(response.data);
    } catch (error) {
      console.error('Error fetching budget fields:', error);
    }
  };

  // Fetch budget entries for selected project
  const fetchBudgetEntries = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/budget-entries`);
      setBudgetEntries(response.data);
    } catch (error) {
      console.error('Error fetching budget entries:', error);
    }
  };

  // Fetch expenditures for selected project
  const fetchExpenditures = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/expenditures`);
      setExpenditures(response.data);
    } catch (error) {
      console.error('Error fetching expenditures:', error);
    }
  };

  // Handle project selection
  const handleProjectChange = async (value: number) => {
    if (!value) {
      setSelectedProject(null);
      setBudgetFields([]);
      setBudgetEntries([]);
      setExpenditures([]);
      return;
    }

    const project = projects.find(p => p.project_id === value);
    setSelectedProject(project?.project_id || null);

    try {
      await Promise.all([
        fetchBudgetFields(value),
        fetchBudgetEntries(value),
        fetchExpenditures(value)
      ]);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Table columns for budget and expenditure
  const budgetYears = getBudgetYears();
  const expenditureYears = getExpenditureYears();

  const columns = [
    {
      title: 'Particulars',
      dataIndex: 'field_name',
      key: 'field_name',
      fixed: 'left' as const,
      width: 200,
    },
    {
      title: 'Budget (₹)',
      children: [
        ...(budgetYears || []).map((year, idx) => ({
          title: `${idx + 1} Yr (₹)`,
          key: `year${year}_budget`,
          render: (_: any, record: any) => {
            const yearBudget = getBudgetAmount(record.field_id, year);
            return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(yearBudget)}</div>;
          },
          width: 140,
        })),
        {
          title: 'Total (₹)',
          key: 'total_budget',
          render: (_: any, record: any) => {
            const totalBudget = getFieldTotalBudget(record.field_id);
            return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(totalBudget)}</div>;
          },
          width: 160,
        },
      ],
    },
    {
      title: 'Grant Received (₹)',
      dataIndex: 'grant_received',
      key: 'grant_received',
      render: (text: any, record: any) => {
        const grantReceived = getLatestGrantReceived(record.field_id);
        return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(grantReceived)}</div>;
      },
      width: 160,
    },
    {
      title: 'Expenditure (₹)',
      children: [
        ...(expenditureYears || []).map(year => {
          const shortYear = year.toString().slice(-2);
          return {
            title: `31 Mar ${shortYear} (₹)`,
            dataIndex: `expenditure_${year}`,
            key: `expenditure_${year}`,
            render: (text: any, record: any) => {
              const expenditure = getExpenditureAmount(record.field_id, year);
              return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(expenditure)}</div>;
            },
            width: 160,
          };
        }),
        {
          title: 'Total (₹)',
          dataIndex: 'total_expenditure',
          key: 'total_expenditure',
          render: (text: any, record: any) => {
            const totalExpenditure = getTotalExpenditure(record.field_id);
            return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(totalExpenditure)}</div>;
          },
          width: 160,
        },
      ],
    },
    {
      title: 'Balance (₹)',
      key: 'balance',
      render: (text: any, record: any) => {
        const balance = getBalance(record.field_id);
        return <div style={{ whiteSpace: 'nowrap', color: balance < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(balance)}</div>;
      },
      width: 160,
    }
  ];

  const businessCards = [
    {
      title: 'Total Clients',
      value: businessData.totalClients,
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
      navigateTo: '/ed/business-dashboard?tab=clients'
    },
    {
      title: 'Business Entities',
      value: businessData.businessEntities,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      navigateTo: '/ed/business-dashboard?tab=entities'
    },
    {
      title: 'Invoices',
      value: businessData.purchaseOrders,
      color: '#faad14',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      navigateTo: '/ed/business-dashboard?tab=invoices'
    },
    {
      title: 'Total Order Value',
      value: formatCurrency(businessData.totalOrderValue),
      color: '#722ed1',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      navigateTo: '/ed/business-dashboard?tab=invoices'
    },
    {
      title: 'Invoices Value',
      value: formatCurrency(businessData.invoicesValue),
      color: '#eb2f96',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      navigateTo: '/ed/business-dashboard?tab=invoices'
    },
    {
      title: 'Payments Received (FY)',
      value: formatCurrency(businessData.paymentsReceived),
      color: '#13c2c2',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      navigateTo: '/ed/business-dashboard?tab=payments'
    }
  ];

  const budgetCards = [
    {
      title: 'Total Budget',
      value: formatCurrency(budgetData.totalBudget),
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)'
    },
    {
      title: 'Spent Amount',
      value: formatCurrency(budgetData.spentAmount),
      color: '#fa541c',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%,rgb(208, 49, 158) 100%)'
    },
    {
      title: 'Remaining Budget',
      value: formatCurrency(budgetData.remainingBudget),
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  return (
    <div className="ed-home-page">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '6px 12px', 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '12px',
        minHeight: '56px',
        overflow: 'visible'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/assets/cdac-logo.png" 
            alt="CDAC Logo" 
            style={{ height: '32px', width: 'auto' }}
          />
          <Button 
            type="text" 
            style={{ fontWeight: '500', color: '#1890ff' }}
            onClick={() => navigate('/ed')}
          >
            🏠 Home
          </Button>
          <Button 
            type="text" 
            style={{ fontWeight: '500' }}
            onClick={() => navigate('/ed/business-dashboard')}
          >
            💼 Business
          </Button>
          <Button 
            type="text" 
            style={{ fontWeight: '500' }}
            onClick={() => navigate('/ed/projects-dashboard')}
          >
            📋 Projects
          </Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button type={location.pathname === '/ed/finance-dashboard-new' ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/finance-dashboard-new')}>💰 Finance</Button>
          <Button type={location.pathname === '/ed/acts-view' ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/acts-view')}>🎓 ACTS</Button>
          <Button type={location.pathname === '/ed/mmg-view' ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/mmg-view')}>📦 MMG</Button>
          <Button type={location.pathname === '/ed/admin-view' ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/admin-view')}>⚙️ Admin</Button>
          <Button type={location.pathname === '/ed/hr-view' ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/hr-view')}>👥 HR</Button>
          <Button type={location.pathname.startsWith('/ed/calendar-view') ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/calendar-view?view=weekly')}>📅 Calendar</Button>
          <Button type={location.pathname === '/ed/travel-view' ? 'primary' : 'text'} style={{ fontWeight: '500' }} onClick={() => navigate('/ed/travel-view')}>✈️ Travel</Button>
          <Dropdown 
            overlay={userMenu} 
            placement="bottomLeft"
            trigger={['click']}
            getPopupContainer={() => document.body}
            overlayStyle={{ minWidth: 160, right: 0, left: 'auto' }}
          >
            <Button 
              type="text"
              style={{ fontSize: '18px', padding: '4px 8px', cursor: 'pointer', marginLeft: '4px' }}
            >
              👤
            </Button>
          </Dropdown>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Main Content */}
        <main className="ed-main-content" style={{ padding: '0 1rem' }}>
          {/* Business Cards Section */}
          <section className="business-section" style={{ marginBottom: '1rem' }}>
            <Row gutter={[12, 12]}>
              {/* Left Column - Projects Info, Finance Info, and Business Info */}
              <Col xs={24} lg={12}>
                <Row gutter={[12, 12]}>
                  {/* Projects Info */}
                  <Col xs={24}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        left: '12px', 
                        backgroundColor: 'white', 
                        padding: '0 8px', 
                        fontSize: '12px', 
                        color: '#666',
                        zIndex: 1
                      }}>
                        Projects Info
                      </div>
                      <Card 
                        style={{ 
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          paddingTop: '8px'
                        }}
                      >
                        <Row gutter={[12, 12]}>
                          <Col xs={24} sm={12} md={12}>
                            <Tooltip title="Click to view Projects">
                              <div 
                                style={{ 
                                  background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  border: 'none',
                                  height: '80px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                onClick={() => navigateToProjectsDashboard('projects')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ 
                                    width: '40px', 
                                    height: '40px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                  }}>
                                    <span style={{ fontSize: '18px', color: 'white' }}>📋</span>
                                  </div>
                                  <div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '14px', 
                                      fontWeight: '500',
                                      marginBottom: '4px'
                                    }}>
                                      Total Projects
                                    </div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '16px', 
                                      fontWeight: '600'
                                    }}>
                                      {projectsInfo.total_projects}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Tooltip>
                          </Col>
                          <Col xs={24} sm={12} md={12}>
                            <Tooltip title="Click to view Publications">
                              <div 
                                style={{ 
                                  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  border: 'none',
                                  height: '80px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                onClick={() => navigateToProjectsDashboard('publications')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ 
                                    width: '40px', 
                                    height: '40px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                  }}>
                                    <span style={{ fontSize: '18px', color: 'white' }}>📚</span>
                                  </div>
                                  <div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '14px', 
                                      fontWeight: '500',
                                      marginBottom: '4px'
                                    }}>
                                      Publications
                                    </div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '16px', 
                                      fontWeight: '600'
                                    }}>
                                      {projectsInfo.total_publications}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Tooltip>
                          </Col>
                          <Col xs={24} sm={12} md={12}>
                            <Tooltip title="Click to view Patents">
                              <div 
                                style={{ 
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  border: 'none',
                                  height: '80px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                onClick={() => navigateToProjectsDashboard('patents')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ 
                                    width: '40px', 
                                    height: '40px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                  }}>
                                    <span style={{ fontSize: '18px', color: 'white' }}>🔬</span>
                                  </div>
                                  <div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '14px', 
                                      fontWeight: '500',
                                      marginBottom: '4px'
                                    }}>
                                      Patents
                                    </div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '16px', 
                                      fontWeight: '600'
                                    }}>
                                      {projectsInfo.total_patents}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Tooltip>
                          </Col>
                          <Col xs={24} sm={12} md={12}>
                            <Tooltip title="Click to view Proposals">
                              <div 
                                style={{ 
                                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  border: 'none',
                                  height: '80px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                onClick={() => navigateToProjectsDashboard('proposals')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ 
                                    width: '40px', 
                                    height: '40px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                  }}>
                                    <span style={{ fontSize: '18px', color: 'white' }}>📝</span>
                                  </div>
                                  <div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '14px', 
                                      fontWeight: '500',
                                      marginBottom: '4px'
                                    }}>
                                      Proposals
                                    </div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '16px', 
                                      fontWeight: '600'
                                    }}>
                                      {projectsInfo.total_proposals}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Tooltip>
                          </Col>
                        </Row>
                      </Card>
                    </div>
                  </Col>
                  
                  {/* Finance Info */}
                  <Col xs={24}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        left: '12px', 
                        backgroundColor: 'white', 
                        padding: '0 8px', 
                        fontSize: '12px', 
                        color: '#666',
                        zIndex: 1
                      }}>
                        Finance Info
                      </div>
                      <Card 
                        style={{ 
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          paddingTop: '8px'
                        }}
                      >
                        <Row gutter={[12, 12]}>
                          {budgetCards.map((card, index) => (
                            <Col xs={24} sm={12} md={8} key={index}>
                              <Tooltip title="Click to view Finance Dashboard">
                                <div 
                                  style={{ 
                                    background: index === 0 ? 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)' : card.gradient,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    border: 'none',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onClick={() => navigate('/ed/finance-dashboard-new')}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                      width: '40px', 
                                      height: '40px',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                    }}>
                                      {/* Render icon directly here */}
                                      {index === 0 && <span style={{ fontSize: '18px', color: 'white' }}>💰</span>}
                                      {index === 1 && <span style={{ fontSize: '18px', color: 'white' }}>💸</span>}
                                      {index === 2 && <span style={{ fontSize: '18px', color: 'white' }}>💳</span>}
                                    </div>
                                    <div>
                                      <div style={{ 
                                        color: '#000', 
                                        fontSize: '14px', 
                                        fontWeight: '500',
                                        marginBottom: '4px'
                                      }}>
                                        {card.title}
                                      </div>
                                      <div style={{ 
                                        color: '#000', 
                                        fontSize: '16px', 
                                        fontWeight: '600'
                                      }}>
                                        {card.value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Tooltip>
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    </div>
                  </Col>
                  
                  {/* Business Info */}
                  <Col xs={24}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        left: '12px', 
                        backgroundColor: 'white', 
                        padding: '0 8px', 
                        fontSize: '12px', 
                        color: '#666',
                        zIndex: 1
                      }}>
                        Business Info
                      </div>
                      <Card 
                        style={{ 
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          paddingTop: '8px'
                        }}
                      >
                        <Row gutter={[12, 12]}>
                          {businessCards.map((card, index) => (
                            <Col xs={24} sm={12} md={8} key={index}>
                              <div 
                                style={{ 
                                  background: index === 0 ? 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)' : card.gradient,
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  border: 'none',
                                  height: '80px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onClick={() => navigate(card.navigateTo)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ 
                                    width: '40px', 
                                    height: '40px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                  }}>
                                    {/* Render icon directly here */}
                                    {index === 0 && <span style={{ fontSize: '18px', color: 'white' }}>👥</span>}
                                    {index === 1 && <span style={{ fontSize: '18px', color: 'white' }}>🏢</span>}
                                    {index === 2 && <span style={{ fontSize: '18px', color: 'white' }}>📄</span>}
                                    {index === 3 && <span style={{ fontSize: '18px', color: 'white' }}>💰</span>}
                                    {index === 4 && <span style={{ fontSize: '18px', color: 'white' }}>💳</span>}
                                    {index === 5 && <span style={{ fontSize: '18px', color: 'white' }}>📊</span>}
                                  </div>
                                  <div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '14px', 
                                      fontWeight: '500',
                                      marginBottom: '4px'
                                    }}>
                                      {card.title}
                                    </div>
                                    <div style={{ 
                                      color: '#000', 
                                      fontSize: '16px', 
                                      fontWeight: '600'
                                    }}>
                                      {card.value}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    </div>
                  </Col>
                </Row>
              </Col>
              
              {/* Right Column - Weekly Calendar */}
              <Col xs={24} lg={12}>
                <div 
                  style={{ 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    background: 'white',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => navigate('/ed/calendar-view?view=weekly')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <WeeklyGridCalendar events={calendarEvents} />
                </div>
              </Col>
            </Row>
          </section>

          <Divider style={{ margin: '1rem 0' }} />

          {/* Budget & Expenditure Summary */}
          <section className="budget-section">
            <Card 
              title="Budget and Expenditure Summary" 
              style={{ marginBottom: '24px' }}
              extra={
                <Text type="secondary">
                  Select a project to view detailed budget vs expenditure breakdown
                </Text>
              }
            >
              <div style={{ marginBottom: '16px' }}>
                <Select
                  placeholder="Select a project"
                  style={{ width: 400 }}
                  onChange={(value) => handleProjectChange(value)}
                  allowClear
                >
                  {(projects || []).map(project => (
                    <Select.Option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {selectedProject && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Selected Project: {projects.find(p => p.project_id === selectedProject)?.project_name}</Text>
                </div>
              )}

              {selectedProject && budgetFields.length > 0 && expenditures.length >= 0 && budgetEntries.length >= 0 ? (
                <div>
                  <Table
                    dataSource={budgetFields}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: 1500 }}
                    size="small"
                    summary={(pageData) => {
                      const totalYearBudgets = (budgetYears || []).map(year => 
                        pageData.reduce((sum, record) => sum + getBudgetAmount(record.field_id, year), 0)
                      );
                      const grandTotalBudget = pageData.reduce((sum, record) => sum + getFieldTotalBudget(record.field_id), 0);
                      const grandTotalGrant = pageData.reduce((sum, record) => sum + getLatestGrantReceived(record.field_id), 0);
                      const totalYearExpenditures = (expenditureYears || []).map(year => 
                        pageData.reduce((sum, record) => sum + getExpenditureAmount(record.field_id, year), 0)
                      );
                      const grandTotalExp = pageData.reduce((sum, record) => sum + getTotalExpenditure(record.field_id), 0);
                      const grandTotalBalance = pageData.reduce((sum, record) => sum + getBalance(record.field_id), 0);
                      
                      let currentIndex = 0;
                      
                      return (
                        <Table.Summary.Row style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={currentIndex++}>
                            <Text strong>Total</Text>
                          </Table.Summary.Cell>
                          
                          {totalYearBudgets.map((total) => (
                            <Table.Summary.Cell key={`budget-total-${currentIndex}`} index={currentIndex++}>
                              <Text strong style={{ color: total < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(total)}</Text>
                            </Table.Summary.Cell>
                          ))}
                          
                          <Table.Summary.Cell index={currentIndex++}>
                            <Text strong style={{ color: grandTotalBudget < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(grandTotalBudget)}</Text>
                          </Table.Summary.Cell>
                          
                          <Table.Summary.Cell index={currentIndex++}>
                            <Text strong style={{ color: grandTotalGrant < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(grandTotalGrant)}</Text>
                          </Table.Summary.Cell>

                          {totalYearExpenditures.map((total) => (
                            <Table.Summary.Cell key={`exp-total-${currentIndex}`} index={currentIndex++}>
                              <Text strong style={{ color: total < 0 ? '#ff4d4f' : 'inherit' }}>
                                {formatCurrency(total)}
                              </Text>
                            </Table.Summary.Cell>
                          ))}

                          <Table.Summary.Cell index={currentIndex++}>
                            <Text strong style={{ color: grandTotalExp < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(grandTotalExp)}</Text>
                          </Table.Summary.Cell>

                          <Table.Summary.Cell index={currentIndex++}>
                            <Text strong style={{ color: grandTotalBalance < 0 ? '#ff4d4f' : 'inherit' }}>
                              {formatCurrency(grandTotalBalance)}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </div>
              ) : selectedProject ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Text type="secondary">No budget and expenditure data found for this project</Text>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Text type="secondary">Please select a project to view budget and expenditure summary</Text>
                </div>
              )}
            </Card>
          </section>
        </main>

        {/* Footer */}
        <footer className="ed-footer" style={{
          width: '100%',
          background: '#f5f5f5',
          borderTop: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 0',
          fontSize: '13px',
          color: '#888',
          position: 'relative'
        }}>
          © 2025 CDAC. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default EdHomePage; 