import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
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
  Cell
} from 'recharts';
import { Business, People, ShoppingCart, AttachMoney, TrendingUp, AccountBalance } from '@mui/icons-material';
import { api } from '../../../services/api';

interface BusinessSummary {
  total_clients: number;
  total_entities: number;
  total_purchase_orders: number;
  total_order_value: number;
  total_invoice_value: number;
  total_payments_received: number;
}

interface MonthlyData {
  month: string;
  entity_count?: number;
  po_count?: number;
  total_invoice_value?: number;
  total_payment_amount?: number;
}

interface DistributionData {
  entity_type?: string;
  invoice_status?: string;
  entity_count?: number;
  po_count?: number;
  total_revenue?: number;
}

interface TopClient {
  client_name: string;
  total_order_value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const BusinessDashboardTab: React.FC = () => {
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [entitiesPerMonth, setEntitiesPerMonth] = useState<MonthlyData[]>([]);
  const [purchaseOrdersPerMonth, setPurchaseOrdersPerMonth] = useState<MonthlyData[]>([]);
  const [invoiceValuePerMonth, setInvoiceValuePerMonth] = useState<MonthlyData[]>([]);
  const [paymentsPerMonth, setPaymentsPerMonth] = useState<MonthlyData[]>([]);
  const [entitiesByType, setEntitiesByType] = useState<DistributionData[]>([]);
  const [purchaseOrdersByStatus, setPurchaseOrdersByStatus] = useState<DistributionData[]>([]);
  const [revenueByEntityType, setRevenueByEntityType] = useState<DistributionData[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        summaryRes,
        entitiesPerMonthRes,
        purchaseOrdersPerMonthRes,
        invoiceValuePerMonthRes,
        paymentsPerMonthRes,
        entitiesByTypeRes,
        purchaseOrdersByStatusRes,
        revenueByEntityTypeRes,
        topClientsRes
      ] = await Promise.all([
        api.get('/business/dashboard/summary'),
        api.get('/business/dashboard/entities-per-month'),
        api.get('/business/dashboard/purchase-orders-per-month'),
        api.get('/business/dashboard/invoice-value-per-month'),
        api.get('/business/dashboard/payments-per-month'),
        api.get('/business/dashboard/entities-by-type'),
        api.get('/business/dashboard/purchase-orders-by-status'),
        api.get('/business/dashboard/revenue-by-entity-type'),
        api.get('/business/dashboard/top-clients-by-order-value')
      ]);

      setSummary(summaryRes.data);
      setEntitiesPerMonth(entitiesPerMonthRes.data);
      setPurchaseOrdersPerMonth(purchaseOrdersPerMonthRes.data);
      setInvoiceValuePerMonth(invoiceValuePerMonthRes.data);
      setPaymentsPerMonth(paymentsPerMonthRes.data);
      setEntitiesByType(entitiesByTypeRes.data);
      setPurchaseOrdersByStatus(purchaseOrdersByStatusRes.data);
      setRevenueByEntityType(revenueByEntityTypeRes.data);
      setTopClients(topClientsRes.data);
    } catch (err) {
      console.error('Error fetching business dashboard data:', err);
      setError('Failed to load business dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCrore = (value: number) => {
    if (!value) return '₹0';
    return `₹${(value / 1e7).toFixed(2)} Cr`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold' }}>
        Business Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatNumber(summary?.total_clients || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Business sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                {formatNumber(summary?.total_entities || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Business Entities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 40, color: '#ed6c02', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>
                {formatNumber(summary?.total_purchase_orders || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Purchase Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 40, color: '#9c27b0', mb: 1, fontWeight: 'bold' }}>₹</Typography>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                {formatCrore(summary?.total_order_value || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Order Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: '#d32f2f', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                {formatCrore(summary?.total_invoice_value || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invoice Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 40, color: '#388e3c', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                {formatCrore(summary?.total_payments_received || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payments Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Entities per Month
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={entitiesPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Entities']} />
                  <Bar dataKey="entity_count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Purchase Orders per Month
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchaseOrdersPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Purchase Orders']} />
                  <Bar dataKey="po_count" fill="#ed6c02" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Value per Month
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={invoiceValuePerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCrore(Number(value)), 'Invoice Value']} />
                  <Line type="monotone" dataKey="total_invoice_value" stroke="#d32f2f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payments Received per Month
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCrore(Number(value)), 'Payments']} />
                  <Line type="monotone" dataKey="total_payment_amount" stroke="#388e3c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 3 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Entities by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={entitiesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ entity_type, percent }) => `${entity_type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="entity_count"
                  >
                    {entitiesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Entities']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Purchase Orders by Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={purchaseOrdersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ invoice_status, percent }) => `${invoice_status} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="po_count"
                  >
                    {purchaseOrdersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Purchase Orders']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Entity Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByEntityType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ entity_type, percent }) => `${entity_type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_revenue"
                  >
                    {revenueByEntityType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCrore(Number(value)), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Clients Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Clients by Order Value
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Client Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Order Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topClients.map((client, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{client.client_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                          {formatCrore(client.total_order_value)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topClients.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessDashboardTab; 