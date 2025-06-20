import { startOfQuarter, endOfQuarter, startOfYear, endOfYear, addQuarters, addYears, isAfter, isBefore, getQuarter, getYear, setMonth, setDate, getMonth, parseISO, format } from 'date-fns';

export const getQuarterInfo = (year: number, quarter: number, reportingType: 'FY' | 'PQ', projectStartDate: string): string => {
  if (reportingType === 'FY') {
    // For FY, quarters are:
    // Q1: Apr-Jun
    // Q2: Jul-Sep
    // Q3: Oct-Dec
    // Q4: Jan-Mar
    const startMonth = quarter === 1 ? 'Apr' : quarter === 2 ? 'Jul' : quarter === 3 ? 'Oct' : 'Jan';
    const endMonth = quarter === 1 ? 'Jun' : quarter === 2 ? 'Sep' : quarter === 3 ? 'Dec' : 'Mar';
    return `FY ${year}-${(year + 1).toString().slice(-2)} Q${quarter} (${startMonth}-${endMonth})`;
  } else {
    // For PQ, quarters are based on project start date
    const startDate = parseISO(projectStartDate);
    const quarterStartDate = addQuarters(startDate, (quarter - 1));
    const quarterEndDate = addQuarters(quarterStartDate, 1);
    return `PQ ${quarter} (${format(quarterStartDate, 'MMM yyyy')}-${format(quarterEndDate, 'MMM yyyy')})`;
  }
};

export const getCurrentQuarter = (reportingType: 'FY' | 'PQ', projectStartDate: string): number => {
  const today = new Date();
  const startDate = parseISO(projectStartDate);
  
  if (reportingType === 'FY') {
    // For FY, quarters are:
    // Q1: Apr-Jun (months 3-5)
    // Q2: Jul-Sep (months 6-8)
    // Q3: Oct-Dec (months 9-11)
    // Q4: Jan-Mar (months 0-2)
    const month = getMonth(today);
    if (month >= 3 && month <= 5) return 1;
    if (month >= 6 && month <= 8) return 2;
    if (month >= 9 && month <= 11) return 3;
    return 4;
  } else {
    // For PQ, quarters are based on project start date
    const monthsSinceStart = (getYear(today) - getYear(startDate)) * 12 + getMonth(today) - getMonth(startDate);
    return Math.floor(monthsSinceStart / 3) + 1;
  }
};

export const getCurrentYear = (reportingType: 'FY' | 'PQ', projectStartDate: string): number => {
  const today = new Date();
  const startDate = parseISO(projectStartDate);
  
  if (reportingType === 'FY') {
    // For FY, if month is April or later, use current year, otherwise use previous year
    return getMonth(today) >= 3 ? getYear(today) : getYear(today) - 1;
  } else {
    // For PQ, use the year based on project start date
    const yearsSinceStart = getYear(today) - getYear(startDate);
    return getYear(startDate) + yearsSinceStart;
  }
};

export const getQuarterMonths = (quarter: number): { start: number; end: number } => {
  // For FY reporting type
  switch (quarter) {
    case 1: return { start: 3, end: 5 };  // Apr-Jun
    case 2: return { start: 6, end: 8 };  // Jul-Sep
    case 3: return { start: 9, end: 11 }; // Oct-Dec
    case 4: return { start: 0, end: 2 };  // Jan-Mar
    default: throw new Error('Invalid quarter');
  }
}; 