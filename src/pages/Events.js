import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';

function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', venue: '', event_date: '', description: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll();
      setEvents(response.data.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async () => {
    try {
      await eventsAPI.create(formData);
      setOpenModal(false);
      setFormData({ title: '', venue: '', event_date: '', description: '' });
      fetchEvents();
    } catch (err) {
      alert('Failed to create event');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Events Management</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
          + Create New Event
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell fontWeight="bold">Title</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No events found.</TableCell></TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell fontWeight="bold">{event.title}</TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell>{new Date(event.event_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={event.status.toUpperCase()} 
                        color={event.status === 'published' ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Create Event Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Event Title" fullWidth value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <TextField label="Venue" fullWidth value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} />
            <TextField 
              label="Event Date" 
              type="datetime-local" 
              fullWidth 
              InputLabelProps={{ shrink: true }}
              value={formData.event_date} 
              onChange={(e) => setFormData({...formData, event_date: e.target.value})} 
            />
            <TextField label="Description" multiline rows={3} fullWidth value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.title || !formData.venue || !formData.event_date}>Save Event</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Events;
