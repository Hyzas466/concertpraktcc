import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Paper, Button, Grid, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Chip,
  FormControl, InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, ticketsAPI } from '../services/api';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ticket Form State
  const [openModal, setOpenModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ id: null, category: '', price: '', quota: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(id);
      setEvent(response.data.data);
    } catch (err) {
      console.error('Failed to fetch event details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleSaveTicket = async () => {
    try {
      if (isEditing) {
        await ticketsAPI.update(ticketForm.id, {
          category: ticketForm.category,
          price: parseFloat(ticketForm.price),
          quota: parseInt(ticketForm.quota),
          description: ticketForm.description
        });
      } else {
        await ticketsAPI.create(id, {
          category: ticketForm.category,
          price: parseFloat(ticketForm.price),
          quota: parseInt(ticketForm.quota),
          description: ticketForm.description
        });
      }
      setOpenModal(false);
      setTicketForm({ id: null, category: '', price: '', quota: '', description: '' });
      setIsEditing(false);
      fetchEventDetails(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save ticket');
    }
  };

  const handleEditTicket = (ticket) => {
    setTicketForm({
      id: ticket.id,
      category: ticket.category,
      price: ticket.price,
      quota: ticket.quota,
      description: ticket.description
    });
    setIsEditing(true);
    setOpenModal(true);
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan/menghapus penjualan tiket ini?")) {
      try {
        await ticketsAPI.delete(ticketId);
        fetchEventDetails();
      } catch (err) {
        alert('Gagal menghapus tiket');
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus EVENT INI? Seluruh tiket juga akan terhapus!")) {
      try {
        await eventsAPI.delete(id);
        navigate('/events');
      } catch (err) {
        alert('Gagal menghapus event');
      }
    }
  };

  const handlePublishEvent = async () => {
    try {
      await eventsAPI.update(id, { ...event, status: 'published' });
      fetchEventDetails(); // Refresh
    } catch (err) {
      alert('Failed to publish event');
    }
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!event) return <Container><Typography mt={4}>Event not found</Typography></Container>;

  return (
    <Container maxWidth="lg">
      <Button onClick={() => navigate('/events')} sx={{ mb: 2 }}>&larr; Back to Events</Button>
      
      <Grid container spacing={3}>
        {/* Event Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>{event.title}</Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Chip label={event.status.toUpperCase()} color={event.status === 'published' ? 'success' : 'default'} />
              {event.status === 'draft' && (
                <Button variant="outlined" size="small" onClick={handlePublishEvent}>
                  Publish
                </Button>
              )}
              <Button variant="outlined" color="error" size="small" onClick={handleDeleteEvent}>
                Delete Event
              </Button>
            </Box>
            
            <Typography variant="body2" color="textSecondary" gutterBottom>Venue</Typography>
            <Typography variant="body1" gutterBottom>{event.venue}</Typography>
            
            <Typography variant="body2" color="textSecondary" gutterBottom>Date</Typography>
            <Typography variant="body1" gutterBottom>{new Date(event.event_date).toLocaleString()}</Typography>
            
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="textSecondary" gutterBottom>Description</Typography>
            <Typography variant="body2">{event.description}</Typography>
          </Paper>
        </Grid>

        {/* Tickets Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">Ticket Categories</Typography>
              <Button variant="contained" color="primary" onClick={() => {
                setTicketForm({ id: null, category: '', price: '', quota: '', description: '' });
                setIsEditing(false);
                setOpenModal(true);
              }}>
                + Add Ticket
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Quota</TableCell>
                    <TableCell>Sold</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {event.Tickets && event.Tickets.length > 0 ? (
                    event.Tickets.map(ticket => (
                      <TableRow key={ticket.id}>
                        <TableCell fontWeight="bold">{ticket.category}</TableCell>
                        <TableCell>Rp {Number(ticket.price).toLocaleString('id-ID')}</TableCell>
                        <TableCell>{ticket.quota}</TableCell>
                        <TableCell>{ticket.sold}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="primary" onClick={() => handleEditTicket(ticket)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteTicket(ticket.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} align="center">No tickets created yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Create/Edit Ticket Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Ticket Category' : 'Add Ticket Category'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={ticketForm.category}
                label="Category"
                onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
              >
                <MenuItem value="VVIP">VVIP</MenuItem>
                <MenuItem value="VIP">VIP</MenuItem>
                <MenuItem value="Reguler">Reguler</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Price (Rp)" type="number" fullWidth value={ticketForm.price} onChange={(e) => setTicketForm({...ticketForm, price: e.target.value})} />
            <TextField label="Total Quota" type="number" fullWidth value={ticketForm.quota} onChange={(e) => setTicketForm({...ticketForm, quota: e.target.value})} />
            <TextField label="Description" multiline rows={2} fullWidth value={ticketForm.description} onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleSaveTicket} variant="contained" disabled={!ticketForm.category || !ticketForm.price || !ticketForm.quota}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default EventDetail;
