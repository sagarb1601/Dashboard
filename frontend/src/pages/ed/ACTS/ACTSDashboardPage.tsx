// ACTS Dashboard Page Component
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Empty,
  Table,
  Select,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  AreaChart,
  Area,
} from 'recharts';

const { Title, Text } = Typography;

// Chart colors
const CHART_COLORS = [
  '#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96',
  '#13c2c2', '#faad14', '#a0d911', '#2f54eb', '#f5222d'
];

interface ACTSSummary {
  total_courses: number;
  total_students_enrolled: number;
  total_students_placed: number;
  total_revenue: number;
  overall_placement_rate: number;
}

interface EnrollmentByCourse {
  course_name: string;
  total_enrolled: number;
}

interface PlacementByCourse {
  course_name: string;
  total_enrolled: number;
  total_placed: number;
  placement_rate: number;
}

interface RevenueByCourse {
  course_name: string;
  total_revenue: number;
  year: number;
}

interface EnrollmentTrends {
  year: number;
  total_enrolled: number;
  total_placed: number;
  placement_rate: number;
}

interface RevenueTrends {
  year: number;
  total_revenue: number;
  avg_course_fee: number;
}

interface BatchPerformance {
  batch_name: string;
  batch_id: string;
  course_name: string;
  students_enrolled: number;
  students_placed: number;
  placement_rate: number;
  course_fee: number;
}

interface BatchSizeDistribution {
  batch_name: string;
  batch_size: number;
}

interface TopPerformingCourse {
  course_name: string;
  total_enrolled: number;
  total_placed: number;
  placement_rate: number;
  total_revenue: number;
}

interface EnrollmentOverTime {
  year: number;
  batch_type: string;
  total_enrolled: number;
  batch_count: number;
  time_label: string;
}

// New interfaces for donut charts
interface RevenueShareByCourse {
  course_name: string;
  total_revenue: number;
  percentage: number;
  formatted_revenue: string;
}

interface EnrollmentShareByCourse {
  course_name: string;
  total_enrolled: number;
  percentage: number;
}

const ACTSDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<ACTSSummary>({
    total_courses: 0,
    total_students_enrolled: 0,
    total_students_placed: 0,
    total_revenue: 0,
    overall_placement_rate: 0
  });
  const [enrollmentByCourse, setEnrollmentByCourse] = useState<EnrollmentByCourse[]>([]);
  const [placementByCourse, setPlacementByCourse] = useState<PlacementByCourse[]>([]);
  const [revenueByCourse, setRevenueByCourse] = useState<RevenueByCourse[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<EnrollmentTrends[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrends[]>([]);
  const [batchPerformance, setBatchPerformance] = useState<BatchPerformance[]>([]);
  const [batchSizeDistribution, setBatchSizeDistribution] = useState<BatchSizeDistribution[]>([]);
  const [topPerformingCourses, setTopPerformingCourses] = useState<TopPerformingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // New state variables for donut charts
  const [revenueShareByCourse, setRevenueShareByCourse] = useState<RevenueShareByCourse[]>([]);
  
  // Filter states for donut charts
  const [selectedBatchForRevenue, setSelectedBatchForRevenue] = useState<string | undefined>();

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();
  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<string>('all');
  const [filteredBatchPerformance, setFilteredBatchPerformance] = useState<BatchPerformance[]>([]);
  const [batchTypeDistribution, setBatchTypeDistribution] = useState<any[]>([]);
  const [batchPlacementRates, setBatchPlacementRates] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [filteredBatchPlacementRates, setFilteredBatchPlacementRates] = useState<any[]>([]);
  const [selectedCourseForComparison, setSelectedCourseForComparison] = useState<string | undefined>();
  const [courseBatchComparison, setCourseBatchComparison] = useState<BatchPerformance[]>([]);
  const [selectedBatchForFee, setSelectedBatchForFee] = useState<string | undefined>();
  const [filteredFeeCollection, setFilteredFeeCollection] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Enrollments over time states
  const [enrollmentsOverTime, setEnrollmentsOverTime] = useState<EnrollmentOverTime[]>([]);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<string | undefined>();
  const [selectedBatchTypeForEnrollment, setSelectedBatchTypeForEnrollment] = useState<string | undefined>();
  const [enrollmentChartType, setEnrollmentChartType] = useState<'line' | 'area'>('line');

  useEffect(() => {
    fetchACTSData();
  }, []);

  // Fetch enrollments over time data on initial load
  useEffect(() => {
    const fetchInitialEnrollmentsOverTime = async () => {
      try {
        console.log('Fetching initial enrollments over time data...');
        const response = await fetch('/api/acts/dashboard/enrollments-over-time', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Initial enrollments over time data:', data);
        setEnrollmentsOverTime(data);
      } catch (error) {
        console.error('Error fetching initial enrollments over time:', error);
        setEnrollmentsOverTime([]);
      }
    };

    fetchInitialEnrollmentsOverTime();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filteredBatches = [...batchPerformance];

    // Apply course filter
    if (selectedCourse) {
      filteredBatches = filteredBatches.filter(batch => batch.course_name === selectedCourse);
    }

    // Apply year filter
    if (selectedYear) {
      filteredBatches = filteredBatches.filter(batch => {
        const match = batch.batch_id.match(/(\d{4})/);
        return match && match[1] === selectedYear;
      });
    }

    // Apply view mode filter
    if (viewMode === 'course' && selectedCourse) {
      // Show only batches of the selected course
      filteredBatches = filteredBatches.filter(batch => batch.course_name === selectedCourse);
    } else if (viewMode === 'year' && selectedYear) {
      // Show only batches of the selected year
      filteredBatches = filteredBatches.filter(batch => {
        const match = batch.batch_id.match(/(\d{4})/);
        return match && match[1] === selectedYear;
      });
    }

    setFilteredBatchPerformance(filteredBatches);
  }, [batchPerformance, selectedCourse, selectedYear, viewMode, selectedBatches]);

  // Process batch placement rates (always show complete data, not filtered)
  useEffect(() => {
    if (batchPerformance.length > 0) {
      // Process batch placement rates from ALL batch data (not filtered)
      const batchPlacementChartData = batchPerformance
        .map(batch => {
          const year = batch.batch_id.match(/(\d{4})/)?.[1];
          const batchLabel = `${batch.course_name} (${batch.batch_id})`;
          
          return {
            batch_label: batchLabel,
            course_name: batch.course_name,
            batch_id: batch.batch_id,
            year: year,
            placement_rate: batch.students_enrolled > 0 ? 
              (batch.students_placed / batch.students_enrolled) * 100 : 0,
            students_enrolled: batch.students_enrolled,
            students_placed: batch.students_placed,
            // Add a display label for the x-axis
            display_label: `${batch.course_name}\n(${batch.batch_id})`
          };
        })
        .sort((a, b) => b.placement_rate - a.placement_rate); // Sort by placement rate descending

      console.log('Batch Placement Rates Data:', batchPlacementChartData);
      setBatchPlacementRates(batchPlacementChartData);
      setFilteredBatchPlacementRates(batchPlacementChartData);
    }
  }, [batchPerformance]);

  // Process batch type distribution (respect year filter)
  useEffect(() => {
    if (batchPerformance.length > 0) {
      // Filter batches based on selected year
      let filteredBatches = batchPerformance;
      if (selectedYear) {
        filteredBatches = batchPerformance.filter(batch => {
          const match = batch.batch_id.match(/(\d{4})/);
          return match && match[1] === selectedYear;
        });
      }

      // Process batch type distribution from filtered batch data
      const batchTypeData = filteredBatches.reduce((acc, batch) => {
        const year = batch.batch_id.match(/(\d{4})/)?.[1];
        const month = batch.batch_id.toLowerCase().includes('feb') ? 'February' : 
                     batch.batch_id.toLowerCase().includes('aug') ? 'August' : 'Other';
        
        const batchType = year ? `${month} ${year}` : month;
        
        if (!acc[batchType]) {
          acc[batchType] = 0;
        }
        acc[batchType] += batch.students_enrolled || 0;
        return acc;
      }, {} as { [key: string]: number });

      const batchTypeChartData = Object.entries(batchTypeData).map(([batch_type, total_enrolled]) => ({
        batch_type,
        total_enrolled
      }));

      // Sort batch type data chronologically
      batchTypeChartData.sort((a, b) => {
        const getYear = (batchType: string) => {
          const match = batchType.match(/(\d{4})/);
          return match ? parseInt(match[1]) : 0;
        };
        const getMonth = (batchType: string) => {
          const monthMap: { [key: string]: number } = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
          };
          const match = batchType.toLowerCase().match(/(january|february|march|april|may|june|july|august|september|october|november|december)/);
          return match ? monthMap[match[1]] : 0;
        };
        
        const yearA = getYear(a.batch_type);
        const yearB = getYear(b.batch_type);
        if (yearA !== yearB) return yearA - yearB;
        
        const monthA = getMonth(a.batch_type);
        const monthB = getMonth(b.batch_type);
        return monthA - monthB;
      });

      console.log('Batch Type Distribution Data (filtered by year):', batchTypeChartData);
      setBatchTypeDistribution(batchTypeChartData);
    }
  }, [batchPerformance, selectedYear]);

  // Process course batch comparison
  useEffect(() => {
    let courseBatches;
    
    if (selectedCourseForComparison) {
      // Filter by selected course
      courseBatches = batchPerformance
        .filter(batch => batch.course_name === selectedCourseForComparison)
        .map(batch => ({
          ...batch,
          placement_rate: batch.students_enrolled > 0 ? 
            (batch.students_placed / batch.students_enrolled) * 100 : 0,
          display_label: `${batch.course_name}\n(${batch.batch_id})`
        }));
    } else {
      // Show all batches when no course is selected
      courseBatches = batchPerformance.map(batch => ({
        ...batch,
        placement_rate: batch.students_enrolled > 0 ? 
          (batch.students_placed / batch.students_enrolled) * 100 : 0,
        display_label: `${batch.course_name}\n(${batch.batch_id})`
      }));
    }
    
    // Sort by year first, then by month
    courseBatches.sort((a, b) => {
      const getYear = (batchId: string) => {
        const match = batchId.match(/(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      };
      const getMonth = (batchId: string) => {
        const monthMap: { [key: string]: number } = {
          'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
          'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        };
        const match = batchId.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
        return match ? monthMap[match[1]] : 0;
      };
      
      const yearA = getYear(a.batch_id);
      const yearB = getYear(b.batch_id);
      if (yearA !== yearB) return yearA - yearB;
      
      const monthA = getMonth(a.batch_id);
      const monthB = getMonth(b.batch_id);
      return monthA - monthB;
    });
    
    setCourseBatchComparison(courseBatches);
  }, [batchPerformance, selectedCourseForComparison]);

  // Process fee collection by selected batch
  useEffect(() => {
    // Get the latest batch (FEB2025) by default
    const getLatestBatch = () => {
      const batches = batchPerformance.map(b => b.batch_id);
      const years = batches.map(batchId => {
        const match = batchId.match(/(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      });
      const maxYear = Math.max(...years);
      
      // Get all batches from the latest year
      const latestYearBatches = batchPerformance.filter(batch => {
        const match = batch.batch_id.match(/(\d{4})/);
        return match && parseInt(match[1]) === maxYear;
      });
      
      // Return the first batch from latest year (or first available)
      return latestYearBatches.length > 0 ? latestYearBatches[0].batch_id : batchPerformance[0]?.batch_id;
    };

    const batchToShow = selectedBatchForFee || getLatestBatch();
    
    if (batchToShow) {
      const selectedBatchData = batchPerformance
        .filter(batch => batch.batch_id === batchToShow)
        .map(batch => ({
          name: batch.course_name,
          value: (batch.students_enrolled || 0) * (batch.course_fee || 0),
          course_name: batch.course_name,
          fee_collection: (batch.students_enrolled || 0) * (batch.course_fee || 0),
          students_enrolled: batch.students_enrolled || 0,
          course_fee: batch.course_fee || 0
        }));
      
      setFilteredFeeCollection(selectedBatchData);
    } else {
      setFilteredFeeCollection([]);
    }
  }, [batchPerformance, selectedBatchForFee]);

  // Process Revenue Share by Course data
  useEffect(() => {
    if (batchPerformance.length > 0) {
      // Filter by selected batch if any
      let filteredBatches = batchPerformance;
      if (selectedBatchForRevenue) {
        filteredBatches = batchPerformance.filter(batch => batch.batch_id === selectedBatchForRevenue);
      }

      // Aggregate revenue by course from filtered batch data
      const courseRevenueMap = new Map<string, number>();
      
      filteredBatches.forEach(batch => {
        const courseName = batch.course_name;
        const revenue = (batch.students_enrolled || 0) * (batch.course_fee || 0);
        
        if (courseRevenueMap.has(courseName)) {
          courseRevenueMap.set(courseName, courseRevenueMap.get(courseName)! + revenue);
        } else {
          courseRevenueMap.set(courseName, revenue);
        }
      });

      const totalRevenue = Array.from(courseRevenueMap.values()).reduce((sum, revenue) => sum + revenue, 0);
      
      const revenueShareData = Array.from(courseRevenueMap.entries())
        .map(([course_name, total_revenue]) => ({
          name: course_name,
          course_name: course_name,
          total_revenue: total_revenue,
          percentage: totalRevenue > 0 ? ((total_revenue / totalRevenue) * 100) : 0,
          formatted_revenue: formatInCrores(total_revenue)
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue);

      console.log('Revenue Share Data:', revenueShareData);
      setRevenueShareByCourse(revenueShareData);
    }
  }, [batchPerformance, selectedBatchForRevenue]);



  // Fetch enrollments over time when filters change
  useEffect(() => {
    console.log('Enrollments over time useEffect triggered with filters:', {
      selectedCourseForEnrollment,
      selectedBatchTypeForEnrollment
    });

    const fetchEnrollmentsOverTime = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCourseForEnrollment) {
          params.append('course_name', selectedCourseForEnrollment);
        }
        if (selectedBatchTypeForEnrollment) {
          params.append('batch_type', selectedBatchTypeForEnrollment);
        }

        const url = `/api/acts/dashboard/enrollments-over-time${params.toString() ? `?${params.toString()}` : ''}`;
        console.log('Fetching enrollments over time from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Enrollments over time data received:', data);
        console.log('Data length:', data.length);
        console.log('Sample data:', data.slice(0, 2));
        setEnrollmentsOverTime(data);
      } catch (error) {
        console.error('Error fetching enrollments over time:', error);
        // On error, try to fetch all data without filters
        try {
          console.log('Trying fallback fetch without filters...');
          const fallbackResponse = await fetch('/api/acts/dashboard/enrollments-over-time', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback data received:', fallbackData);
          setEnrollmentsOverTime(fallbackData);
        } catch (fallbackError) {
          console.error('Error fetching fallback data:', fallbackError);
          setEnrollmentsOverTime([]);
        }
      }
    };

    fetchEnrollmentsOverTime();
  }, [selectedCourseForEnrollment, selectedBatchTypeForEnrollment]);

  const fetchACTSData = async () => {
    try {
      setLoading(true);
      console.log('Fetching ACTS dashboard data...');
      
      // Fetch summary data
      const summaryRes = await fetch('/api/acts/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const summaryData = await summaryRes.json();
      console.log('ACTS summary data:', summaryData);
      setSummary(summaryData);

      // Fetch enrollment by course
      const enrollmentRes = await fetch('/api/acts/dashboard/enrollment-by-course', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const enrollmentData = await enrollmentRes.json();
      console.log('Enrollment by course data:', enrollmentData);
      setEnrollmentByCourse(enrollmentData);

      // Fetch placement by course
      const placementRes = await fetch('/api/acts/dashboard/placement-by-course', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const placementData = await placementRes.json();
      console.log('Placement by course data:', placementData);
      setPlacementByCourse(placementData);

      // Fetch revenue by course
      const revenueRes = await fetch('/api/acts/dashboard/revenue-by-course', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const revenueData = await revenueRes.json();
      console.log('Revenue by course data:', revenueData);
      console.log('Revenue data length:', revenueData.length);
      console.log('Sample revenue item:', revenueData[0]);
      setRevenueByCourse(revenueData.map((row: any) => ({
        ...row,
        year: Number(row.year),
        total_revenue: Number(row.total_revenue)
      })));

      // Fetch enrollment trends
      const trendsRes = await fetch('/api/acts/dashboard/enrollment-trends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const trendsData = await trendsRes.json();
      console.log('Enrollment trends data:', trendsData);
      setEnrollmentTrends(trendsData);

      // Fetch revenue trends
      const revenueTrendsRes = await fetch('/api/acts/dashboard/revenue-trends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const revenueTrendsData = await revenueTrendsRes.json();
      console.log('Revenue trends data:', revenueTrendsData);
      setRevenueTrends(revenueTrendsData);

      // Fetch batch performance
      const batchRes = await fetch('/api/acts/dashboard/batch-performance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const batchData = await batchRes.json();
      console.log('Batch performance data:', batchData);
      console.log('Batch performance data length:', batchData.length);
      setBatchPerformance(batchData);

      // Set default batch for fee collection (latest batch)
      if (batchData.length > 0) {
        const years = batchData.map((batch: any) => {
          const match = batch.batch_id.match(/(\d{4})/);
          return match ? parseInt(match[1]) : 0;
        });
        const maxYear = Math.max(...years);
        const latestYearBatches = batchData.filter((batch: any) => {
          const match = batch.batch_id.match(/(\d{4})/);
          return match && parseInt(match[1]) === maxYear;
        });
        if (latestYearBatches.length > 0) {
          setSelectedBatchForFee(latestYearBatches[0].batch_id);
        }
      }

      // Fetch batch size distribution
      const batchSizeRes = await fetch('/api/acts/dashboard/batch-size-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const batchSizeData = await batchSizeRes.json();
      console.log('Batch size distribution data:', batchSizeData);
      setBatchSizeDistribution(batchSizeData);

      // Fetch top performing courses
      const topCoursesRes = await fetch('/api/acts/dashboard/top-performing-courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const topCoursesData = await topCoursesRes.json();
      console.log('Top performing courses data:', topCoursesData);
      setTopPerformingCourses(topCoursesData);

      // Fetch enrollments over time
      const enrollmentsOverTimeRes = await fetch('/api/acts/dashboard/enrollments-over-time', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const enrollmentsOverTimeData = await enrollmentsOverTimeRes.json();
      console.log('Enrollments over time data:', enrollmentsOverTimeData);
      console.log('Enrollments over time data length:', enrollmentsOverTimeData.length);
      setEnrollmentsOverTime(enrollmentsOverTimeData);

    } catch (error) {
      console.error('Error fetching ACTS data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utility function to format numbers in crore representation
  const formatInCrores = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)} K`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return formatInCrores(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc', 
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            Year: {Math.round(Number(label))}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '0', color: entry.color }}>
              {entry.name}: {entry.value} students
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomEnrollmentTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Only show the specific course being hovered over
      const entry = payload[0]; // Get only the first entry (the line being hovered)
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc', 
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            Year: {Math.round(Number(label))}
          </p>
          <p style={{ margin: '0', color: entry.color }}>
            {entry.name}: {entry.value} students
          </p>
        </div>
      );
    }
    return null;
  };

  // Helper function to assign colors to courses
  const getCourseColor = (courseName: string, index: number) => {
    const courseColors: { [key: string]: string[] } = {};
    
    // Assign color sets to each course
    const colorSets = [
      ['#1890ff', '#40a9ff', '#69c0ff'], // Blue shades
      ['#52c41a', '#73d13d', '#95de64'], // Green shades
      ['#fa8c16', '#ffa940', '#ffc069'], // Orange shades
      ['#eb2f96', '#f759ab', '#ff85c0'], // Pink shades
      ['#722ed1', '#9254de', '#b37feb'], // Purple shades
      ['#13c2c2', '#36cfc9', '#5cdbd3'], // Cyan shades
    ];
    
    if (!courseColors[courseName]) {
      const colorSetIndex = Object.keys(courseColors).length % colorSets.length;
      courseColors[courseName] = colorSets[colorSetIndex];
    }
    
    return courseColors[courseName][index % courseColors[courseName].length];
  };

  // Helper function to assign colors to batches
  const getBatchColor = (batchId: string, index: number) => {
    const batchColors: { [key: string]: string[] } = {};
    
    // Assign color sets to each batch
    const colorSets = [
      ['#1890ff', '#40a9ff', '#69c0ff'], // Blue shades
      ['#52c41a', '#73d13d', '#95de64'], // Green shades
      ['#fa8c16', '#ffa940', '#ffc069'], // Orange shades
      ['#eb2f96', '#f759ab', '#ff85c0'], // Pink shades
      ['#722ed1', '#9254de', '#b37feb'], // Purple shades
      ['#13c2c2', '#36cfc9', '#5cdbd3'], // Cyan shades
    ];
    
    if (!batchColors[batchId]) {
      const colorSetIndex = Object.keys(batchColors).length % colorSets.length;
      batchColors[batchId] = colorSets[colorSetIndex];
    }
    
    return batchColors[batchId][index % batchColors[batchId].length];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>ACTS Dashboard</Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Courses"
              value={summary.total_courses}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students Enrolled"
              value={summary.total_students_enrolled}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students Placed"
              value={summary.total_students_placed}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overall Placement Rate"
              value={summary.overall_placement_rate}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={summary.total_revenue}
              formatter={(value) => formatInCrores(value as number)}
              valueStyle={{ color: '#eb2f96', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Fee Collection per Batch */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Fee Collection per Batch">
            {batchPerformance.length > 0 ? (
              <>
                {/* Batch Filter */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24}>
                    <Select
                      placeholder="Select a batch to view fee collection"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedBatchForFee}
                      onChange={(value) => {
                        setSelectedBatchForFee(value);
                      }}
                    >
                      {Array.from(new Set(batchPerformance.map(b => b.batch_id))).sort().map(batchId => {
                        const batch = batchPerformance.find(b => b.batch_id === batchId);
                        const batchLabel = `${batchId} (${batch?.course_name || 'Unknown'})`;
                        return (
                          <Select.Option key={batchId} value={batchId}>
                            {batchLabel}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Col>
                </Row>

                {filteredFeeCollection.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={filteredFeeCollection}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}\n${formatInCrores(value)}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {filteredFeeCollection.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          formatInCrores(value),
                          `${props.payload.course_name}`
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="Loading fee collection data..." />
                )}
              </>
            ) : (
              <Empty description="No batch data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Enrollments vs Placements */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Enrollments vs Placements">
            {batchPerformance.length > 0 ? (
              <>
                {/* Filter Controls */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24} sm={6}>
                    <Select
                      placeholder="Filter by Course"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedCourse}
                      onChange={(value) => {
                        setSelectedCourse(value);
                      }}
                    >
                      {Array.from(new Set(batchPerformance.map(b => b.course_name))).map(course => (
                        <Select.Option key={course} value={course}>
                          {course}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Select
                      placeholder="Filter by Year"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedYear}
                      onChange={(value) => {
                        setSelectedYear(value);
                      }}
                    >
                      {Array.from(new Set(batchPerformance.map(b => {
                        const match = b.batch_id.match(/(\d{4})/);
                        return match ? match[1] : '';
                      }).filter(year => year))).sort().map(year => (
                        <Select.Option key={year} value={year}>
                          {year}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Select
                      placeholder="View Mode"
                      style={{ width: '100%' }}
                      value={viewMode}
                      onChange={(value) => {
                        setViewMode(value);
                      }}
                    >
                      <Select.Option value="all">All Batches</Select.Option>
                      <Select.Option value="course">Same Course Batches</Select.Option>
                      <Select.Option value="year">Year-wise</Select.Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Select
                      placeholder="Chart Type"
                      style={{ width: '100%' }}
                      value={chartType}
                      onChange={(value) => {
                        setChartType(value);
                      }}
                    >
                      <Select.Option value="bar">Bar Chart</Select.Option>
                      <Select.Option value="line">Line Chart</Select.Option>
                    </Select>
                  </Col>
                </Row>

                <ResponsiveContainer width="100%" height={400}>
                  {chartType === 'bar' ? (
                    <BarChart data={filteredBatchPerformance.sort((a, b) => {
                      // Sort by year first, then by month
                      const getYear = (batchId: string) => {
                        const match = batchId.match(/(\d{4})/);
                        return match ? parseInt(match[1]) : 0;
                      };
                      const getMonth = (batchId: string) => {
                        const monthMap: { [key: string]: number } = {
                          'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                          'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                        };
                        const match = batchId.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
                        return match ? monthMap[match[1]] : 0;
                      };
                      
                      const yearA = getYear(a.batch_id);
                      const yearB = getYear(b.batch_id);
                      if (yearA !== yearB) return yearA - yearB;
                      
                      const monthA = getMonth(a.batch_id);
                      const monthB = getMonth(b.batch_id);
                      return monthA - monthB;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="batch_id" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tickFormatter={(value) => `${value}\n${filteredBatchPerformance.find(b => b.batch_id === value)?.course_name || ''}`}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          value,
                          name === 'students_enrolled' ? 'Students Enrolled' : 'Students Placed'
                        ]}
                        labelFormatter={(label) => {
                          const batch = filteredBatchPerformance.find(b => b.batch_id === label);
                          return `Batch: ${label}\nCourse: ${batch?.course_name || ''}`;
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="students_enrolled" 
                        fill="#1890ff" 
                        name="Students Enrolled"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="students_placed" 
                        fill="#eb2f96" 
                        name="Students Placed"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <ComposedChart data={filteredBatchPerformance.sort((a, b) => {
                      // Sort by year first, then by month
                      const getYear = (batchId: string) => {
                        const match = batchId.match(/(\d{4})/);
                        return match ? parseInt(match[1]) : 0;
                      };
                      const getMonth = (batchId: string) => {
                        const monthMap: { [key: string]: number } = {
                          'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                          'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                        };
                        const match = batchId.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
                        return match ? monthMap[match[1]] : 0;
                      };
                      
                      const yearA = getYear(a.batch_id);
                      const yearB = getYear(b.batch_id);
                      if (yearA !== yearB) return yearA - yearB;
                      
                      const monthA = getMonth(a.batch_id);
                      const monthB = getMonth(b.batch_id);
                      return monthA - monthB;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="batch_id" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tickFormatter={(value) => `${value}\n${filteredBatchPerformance.find(b => b.batch_id === value)?.course_name || ''}`}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          value,
                          name === 'students_enrolled' ? 'Students Enrolled' : 'Students Placed'
                        ]}
                        labelFormatter={(label) => {
                          const batch = filteredBatchPerformance.find(b => b.batch_id === label);
                          return `Batch: ${label}\nCourse: ${batch?.course_name || ''}`;
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="students_enrolled" 
                        fill="#1890ff" 
                        name="Students Enrolled"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="students_placed" 
                        stroke="#eb2f96" 
                        strokeWidth={3}
                        name="Students Placed"
                        dot={{ fill: '#eb2f96', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </>
            ) : (
              <Empty description="No batch data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Enrollment by Batch */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Enrollment by Batch">
            {batchTypeDistribution.length > 0 ? (
              <>
                {/* Year Filter for Batch Type Chart */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24}>
                    <Select
                      placeholder="Filter by Year"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedYear}
                      onChange={(value) => {
                        setSelectedYear(value);
                      }}
                    >
                      {Array.from(new Set(batchPerformance.map(b => {
                        const match = b.batch_id.match(/(\d{4})/);
                        return match ? match[1] : '';
                      }).filter(year => year))).sort().map(year => (
                        <Select.Option key={year} value={year}>
                          {year}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={batchTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="batch_type" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value} students`, 'Total Enrolled']}
                      labelFormatter={(label) => `${label} Batches`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total_enrolled" 
                      fill="#52c41a" 
                      name="Total Students Enrolled"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <Empty description="No batch data available" />
            )}
          </Card>
        </Col>

        {/* Placement Rate by Batch */}
        <Col xs={24} lg={12}>
          <Card title="Placement Rate by Course Batches">
            {batchPerformance.length > 0 ? (
              <>
                {/* Course Selector */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24}>
                    <Select
                      placeholder="Select a course to filter (optional - shows all courses by default)"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedCourseForComparison}
                      onChange={(value) => {
                        setSelectedCourseForComparison(value);
                      }}
                    >
                      {Array.from(new Set(batchPerformance.map(b => b.course_name))).map(course => (
                        <Select.Option key={course} value={course}>
                          {course}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={courseBatchComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="display_label" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Placement Rate']}
                      labelFormatter={(label) => `Course & Batch: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="placement_rate" 
                      fill="#fa8c16" 
                      name="Placement Rate (%)"
                      radius={[4, 4, 0, 0]}
                    >
                      {courseBatchComparison.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getBatchColor(entry.batch_id, index)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <Empty description="No batch data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Total Enrollments Over Time */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Total Enrollments Over Time">
            {enrollmentsOverTime.length > 0 ? (
              <>
                {/* Debug Info */}
                <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <Text strong>Debug Info:</Text>
                  <br />
                  <Text>Data points: {enrollmentsOverTime.length}</Text>
                  <br />
                  <Text>Sample data: {JSON.stringify(enrollmentsOverTime.slice(0, 2))}</Text>
                </div>

                {/* Filters */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '10px' }}>
                      <Text strong>Filter by Course:</Text>
                    </div>
                    <Select
                      placeholder="All Courses"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedCourseForEnrollment}
                      onChange={(value) => setSelectedCourseForEnrollment(value)}
                      showSearch
                      optionFilterProp="children"
                    >
                      {Array.from(new Set(batchPerformance.map(b => b.course_name))).map(course => (
                        <Select.Option key={course} value={course}>
                          {course}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '10px' }}>
                      <Text strong>Filter by Batch Type:</Text>
                    </div>
                    <Select
                      placeholder="All Batch Types"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedBatchTypeForEnrollment}
                      onChange={(value) => setSelectedBatchTypeForEnrollment(value)}
                    >
                      <Select.Option value="February">February Batches</Select.Option>
                      <Select.Option value="August">August Batches</Select.Option>
                    </Select>
                  </Col>
                </Row>

                {/* Clear Filters Button */}
                {(selectedCourseForEnrollment || selectedBatchTypeForEnrollment) && (
                  <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                    <Col xs={24}>
                      <button
                        onClick={() => {
                          setSelectedCourseForEnrollment(undefined);
                          setSelectedBatchTypeForEnrollment(undefined);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Clear All Filters
                      </button>
                    </Col>
                  </Row>
                )}

                {/* Chart Type Selector */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24}>
                    <div style={{ marginBottom: '10px' }}>
                      <Text strong>Chart Type:</Text>
                    </div>
                    <Select
                      value={enrollmentChartType}
                      onChange={(value) => setEnrollmentChartType(value)}
                      style={{ width: 200 }}
                    >
                      <Select.Option value="line">Line Chart</Select.Option>
                      <Select.Option value="area">Area Chart</Select.Option>
                    </Select>
                  </Col>
                </Row>

                <ResponsiveContainer width="100%" height={400}>
                  {enrollmentChartType === 'line' ? (
                    <LineChart data={enrollmentsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time_label" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} students`, 
                          'Total Enrolled'
                        ]}
                        labelFormatter={(label) => `Time Period: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total_enrolled" 
                        stroke="#1890ff" 
                        strokeWidth={3}
                        name="Students Enrolled"
                        dot={{ fill: '#1890ff', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={enrollmentsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time_label" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} students`, 
                          'Total Enrolled'
                        ]}
                        labelFormatter={(label) => `Time Period: ${label}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="total_enrolled" 
                        stroke="#1890ff" 
                        fill="#1890ff"
                        fillOpacity={0.3}
                        name="Students Enrolled"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </>
            ) : (
              <Empty 
                description={
                  <div>
                    <p>No enrollment data available</p>
                    {(selectedCourseForEnrollment || selectedBatchTypeForEnrollment) && (
                      <p style={{ fontSize: '14px', color: '#666' }}>
                        Try clearing the filters or selecting different options
                      </p>
                    )}
                  </div>
                }
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Revenue Share by Course (Donut) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Revenue Share by Course">
            {batchPerformance.length > 0 ? (
              <>
                {/* Batch Filter */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24}>
                    <div style={{ marginBottom: '10px' }}>
                      <Text strong>Filter by Batch:</Text>
                    </div>
                    <Select
                      placeholder="All Batches"
                      style={{ width: '100%' }}
                      allowClear
                      value={selectedBatchForRevenue}
                      onChange={(value) => setSelectedBatchForRevenue(value)}
                      showSearch
                      optionFilterProp="children"
                    >
                      {Array.from(new Set(batchPerformance.map(b => b.batch_id))).sort().map(batchId => {
                        const batch = batchPerformance.find(b => b.batch_id === batchId);
                        const batchLabel = `${batchId} (${batch?.course_name || 'Unknown'})`;
                        return (
                          <Select.Option key={batchId} value={batchId}>
                            {batchLabel}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Col>
                </Row>

                {revenueShareByCourse.length > 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={revenueShareByCourse}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="total_revenue"
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            
                            return (
                              <text 
                                x={x} 
                                y={y} 
                                fill="white" 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                {percentage.toFixed(1)}%
                              </text>
                            );
                          }}
                          labelLine={false}
                        >
                          {revenueShareByCourse.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${props.payload.formatted_revenue}`,
                            `${props.payload.name}`
                          ]}
                          labelFormatter={(label) => `Course: ${label}`}
                        />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          wrapperStyle={{ paddingLeft: '20px' }}
                        />
                        
                        {/* Custom circular labels for course names */}
                        {revenueShareByCourse.map((entry, index) => {
                          const angle = (index * 360 / revenueShareByCourse.length) - 90; // Start from top
                          const radius = 160; // Outer radius for labels
                          const x = 50 + radius * Math.cos(angle * Math.PI / 180);
                          const y = 50 + radius * Math.sin(angle * Math.PI / 180);
                          
                          return (
                            <text
                              key={`label-${index}`}
                              x={`${x}%`}
                              y={`${y}%`}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="12"
                              fill="#333"
                              fontWeight="500"
                            >
                              {entry.course_name}
                            </text>
                          );
                        })}
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Summary Statistics */}
                    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Statistic
                            title="Total Revenue"
                            value={revenueShareByCourse.reduce((sum, item) => sum + item.total_revenue, 0)}
                            formatter={(value) => formatInCrores(value as number)}
                            valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ) : (
                  <Empty description="No revenue data available for selected batch" />
                )}
              </>
            ) : (
              <Empty description="No batch data available" />
            )}
          </Card>
        </Col>


      </Row>
    </div>
  );
};

export default ACTSDashboardPage; 