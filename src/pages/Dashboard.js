import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Paper, CircularProgress } from '@mui/material';
import { Event as EventIcon, ConfirmationNumber as TicketIcon } from '@mui/icons-material';
import { eventsAPI, ordersAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({ events: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eventsRes, ordersRes] = await Promise.all([
          eventsAPI.getAll(),
          ordersAPI.getAll()
        ]);
        
        const eventsCount = eventsRes.data.data.length;
        const ordersData = ordersRes.data.data;
        
        // Calculate Revenue from paid orders
        const totalRevenue = ordersData
          .filter(o => o.payment_status === 'paid')
          .reduce((sum, order) => sum + Number(order.total_price), 0);

        setStats({
          events: eventsCount,
          orders: ordersData.length,
          revenue: totalRevenue
        });
      } catch (err) {
        console.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">Dashboard Overview</Typography>
        <Typography variant="subtitle1" color="textSecondary">Welcome back to Concert Admin Panel!</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 2, bgcolor: 'primary.light', color: 'white' }}>
            <EventIcon sx={{ fontSize: 60, mr: 2 }} />
            <Box>
              <Typography variant="h6">Total Events</Typography>
              <Typography variant="h3" fontWeight="bold">{stats.events}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 2, bgcolor: 'secondary.light', color: 'white' }}>
            <TicketIcon sx={{ fontSize: 60, mr: 2 }} />
            <Box>
              <Typography variant="h6">Total Orders</Typography>
              <Typography variant="h3" fontWeight="bold">{stats.orders}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 2, bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="h4" sx={{ mr: 2, fontWeight: 'bold' }}>Rp</Typography>
            <Box>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.revenue.toLocaleString('id-ID')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
