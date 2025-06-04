export const getQuarterInfo = (periodType: 'PQ' | 'FY', quarterNumber: number, projectStartDate?: string) => {
  if (periodType === 'FY') {
    const quarters = {
      1: 'Q1 (Apr-Jun)',
      2: 'Q2 (Jul-Sep)',
      3: 'Q3 (Oct-Dec)',
      4: 'Q4 (Jan-Mar)',
    };
    return quarters[quarterNumber as 1 | 2 | 3 | 4];
  } else {
    if (!projectStartDate) return `Q${quarterNumber}`;
    
    const start = new Date(projectStartDate);
    const quarterStart = new Date(start);
    quarterStart.setMonth(start.getMonth() + (quarterNumber - 1) * 3);
    const quarterEnd = new Date(quarterStart);
    quarterEnd.setMonth(quarterStart.getMonth() + 2);

    return `Q${quarterNumber} (${quarterStart.toLocaleDateString('en-US', { month: 'short' })}-${quarterEnd.toLocaleDateString('en-US', { month: 'short' })})`;
  }
};

export const getCurrentQuarter = (periodType: 'PQ' | 'FY', projectStartDate?: string): number => {
  const currentDate = new Date();
  
  if (periodType === 'FY') {
    const month = currentDate.getMonth() + 1;
    if (month >= 4 && month <= 6) return 1;
    if (month >= 7 && month <= 9) return 2;
    if (month >= 10 && month <= 12) return 3;
    return 4;
  } else {
    if (!projectStartDate) return 1;
    
    const start = new Date(projectStartDate);
    const diffMonths = (currentDate.getFullYear() - start.getFullYear()) * 12 + 
                      currentDate.getMonth() - start.getMonth();
    return Math.floor(diffMonths / 3) + 1;
  }
};

export const getCurrentYear = (periodType: 'PQ' | 'FY', projectStartDate?: string): number => {
  const currentDate = new Date();
  
  if (periodType === 'FY') {
    const currentMonth = currentDate.getMonth() + 1;
    return currentMonth < 4 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
  } else {
    if (!projectStartDate) return 1;
    
    const start = new Date(projectStartDate);
    const diffYears = currentDate.getFullYear() - start.getFullYear();
    const diffMonths = currentDate.getMonth() - start.getMonth();
    return diffMonths < 0 ? diffYears - 1 : diffYears;
  }
}; 