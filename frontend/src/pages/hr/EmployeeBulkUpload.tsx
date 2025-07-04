import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Table, 
  Upload, 
  message, 
  Typography, 
  Card, 
  Space, 
  Tag, 
  Alert, 
  Divider,
  Steps,
  Modal,
  Progress
} from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { hrAPI, technicalGroupsAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Step } = Steps;

interface EmployeeRow {
  employee_id: string;
  employee_name: string;
  join_date: string;
  designation: string;
  initial_designation?: string;
  employee_type: string;
  technical_group?: string;
  gender: string;
  level?: string;
  [key: string]: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface UploadResult {
  success: any[];
  errors: any[];
  skipped: any[];
}

const EmployeeBulkUpload: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rawData, setRawData] = useState<EmployeeRow[]>([]);
  const [validatedData, setValidatedData] = useState<EmployeeRow[]>([]);
  const [validationResults, setValidationResults] = useState<{ [key: string]: ValidationResult }>({});
  const [uploadResults, setUploadResults] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [designations, setDesignations] = useState<any[]>([]);
  const [technicalGroups, setTechnicalGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [designationsResponse, groupsResponse] = await Promise.all([
        hrAPI.getDesignations(),
        hrAPI.getTechnicalGroups()
      ]);
      setDesignations(designationsResponse.data);
      setTechnicalGroups(groupsResponse.data);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      message.error('Failed to fetch reference data');
    }
  };

  const validateEmployee = (employee: EmployeeRow, index: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!employee.employee_id) {
      errors.push('Employee ID is required');
    } else if (isNaN(Number(employee.employee_id))) {
      errors.push('Employee ID must be a number');
    }

    if (!employee.employee_name) {
      errors.push('Employee name is required');
    }

    if (!employee.join_date) {
      errors.push('Join date is required');
    } else {
      const joinDate = new Date(employee.join_date);
      if (isNaN(joinDate.getTime())) {
        errors.push('Invalid join date format');
      }
    }

    if (!employee.designation) {
      errors.push('Designation is required');
    } else {
      const designationExists = designations.some(d => 
        d.designation === employee.designation || d.designation_full === employee.designation
      );
      if (!designationExists) {
        errors.push(`Designation "${employee.designation}" not found`);
      }
    }

    if (!employee.employee_type) {
      errors.push('Employee type is required');
    }

    if (!employee.gender) {
      errors.push('Gender is required');
    } else if (!['M', 'F', 'T'].includes(employee.gender.toUpperCase())) {
      errors.push('Gender must be M, F, or T');
    }

    // Optional field validation
    if (employee.initial_designation) {
      const initialDesignationExists = designations.some(d => 
        d.designation === employee.initial_designation || d.designation_full === employee.initial_designation
      );
      if (!initialDesignationExists) {
        errors.push(`Initial designation "${employee.initial_designation}" not found`);
      }
    }

    if (employee.technical_group) {
      const groupExists = technicalGroups.some(g => g.group_name === employee.technical_group);
      if (!groupExists) {
        errors.push(`Technical group "${employee.technical_group}" not found`);
      }
    } else {
      warnings.push('No technical group assigned - will need manual assignment later');
    }

    if (employee.level && isNaN(Number(employee.level))) {
      errors.push('Level must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleUpload = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: EmployeeRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        setRawData(jsonData);
        
        // Validate all rows
        const validationResults: { [key: string]: ValidationResult } = {};
        jsonData.forEach((row, index) => {
          validationResults[`${row.employee_id || index}`] = validateEmployee(row, index);
        });
        
        setValidationResults(validationResults);
        
        // Filter valid data
        const validData = jsonData.filter((row, index) => 
          validationResults[`${row.employee_id || index}`].isValid
        );
        
        setValidatedData(validData);
        setCurrentStep(1);
        message.success(`File uploaded successfully. ${jsonData.length} rows found.`);
        
      } catch (error) {
        console.error('Error parsing file:', error);
        message.error('Error parsing Excel file');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const handleUploadToDatabase = async () => {
    try {
      setUploading(true);
      const result = await hrAPI.bulkUploadEmployees(validatedData);
      setUploadResults(result.data);
      setCurrentStep(2);
      
      const successCount = result.data.success.length;
      const errorCount = result.data.errors.length;
      const skippedCount = result.data.skipped.length;
      
      message.success(
        `Upload completed! ${successCount} employees added, ${errorCount} errors, ${skippedCount} skipped`
      );
    } catch (error) {
      console.error('Error uploading employees:', error);
      message.error('Failed to upload employees');
    } finally {
      setUploading(false);
    }
  };

  const getPreviewColumns = () => [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 100,
      render: (value: string, record: EmployeeRow, index: number) => {
        const validation = validationResults[`${value || index}`];
        return (
          <div>
            {value}
            {validation && !validation.isValid && (
              <ExclamationCircleOutlined 
                style={{ color: 'red', marginLeft: 4 }}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            )}
          </div>
        );
      }
    },
    {
      title: 'Employee Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 150,
    },
    {
      title: 'Join Date',
      dataIndex: 'join_date',
      key: 'join_date',
      width: 100,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 120,
    },
    {
      title: 'Initial Designation',
      dataIndex: 'initial_designation',
      key: 'initial_designation',
      width: 120,
    },
    {
      title: 'Employee Type',
      dataIndex: 'employee_type',
      key: 'employee_type',
      width: 120,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (value: string) => {
        const genderMap: { [key: string]: string } = {
          'M': 'Male',
          'F': 'Female', 
          'T': 'Transgender'
        };
        return genderMap[value?.toUpperCase()] || value;
      }
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
    },
    {
      title: 'Technical Group',
      dataIndex: 'technical_group',
      key: 'technical_group',
      width: 150,
      render: (value: string) => 
        value ? <Tag color="green">{value}</Tag> : <Tag color="orange">Not Assigned</Tag>,
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: EmployeeRow, index: number) => {
        const validation = validationResults[`${record.employee_id || index}`];
        if (!validation) return null;
        
        if (validation.isValid) {
          return <Tag color="green">Valid</Tag>;
        } else {
          return (
            <div>
              <Tag color="red">Invalid</Tag>
              <div style={{ fontSize: '11px', color: 'red' }}>
                {validation.errors.slice(0, 2).join(', ')}
                {validation.errors.length > 2 && '...'}
              </div>
            </div>
          );
        }
      }
    }
  ];

  const getResultsColumns = () => [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 100,
    },
    {
      title: 'Employee Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 150,
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: EmployeeRow, index: number) => {
        if (uploadResults?.success.some(s => s.employee_id === record.employee_id)) {
          return <Tag color="green">Success</Tag>;
        } else if (uploadResults?.errors.some(e => e.employee_id === record.employee_id)) {
          return <Tag color="red">Error</Tag>;
        } else if (uploadResults?.skipped.some(s => s.employee_id === record.employee_id)) {
          return <Tag color="orange">Skipped</Tag>;
        }
        return null;
      }
    },
    {
      title: 'Message',
      key: 'message',
      width: 200,
      render: (_: any, record: EmployeeRow) => {
        const error = uploadResults?.errors.find(e => e.employee_id === record.employee_id);
        const skipped = uploadResults?.skipped.find(s => s.employee_id === record.employee_id);
        
        if (error) {
          return <Text type="danger">{error.error}</Text>;
        } else if (skipped) {
          return <Text type="warning">{skipped.reason}</Text>;
        }
        return <Text type="success">Successfully uploaded</Text>;
      }
    }
  ];

  const resetUpload = () => {
    setRawData([]);
    setValidatedData([]);
    setValidationResults({});
    setUploadResults(null);
    setCurrentStep(0);
  };

  const downloadTemplate = () => {
    const template = [
      {
        employee_id: '1001',
        employee_name: 'John Doe',
        join_date: '2024-01-15',
        designation: 'PE',
        initial_designation: 'KA',
        employee_type: 'Regular',
        technical_group: 'SOULWARE',
        gender: 'M',
        level: '1'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'employee_upload_template.xlsx');
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>Bulk Employee Upload</Title>
        <Text type="secondary">
          Upload employee data from Excel file. Employees without technical groups can be assigned later.
        </Text>

        <Steps current={currentStep} style={{ margin: '24px 0' }}>
          <Step title="Upload File" description="Select and validate Excel file" />
          <Step title="Preview & Validate" description="Review data before upload" />
          <Step title="Upload Complete" description="View upload results" />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Upload Instructions"
                description={
                  <div>
                    <p><strong>Required columns:</strong> employee_id, employee_name, join_date, designation, employee_type, gender</p>
                    <p><strong>Optional columns:</strong> initial_designation, technical_group, level</p>
                    <p><strong>Supported designations:</strong> PE, KA, SPE, PA</p>
                    <p><strong>Supported groups:</strong> SOULWARE, VLSI, HPC, SSP, AI, IoT</p>
                    <p><strong>Gender values:</strong> M (Male), F (Female), T (Transgender)</p>
                  </div>
                }
                type="info"
                showIcon
              />
              
              <Space>
                <Button 
                  icon={<DownloadOutlined onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}} />} 
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
                
                <Upload
                  beforeUpload={handleUpload}
                  showUploadList={false}
                  accept=".xlsx,.xls"
                  disabled={loading}
                >
                  <Button 
                    icon={<UploadOutlined onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}} />} 
                    loading={loading}
                    type="primary"
                  >
                    Select Excel File
                  </Button>
                </Upload>
              </Space>
            </Space>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message={`Data Preview - ${rawData.length} total rows, ${validatedData.length} valid rows`}
                description={
                  <div>
                    <p>Valid rows will be uploaded to the database. Invalid rows will be skipped.</p>
                    <p>Employees without technical groups can be assigned later using the "Assign Group" feature.</p>
                  </div>
                }
                type="info"
                showIcon
              />

              <Table
                dataSource={rawData}
                columns={getPreviewColumns()}
                rowKey={(record, index) => `${record.employee_id || index}`}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />

              <Space>
                <Button onClick={resetUpload}>
                  Upload New File
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleUploadToDatabase}
                  loading={uploading}
                  disabled={validatedData.length === 0}
                >
                  Upload {validatedData.length} Valid Employees
                </Button>
              </Space>
            </Space>
          </div>
        )}

        {currentStep === 2 && uploadResults && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Upload Results"
                description={
                  <div>
                    <p><strong>Successfully uploaded:</strong> {uploadResults.success.length} employees</p>
                    <p><strong>Errors:</strong> {uploadResults.errors.length} rows</p>
                    <p><strong>Skipped:</strong> {uploadResults.skipped.length} rows (duplicate IDs)</p>
                  </div>
                }
                type="success"
                showIcon
              />

              <Table
                dataSource={rawData}
                columns={getResultsColumns()}
                rowKey={(record, index) => `${record.employee_id || index}`}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />

              <Space>
                <Button onClick={resetUpload}>
                  Upload Another File
                </Button>
              </Space>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeBulkUpload; 