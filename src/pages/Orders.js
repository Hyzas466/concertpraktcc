import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, CircularProgress
} from '@mui/material';
import { ordersAPI } from '../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMarkPaid = async (id) => {
    try {
      await ordersAPI.updatePayment(id, { status: 'paid' });
      fetchOrders(); // Refresh list
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'default': return 'default';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">Orders Management</Typography>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>Order ID</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>User</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Event</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Ticket Type</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Qty</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Total Price</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No orders found.</TableCell></TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    
                    {/* User */}
                    <TableCell>{order.User?.full_name || order.user?.full_name || 'User ' + order.user_id}</TableCell>
                    
                    {/* Event (Diperbaiki agar membaca objek/string dengan aman) */}
                    <TableCell>
                      {typeof order.Event === 'object' ? order.Event?.title : (order.Event || order.event || '-')}
                    </TableCell>
                    
                    {/* Ticket Type (Diperbaiki agar mengambil kategori dari objek Ticket) */}
                    <TableCell>
                      {order.Ticket?.category || order.ticket_type || order.TicketType || '-'}
                    </TableCell>
                    
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>Rp {Number(order.total_price).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'} 
                        color={getStatusColor(order.payment_status)} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Container>
  );
}

export default Orders;