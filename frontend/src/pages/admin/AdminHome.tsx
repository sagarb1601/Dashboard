import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import ActiveStaffChart from "./Chart Component/ActiveStaffChart";
import SalaryPerDepartmentChart from "./Chart Component/SalaryPerDepartmentChart";
import AMCValueChart from "./Chart Component/AMCValueChart";
import AMCValueByEquipmentChart from "./Chart Component/AMCValueByEquipmentChart";
import ContractsEndingChart from "./Chart Component/ContractsEndingChart";
import InsuranceExpiryChart from "./Chart Component/InsuranceExpiryChart";
import AMCExpiryChart from "./Chart Component/AMCExpiryChart";

const AdminHome = () => {
  return (
    <DashboardLayout>
      <ActiveStaffChart></ActiveStaffChart>
      <SalaryPerDepartmentChart></SalaryPerDepartmentChart>
      <AMCValueChart></AMCValueChart>
      <AMCValueByEquipmentChart></AMCValueByEquipmentChart>
      <ContractsEndingChart></ContractsEndingChart>
      <InsuranceExpiryChart></InsuranceExpiryChart>
      <AMCExpiryChart></AMCExpiryChart>
    </DashboardLayout>
  );
};

export default AdminHome;
