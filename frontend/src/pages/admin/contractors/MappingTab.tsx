import React, { useState, useEffect } from "react";
import {
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Card,
  Space,
  Modal,
  Tabs,
  List,
  message,
  Typography,
  Input,
  ConfigProvider,
} from "antd";
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import { PlusOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";
import type { TableProps } from "antd/es/table";
import type { Dayjs } from "dayjs";
import type { Rule } from "antd/es/form";
import type { DatePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { contractors, departments, mappings } from "../../../utils/api";
import {
  Contractor,
  Department,
  ContractorMapping,
  mappingSchema,
} from "../../../types/contractor";
import type { SelectProps } from "antd/es/select";
import { useNavigate } from "react-router-dom";
import { IconWrapper } from "../../../utils/IconWrapper";
import "antd/dist/antd.css";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Add type for form validator
type ValidatorRule = Rule & {
  validator: (_: any, value: Dayjs) => Promise<void>;
};

// Add type for disabled date function
type DisabledDateFn = (current: Dayjs) => boolean;

// Add type for filter option
type FilterOptionType = (input: string, option: { label: string }) => boolean;

interface SelectOption {
  label: string;
  value: number;
}

interface FormData {
  contractor_id: number;
  department_id: number;
  start_date: Dayjs;
  end_date: Dayjs;
}

interface ContractorMappingCreate {
  contractor_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
}

interface Option {
  value: number;
  label: string;
}

const WrappedUserOutlined = IconWrapper(UserOutlined);
const WrappedTeamOutlined = IconWrapper(TeamOutlined);
const WrappedPlusOutlined = IconWrapper(PlusOutlined);

const MappingTab: React.FC = () => {
  const [form] = Form.useForm();
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [mappingsList, setMappingsList] = useState<ContractorMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] =
    useState<ContractorMapping | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const navigate = useNavigate();

  const [alert, setAlert] = useState<{
    open: boolean;
    severity: "error" | "success" | "warning" | "info";
    message: string;
  }>({
    open: false,
    severity: "info",
    message: "",
  });

  const showAlert = (
    message: string,
    severity: "error" | "success" | "warning" | "info" = "info"
  ) => {
    setAlert({ open: true, severity, message });
  };

  // Fetch initial data
  const fetchData = async () => {
    console.log("fetchData called");
    setLoading(true);
    try {
      console.log("Making API calls...");
      const [contractorsRes, departmentsRes, mappingsRes] = await Promise.all([
        contractors.getAll(),
        departments.getAll(),
        mappings.getAll(),
      ]);

      console.log("API responses:", {
        contractors: contractorsRes.data,
        departments: departmentsRes.data,
        mappings: mappingsRes.data,
      });

      // Check if the responses are valid
      if (!Array.isArray(contractorsRes.data)) {
        throw new Error("Invalid contractors data received");
      }

      if (!Array.isArray(departmentsRes.data)) {
        throw new Error("Invalid departments data received");
      }

      if (!Array.isArray(mappingsRes.data)) {
        throw new Error("Invalid mappings data received");
      }

      setContractorsList(contractorsRes.data);
      setDepartmentsList(departmentsRes.data);
      setMappingsList(mappingsRes.data);

      console.log("State updated with:", {
        contractors: contractorsRes.data,
        departments: departmentsRes.data,
        mappings: mappingsRes.data,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      showAlert("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("MappingTab component mounted");
    fetchData();
  }, []);

  const showModal = (department: Department | null) => {
    fetchData();
    console.log("Add Mapping button clicked");
    console.log("Current state:", {
      contractorsList,
      departmentsList,
      mappingsList,
      isModalVisible,
    });

    if (!contractorsList || contractorsList.length === 0) {
      console.log("No contractors available");
      showAlert(
        "Please add contractors first before creating mappings",
        "warning"
      );
      return;
    }
    if (!departmentsList || departmentsList.length === 0) {
      console.log("No departments available");
      showAlert(
        "No departments available. Please contact your administrator.",
        "warning"
      );
      return;
    }
    console.log("Opening modal");
    form.resetFields();
    setSelectedDepartment(department);
    if (department) {
      form.setFieldValue("department_id", department.department_id);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingMapping(null);
    setSelectedDepartment(null);
  };

  const handleDelete = async (contractId: number) => {
    try {
      await mappings.delete(contractId);
      showAlert("Mapping deleted successfully.", "success");
      fetchData();
    } catch (error) {
      showAlert("Failed to delete mapping", "error");
      console.error("Error deleting mapping:", error);
    }
  };

  const handleEdit = (record: ContractorMapping) => {
    setEditingMapping(record);
    form.setFieldsValue({
      contractor_id: record.contractor_id,
      department_id: record.department_id,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    });
    setIsModalVisible(true);
  };

  const validateMapping = (values: any): string | null => {
    console.log("Validating mapping with values:", values);
    console.log("Current mappings:", mappingsList);

    if (!values.contractor_id || !values.department_id) {
      return null;
    }

    // Check if mapping already exists
    const existingMapping = mappingsList.find((mapping) => {
      const isDuplicate =
        Number(mapping.contractor_id) === Number(values.contractor_id) &&
        Number(mapping.department_id) === Number(values.department_id) &&
        mapping.status !== "INACTIVE";

      if (isDuplicate) {
        console.log("Found duplicate mapping:", mapping);
      }

      return isDuplicate;
    });

    if (existingMapping) {
      return `This contractor is already mapped to this department (Status: ${existingMapping.status})`;
    }

    return null;
  };

  const onFinish = async (values: FormData) => {
    try {
      if (!values.start_date || !values.end_date) {
        showAlert("Please select both start and end dates", "error");
        return;
      }

      const formattedValues = {
        contractor_id: values.contractor_id,
        department_id: values.department_id,
        start_date: values.start_date.format("YYYY-MM-DD"),
        end_date: values.end_date.format("YYYY-MM-DD"),
      };

      setSubmitting(true);

      if (editingMapping) {
        await mappings.update(editingMapping.contract_id, formattedValues);
        showAlert("Department mapping updated successfully", "success");
      } else {
        await mappings.create(formattedValues);
        showAlert("Department mapping added successfully", "success");
      }

      setIsModalVisible(false);
      setEditingMapping(null);
      form.resetFields();
      fetchData();
    } catch (error: any) {

      const rawError = error.response?.data?.error;
      const errorMessage =
        (typeof rawError === "string" ? rawError : "") ||
        error.message ||
        "Failed to save mapping";

      if (
        typeof errorMessage === "string" &&
        errorMessage.includes("Date range overlaps")
      ) {
        showAlert(
          "This department already has a contract during the selected date range. Please choose different dates.",
          "error"
        );
      } else {
        showAlert(errorMessage, "error");
      }
      console.error("Error saving mapping:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "green";
      case "INACTIVE":
        return "red";
      case "UPCOMING":
        return "blue";
      default:
        return "default";
    }
  };

  const getDepartmentMappings = (departmentId: number) => {
    return mappingsList.filter((m) => m.department_id === departmentId);
  };

  const getContractorName = (contractorId: number) => {
    const contractor = contractorsList.find(
      (c) => c.contractor_id === contractorId
    );
    return contractor ? contractor.contractor_company_name : "Unknown";
  };

  const columns: TableProps<ContractorMapping>["columns"] = [
    {
      title: "Company Name",
      dataIndex: "contractor_company_name",
      key: "contractor_company_name",
      sorter: (a, b) =>
        a.contractor_company_name.localeCompare(b.contractor_company_name),
    },
    {
      title: "Department",
      dataIndex: "department_name",
      key: "department_name",
      sorter: (a, b) => a.department_name.localeCompare(b.department_name),
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.contract_id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const disabledEndDate: DatePickerProps["disabledDate"] = (current) => {
    if (!current) return false;
    const startDate = form.getFieldValue("start_date");
    return startDate ? current.isBefore(startDate) : false;
  };

  const disabledStartDate: DatePickerProps["disabledDate"] = (current) => {
  if (!current) return false;
  const endDate = form.getFieldValue("end_date");
  return endDate ? current.isAfter(endDate) : false;
};


  return (
    <Card style={{ textAlign: "left" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4}>Department-Contractor Mapping</Title>
          <Button
            type="primary"
            icon={<WrappedPlusOutlined />}
            onClick={() => showModal(null)}
          >
            Add Mapping
          </Button>
        </div>

        <Table
          loading={loading}
          columns={[
            {
              title: "Department",
              dataIndex: "department_id",
              key: "department",
              render: (departmentId) => {
                const dept = departmentsList.find(
                  (d) => d.department_id === departmentId
                );
                return dept ? dept.department_name : "Unknown";
              },
            },
            {
              title: "Contractor",
              dataIndex: "contractor_id",
              key: "contractor",
              render: (contractorId) => getContractorName(contractorId),
            },
            {
              title: "Start Date",
              dataIndex: "start_date",
              key: "start_date",
              render: (date) => dayjs(date).format("DD/MM/YYYY"),
            },
            {
              title: "End Date",
              dataIndex: "end_date",
              key: "end_date",
              render: (date) => dayjs(date).format("DD/MM/YYYY"),
            },
            {
              title: "Status",
              key: "status",
              dataIndex: "status",
              render: (status) => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Space>
                  <Button type="link" onClick={() => handleEdit(record)}>
                    Edit
                  </Button>
                  <Button
                    type="link"
                    danger
                    onClick={() => handleDelete(record.contract_id)}
                  >
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
          dataSource={mappingsList}
          rowKey="contract_id"
        />
      </Space>

      <Modal
        title={editingMapping ? "Edit Mapping" : "Add New Mapping"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="department_id"
            label="Select Department"
            rules={[{ required: true, message: "Please select a department" }]}
          >
            <Select
              showSearch
              placeholder="Select a department"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={departmentsList.map((d) => ({
                value: d.department_id,
                label: d.department_name,
              }))}
              disabled={!!editingMapping}
            />
          </Form.Item>

          <Form.Item
            name="contractor_id"
            label="Select Contractor"
            rules={[{ required: true, message: "Please select a contractor" }]}
          >
            <Select
              showSearch
              placeholder="Select a contractor"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={contractorsList.map((c) => ({
                value: c.contractor_id,
                label: c.contractor_company_name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="start_date"
            label="Start Date"
            rules={[{ required: true, message: "Please select start date" }]}
          >
            <DatePicker style={{ width: "100%" }} disabledDate={disabledStartDate} />

          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date"
            rules={[{ required: true, message: "Please select end date" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={disabledEndDate}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingMapping ? "Update" : "Add"} Mapping
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default MappingTab;
