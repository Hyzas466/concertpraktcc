import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Card, CardContent, Button, Box, CircularProgress, Alert, Grid } from '@mui/material';
import { CameraAlt as CameraIcon, Image as UploadIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

const ScanQR = () => {
  const [mode, setMode] = useState(null); // null (menu selection), 'camera'
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const qrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop scanning on unmount
      if (qrCodeRef.current && qrCodeRef.current.isScanning) {
        qrCodeRef.current.stop().catch(err => console.error("Unmount cleanup error:", err));
      }
    };
  }, []);

  const startCamera = async () => {
    setMode('camera');
    setError('');
    setSuccess('');
    setScanResult(null);
    
    // Allow React a tick to mount the <div id="reader"> element
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        qrCodeRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Successful QR code scan
            stopCamera();
            setMode(null);
            handleValidateQR(decodedText);
          },
          (errorMessage) => {
            // Verbose error, ignore
          }
        );
      } catch (err) {
        console.error("Failed to start camera:", err);
        setError("Gagal mengakses kamera. Pastikan Anda memberikan izin kamera.");
        setMode(null);
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop camera:", err);
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode("file-reader-dummy");
      const decodedText = await html5QrCode.scanFile(file, true);
      console.log('QR decoded from file:', decodedText);
      await handleValidateQR(decodedText);
    } catch (err) {
      console.error("Failed to scan file:", err);
      setError("Gagal mendeteksi QR Code dari gambar. Pastikan gambar memiliki QR Code yang jelas.");
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleValidateQR = async (qrCode) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Trim whitespace and encode for URL safety
    const cleanQR = qrCode.trim();
    console.log('Validating QR code:', cleanQR);
    
    try {
      const response = await api.get(`/attendees/qr/${encodeURIComponent(cleanQR)}`);
      if (response.data.success) {
        setScanResult(response.data.data);
        if (response.data.data.check_in_status === 'checked_in') {
          setError('Tiket sudah pernah digunakan (Checked In)!');
        } else {
          setSuccess('Tiket valid dan siap check-in.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memvalidasi QR Code atau Tiket Tidak Ditemukan');
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scanResult) return;
    
    setLoading(true);
    try {
      const response = await api.put(`/attendees/checkin/${encodeURIComponent(scanResult.qr_code)}`);
      if (response.data.success) {
        setSuccess('Berhasil Check-In!');
        setScanResult({ ...scanResult, check_in_status: 'checked_in' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal Check-In');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Scanner Tiket (Gate Keeper)
        </Typography>
        
        {/* Dummy element required by html5-qrcode for file scanning - must not be display:none */}
        <div id="file-reader-dummy" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}></div>

        {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2, mb: 2 }}>{success}</Alert>}
        
        {loading && (
          <Box display="flex" justifyContent="center" m={2}>
            <CircularProgress />
          </Box>
        )}

        {/* 1. SELECTION MENU */}
        {mode === null && !scanResult && (
          <Card sx={{ p: 4, mt: 2, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" align="center" gutterBottom sx={{ mb: 4 }}>
              Pilih metode pemindaian kode QR tiket:
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<CameraIcon sx={{ fontSize: 40 }} />}
                  onClick={startCamera}
                  sx={{ py: 4, borderRadius: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Typography variant="button" fontSize="1.1rem" fontWeight="bold">
                    Scan via Kamera
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="secondary"
                  component="label"
                  fullWidth
                  size="large"
                  startIcon={<UploadIcon sx={{ fontSize: 40 }} />}
                  sx={{ py: 4, borderRadius: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Typography variant="button" fontSize="1.1rem" fontWeight="bold">
                    Unggah Gambar QR
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>
            </Grid>
          </Card>
        )}

        {/* 2. CAMERA RUNNING VIEW */}
        {mode === 'camera' && !scanResult && (
          <Card sx={{ mt: 2, p: 2, borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Pemindaian Kamera Aktif</Typography>
                <Button 
                  startIcon={<BackIcon />} 
                  variant="outlined" 
                  onClick={async () => {
                    await stopCamera();
                    setMode(null);
                  }}
                >
                  Kembali
                </Button>
              </Box>
              <Box 
                id="reader" 
                sx={{ 
                  width: '100%', 
                  maxWidth: '500px', 
                  margin: '0 auto', 
                  borderRadius: 3, 
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                  bgcolor: 'black'
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* 3. SCAN RESULT VIEW */}
        {scanResult && (
          <Card sx={{ mt: 2, borderRadius: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                Detail Tiket Hasil Scan
              </Typography>
              
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body1"><b>Nama Pembeli:</b> {scanResult.User?.full_name || 'Tidak diketahui'}</Typography>
                <Typography variant="body1"><b>Email:</b> {scanResult.User?.email || '-'}</Typography>
                <Typography variant="body1"><b>Event:</b> {scanResult.Event?.title || '-'}</Typography>
                <Typography variant="body1"><b>Kategori Tiket:</b> {scanResult.Ticket?.category || '-'}</Typography>
                <Typography variant="body1" sx={{ mt: 1, color: scanResult.check_in_status === 'checked_in' ? 'red' : 'green', fontWeight: 'bold' }}>
                  Status Tiket: {scanResult.check_in_status === 'checked_in' ? 'SUDAH DIGUNAKAN' : 'BELUM DIGUNAKAN'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                {scanResult.check_in_status !== 'checked_in' && (
                  <Button variant="contained" color="success" size="large" onClick={handleCheckIn} disabled={loading}>
                    Konfirmasi Check-In
                  </Button>
                )}
                <Button 
                  variant="outlined" 
                  size="large" 
                  onClick={() => {
                    setScanResult(null);
                    setError('');
                    setSuccess('');
                    setMode(null);
                  }}
                >
                  Scan Tiket Lain
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default ScanQR;
