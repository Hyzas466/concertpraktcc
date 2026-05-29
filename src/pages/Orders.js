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
                <TableCell fontWeight="bold">Order ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Ticket Type</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Status</TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No orders found.</TableCell></TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    {/* User: returned as nested object order.User */}
                    <TableCell>{order.User?.full_name || order.user?.full_name || 'User ' + order.user_id}</TableCell>
                    {/* Event: returned as flat string directly on order (not nested) */}
                    <TableCell>{order.Event || order.event || '-'}</TableCell>
                    {/* Ticket Type: returned as flat string: ticket_type / TicketType */}
                    <TableCell>{order.ticket_type || order.TicketType || order.ticketType || '-'}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>Rp {Number(order.total_price).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Chip label={order.payment_status.toUpperCase()} color={getStatusColor(order.payment_status)} size="small" />
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
