import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Spin, Typography } from 'antd';
import api from '../../../utils/api';

const { Text } = Typography;

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

const BudgetExpenditureTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expenditureLoading, setExpenditureLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBudgetFields(selectedProject.project_id);
      fetchBudgetEntries(selectedProject.project_id);
      fetchExpenditures(selectedProject.project_id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/finance/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchBudgetFields = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/budget-fields-with-grants`);
      setBudgetFields(response.data);
    } catch (error) {
      console.error('Error fetching budget fields:', error);
    }
  };

  const fetchBudgetEntries = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/budget-entries`);
      setBudgetEntries(response.data);
    } catch (error) {
      console.error('Error fetching budget entries:', error);
    }
  };

  const fetchExpenditures = async (projectId: number) => {
    try {
      setExpenditureLoading(true);
      const response = await api.get(`/finance/projects/${projectId}/expenditures`);
      setExpenditures(response.data);
    } catch (error) {
      console.error('Error fetching expenditures:', error);
    } finally {
      setExpenditureLoading(false);
    }
  };

  const handleProjectChange = async (value: number) => {
    const project = projects.find(p => p.project_id === value);
    setSelectedProject(project || null);
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null) {
      return '0';
    }
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
    
    if (isNegative) {
      return `(${formatted})`;
    }
    return formatted;
  };

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
      const total = expenditures
          .filter(exp => exp.field_id === fieldId && getExpenditureYear(exp) === year)
          .reduce((sum, exp) => sum + (Number(exp.amount_spent) || 0), 0);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getTotalExpenditure = (fieldId: number): number => {
      const total = expenditures
          .filter(exp => exp.field_id === fieldId)
          .reduce((sum, exp) => sum + (Number(exp.amount_spent) || 0), 0);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getBalance = (fieldId: number): number => {
      const grantReceived = getLatestGrantReceived(fieldId);
      const totalExpenditure = getTotalExpenditure(fieldId);
      const balance = grantReceived - totalExpenditure;
      if (isNaN(balance)) {
          return 0;
      }
      return balance;
  };

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

  return (
    <div style={{ padding: '24px' }}>
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
            <Text strong>Selected Project: {selectedProject.project_name}</Text>
          </div>
        )}

        {expenditureLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Loading budget and expenditure data...</Text>
            </div>
          </div>
        ) : selectedProject && budgetFields.length > 0 && expenditures.length >= 0 && budgetEntries.length >= 0 ? (
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
    </div>
  );
};

export default BudgetExpenditureTab;
export {}; 