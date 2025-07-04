import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Card, Table, Space, Modal } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { IconWrapper } from "../../../utils/IconWrapper";
import { contractors } from "../../../utils/api";
import { Contractor, contractorSchema } from "../../../types/contractor";
import type { TableProps } from "antd/es/table";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const WrappedEditIcon = IconWrapper(EditOutlined);
const WrappedPlusIcon = IconWrapper(PlusOutlined);
const WrappedDeleteIcon = IconWrapper(DeleteOutlined);

const ContractorsTab: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(
    null
  );

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractorsRes, mappingsRes] = await Promise.all([
        contractors.getAll(),
        mappings.getAll()
      ]);
      setContractorsList(contractorsRes.data);
      checkContractorMappings(mappingsRes.data);
    } catch (error) {
      showAlert("Failed to load contractors", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showModal = (contractor?: Contractor) => {
    form.resetFields();
    if (contractor) {
      setEditingContractor(contractor);
      form.setFieldsValue(contractor);
    } else {
      setEditingContractor(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingContractor(null);
  };

  const onFinish = async (values: any) => {
    try {
      // Validate the data against our schema
      await contractorSchema.validate(values, { abortEarly: false });

      setSubmitting(true);
      if (editingContractor) {
        console.log("Editing contractor:", editingContractor);
        await contractors.update(editingContractor.contractor_id, values);
        showAlert("Contractor updated successfully", "success");
      } else {
        await contractors.create(values);
        showAlert("Contractor added successfully", "success");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingContractor(null);
      fetchData(); // Refresh the table
    } catch (error: any) {
      if (error.name === "ValidationError") {
        console.error(error.errors[0]);
        showAlert(error.errors[0], "error");
      } else {
        showAlert(
          editingContractor
            ? "Failed to update contractor"
            : "Failed to add contractor",
          "error"
        );
        console.error("Error:", error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contractorId: number) => {
    try {
      console.log("Deleting contractor:", contractorId);
      await contractors.delete(contractorId);
      showAlert("Contractor deleted successfully", "success");
      console.log("Contractor deleted, fetching updated list...");
      await fetchContractors();
      console.log("Updated contractors list:", contractorsList);
    } catch (error: any) {
      console.error("Error deleting contractor:", error);
      showAlert("Failed to delete contractor", "error");

      const rawError = error.response?.data?.error;
      const errorMessage =
        (typeof rawError === "string" ? rawError : "") ||
        error.message ||
        "Failed to save mapping";

      if (
        typeof errorMessage === "string" &&
        errorMessage.includes("Contractor is mapped with any department.")
      ) {
        showAlert("Contractor is mapped with any department.", "error");
      } else {
        showAlert(errorMessage, "error");
      }
      console.error("Error saving mapping:", error);
    }
  };

  const columns: TableProps<Contractor>["columns"] = [
    {
      title: "Company Name",
      dataIndex: "contractor_company_name",
      key: "contractor_company_name",
      sorter: (a, b) =>
        a.contractor_company_name.localeCompare(b.contractor_company_name),
    },
    {
      title: "Contact Person",
      dataIndex: "contact_person",
      key: "contact_person",
      sorter: (a, b) => a.contact_person.localeCompare(b.contact_person),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: 'nowrap' }}>
          <Button 
            type="link" 
            onClick={() => showModal(record)}
            icon={<WrappedEditIcon />}
            style={{ padding: '4px 8px' }}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.contractor_id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Contractors Management</h1>
        <Button
          type="primary"
          icon={<WrappedPlusIcon />}
          onClick={() => showModal()}
          style={{
            margin: "0 0 0 5px",
          }}
        >
          Add Contractor
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={contractorsList}
        rowKey="contractor_id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} contractors`
        }}
      />

      <Modal
        title={editingContractor ? "Edit Contractor" : "Add New Contractor"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="contractor_company_name"
            label="Company Name"
            rules={[{ required: true, message: "Please enter company name" }]}
          >
            <Input 
              placeholder="Enter company name"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="contact_person"
            label="Contact Person"
            rules={[{ required: true, message: "Please enter contact person" }]}
          >
            <Input 
              placeholder="Enter contact person name"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please enter phone number" },
              {
                pattern:
                  /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
                message: "Please enter a valid phone number",
              },
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input 
              placeholder="Enter phone number" 
              maxLength={15}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Please enter a valid email" }]}
          >
            <Input 
              type="email" 
              placeholder="Enter email address"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingContractor ? "Update Contractor" : "Add Contractor"}
              </Button>
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
    </div>
  );
};

export default ContractorsTab;
