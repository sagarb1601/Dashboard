import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Input,
  DatePicker,
  message,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Tabs,
  Spin
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../contexts/AuthContext';
import ProjectStatusMatrix from './ProjectStatusMatrix';
import 'antd/dist/antd.css';
import moment, { Moment } from 'moment';
import { RangeValue } from 'rc-picker/lib/interface';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProjectStatus {
  project_id: number;
  project_name: string;
  start_date: string;
  end_date: string;
  funding_agency: string;
  centre: string;
  project_investigator_id: number;
  pi_name: string;
  status: 'RED' | 'YELLOW' | 'GREEN' | null;
  remarks: string;
  month: string;
  last_updated_on: string;
}

interface ProjectStatusForm {
  project_id: number;
  status: 'RED' | 'YELLOW' | 'GREEN' | null;
  remarks: string;
}

const ProjectManagement: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{ [key: number]: ProjectStatusForm }>({});
  const [activeTab, setActiveTab] = useState<'current' | 'matrix'>('current');
  const [matrixMonths, setMatrixMonths] = useState<string[]>(() => {
    const months: string[] = [];
    const today = dayjs();
    for (let i = 11; i >= 0; i--) {
      months.push(today.subtract(i, 'month').format('YYYY-MM'));
    }
    return months;
  });
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/project-status?month=${selectedMonth}&group_id=${user?.group_id || ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);

      const initialFormData: { [key: number]: ProjectStatusForm } = {};
      data.forEach((project: ProjectStatus) => {
        initialFormData[project.project_id] = {
          project_id: project.project_id,
          status: project.status,
          remarks: project.remarks || ''
        };
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, user?.group_id]);

  const fetchMatrixData = useCallback(async (months: string[]) => {
    setMatrixLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/project-status/matrix?months=${months.join(',')}&group_id=${user?.group_id || ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch matrix data');
      const data = await response.json();
      setMatrixData(data);
    } catch (e) {
      console.error('Error fetching matrix data:', e);
      setMatrixData([]);
    } finally {
      setMatrixLoading(false);
    }
  }, [user?.group_id]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [selectedMonth, user, fetchProjects]);

  useEffect(() => {
    if (activeTab === 'matrix') {
      fetchMatrixData(matrixMonths);
    }
  }, [activeTab, matrixMonths, fetchMatrixData]);

  const updateFormData = (projectId: number, field: keyof ProjectStatusForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value
      }
    }));
  };

  const saveProjectStatus = async (projectId: number) => {
    const projectData = formData[projectId];
    if (!projectData?.status) {
      message.error('Please select a status for this project');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/project-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          status: projectData.status,
          remarks: projectData.remarks,
          month: selectedMonth
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save project status');
      }

      message.success('Project status saved successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error saving project status:', error);
      message.error('Failed to save project status');
    } finally {
      setSaving(false);
    }
  };



  const getStatistics = () => {
    const totalProjects = projects.length;
    const completedProjects = Object.values(formData).filter(data => data.status === 'GREEN').length;
    const ongoingProjects = Object.values(formData).filter(data => data.status === 'YELLOW').length;
    const delayedProjects = Object.values(formData).filter(data => data.status === 'RED').length;
    const pendingProjects = totalProjects - completedProjects - ongoingProjects - delayedProjects;

    return {
      total: totalProjects,
      completed: completedProjects,
      ongoing: ongoingProjects,
      delayed: delayedProjects,
      pending: pendingProjects
    };
  };

  const stats = getStatistics();

  // Show loading if user is not yet loaded
  if (!user) {
    return <div>Loading...</div>;
  }

  const columns: ColumnsType<ProjectStatus> = [
    {
      title: '#',
      key: 'serial',
      width: 40,
      align: 'center',
      render: (_: any, __: ProjectStatus, index: number) => index + 1
    },
    {
      title: 'Project',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 250,
      render: (text) => (
        <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontWeight: 500 }}>{text}</div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const currentStatus = formData[record.project_id]?.status ?? record.status;
        const statusColor = currentStatus === 'GREEN' ? 'green' : 
                            currentStatus === 'YELLOW' ? 'orange' : 
                            currentStatus === 'RED' ? 'red' : 'default';
        return (
          <Select
            value={formData[record.project_id]?.status || null}
            onChange={(value) => updateFormData(record.project_id, 'status', value)}
            placeholder="Status"
            style={{ width: '100%' }}
            size="small"
            optionLabelProp="label"
          >
            <Option value="GREEN" label={<Tag color="green">GREEN</Tag>}><Tag color="green">GREEN</Tag></Option>
            <Option value="YELLOW" label={<Tag color="orange">YELLOW</Tag>}><Tag color="orange">YELLOW</Tag></Option>
            <Option value="RED" label={<Tag color="red">RED</Tag>}><Tag color="red">RED</Tag></Option>
          </Select>
        );
      }
    },
    {
      title: 'Contact person',
      dataIndex: 'pi_name',
      key: 'pi_name',
      width: 140,
      render: (text) => <span style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{text}</span>
    },
    {
      title: 'Sponsor',
      dataIndex: 'funding_agency',
      key: 'funding_agency',
      width: 120,
      render: (text) => <span style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{text}</span>
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 100,
      align: 'center',
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY') : ''
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 100,
      align: 'center',
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY') : ''
    },
    {
      title: 'Remarks',
      key: 'remarks',
      width: 250,
      render: (_, record) => (
        <TextArea
          value={formData[record.project_id]?.remarks || record.remarks || ''}
          onChange={(e) => updateFormData(record.project_id, 'remarks', e.target.value)}
          placeholder="Remarks"
          rows={2}
          style={{ minWidth: 180 }}
        />
      )
    },
    {
      title: 'Last updated on',
      dataIndex: 'last_updated_on',
      key: 'last_updated_on',
      width: 120,
      align: 'center',
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY HH:mm') : ''
    },
    {
      title: 'Link to Project status report',
      key: 'status_report_link',
      width: 120,
      align: 'center',
      // render: () => <a href="#" style={{ color: '#1890ff' }}>View</a>
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => saveProjectStatus(record.project_id)}
          loading={saving}
          disabled={!formData[record.project_id]?.status}
        >
          Save
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Project Status</Title>
      <Tabs activeKey={activeTab} onChange={key => setActiveTab(key as 'current' | 'matrix')}>
        <Tabs.TabPane tab="Current Month" key="current">
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={16} align="middle">
              <Col>
                <Text strong>Select Month:</Text>
              </Col>
              <Col>
                <DatePicker
                  picker="month"
                  value={dayjs(selectedMonth) as any}
                  onChange={(date) => setSelectedMonth(date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))}
                  format="MMMM YYYY"
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  style={{ marginLeft: 16 }}
                  onClick={async () => {
                    try {
                      const url = `http://localhost:5000/api/project-status/export-xlsx?month=${selectedMonth}&group_id=${user?.group_id || ''}`;
                      const response = await fetch(url, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      });
                      if (!response.ok) throw new Error('Failed to download Excel');
                      const blob = await response.blob();
                      const link = document.createElement('a');
                      link.href = window.URL.createObjectURL(blob);
                      link.download = `project-status-${selectedMonth}.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (err) {
                      message.error('Failed to download Excel file');
                    }
                  }}
                  disabled={loading}
                >
                  Download Excel
                </Button>
              </Col>
            </Row>
          </Card>
          <Card>
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="project_id"
              loading={loading}
              pagination={false}
              scroll={{ x: 1200 }}
              bordered
            />
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Matrix View" key="matrix">
          <Card style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>Select Month Range:</span>
            <DatePicker.RangePicker
              picker="month"
              value={[matrixMonths[0] ? moment(matrixMonths[0] + '-01') : null, matrixMonths[matrixMonths.length - 1] ? moment(matrixMonths[matrixMonths.length - 1] + '-01') : null] as RangeValue<Moment>}
              onChange={(dates: RangeValue<Moment>, formatString: [string, string]) => {
                if (dates && dates[0] && dates[1]) {
                  const start = dates[0].startOf('month');
                  const end = dates[1].startOf('month');
                  const months: string[] = [];
                  let d = start.clone();
                  while (d.isSameOrBefore(end)) {
                    months.push(d.format('YYYY-MM'));
                    d = d.add(1, 'month');
                  }
                  setMatrixMonths(months);
                }
              }}
              allowClear={false}
              style={{ minWidth: 300 }}
            />
          </Card>
          {matrixLoading ? <Spin /> : <ProjectStatusMatrix months={matrixMonths} data={matrixData} />}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default ProjectManagement; 