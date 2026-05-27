import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Orders from './pages/Orders';
import ScanQR from './pages/ScanQR';
import AdminLayout from './components/AdminLayout';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/events" 
          element={
            <PrivateRoute>
              <AdminLayout>
                <Events />
              </AdminLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/events/:id" 
          element={
            <PrivateRoute>
              <AdminLayout>
                <EventDetail />
              </AdminLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <PrivateRoute>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/scan-qr" 
          element={
            <PrivateRoute>
              <AdminLayout>
                <ScanQR />
              </AdminLayout>
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
