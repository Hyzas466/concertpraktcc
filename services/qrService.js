const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate QR code dan simpan ke folder lokal
 */
async function generateQRCode(orderId, attendeeId) {
  try {
    // Generate unique QR string
    const qrString = `${orderId}-${attendeeId}-${crypto.randomBytes(8).toString('hex')}`;
    
    // Create directory if not exists
    const uploadDir = path.join(__dirname, '../../uploads/qrcodes', orderId.toString());
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate QR code to file
    const fileName = `${attendeeId}.png`;
    const filePath = path.join(uploadDir, fileName);
    
    await QRCode.toFile(filePath, qrString, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 500,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate public URL (untuk akses via browser)
    const publicUrl = `/uploads/qrcodes/${orderId}/${fileName}`;

    return {
      qrCode: qrString,
      qrImageUrl: publicUrl
    };
  } catch (error) {
    console.error('QR Generation Error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate QR code
 */
async function validateQRCode(qrString) {
  // QR format: orderId-attendeeId-randomhex
  const parts = qrString.split('-');
  
  if (parts.length !== 3) {
    return { valid: false, message: 'Invalid QR format' };
  }

  return {
    valid: true,
    orderId: parseInt(parts[0]),
    attendeeId: parseInt(parts[1])
  };
}

module.exports = {
  generateQRCode,
  validateQRCode
};
