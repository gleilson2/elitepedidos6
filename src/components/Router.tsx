import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryPage from './Delivery/DeliveryPage';
import OrderTrackingPage from './Customer/OrderTrackingPage';
import OrderLookup from './Customer/OrderLookup';
import CustomerCashbackPage from './Customer/CustomerCashbackPage';
import AdminPage from './Admin/AdminPage';
import AttendancePage from './AttendancePage';
import Store2AttendancePage from './Store2/Store2AttendancePage';
import AccessDeniedPage from './AccessDeniedPage';
import { useState } from 'react';
import PDVLogin from './PDV/PDVLogin';
import PDVMain from './PDV/PDVMain';
import { PDVOperator } from '../types/pdv';
import NotFoundPage from './NotFoundPage';
import DeliveryLogin from './DeliveryDriver/DeliveryLogin';
import DeliveryOrdersPage from './DeliveryDriver/DeliveryOrdersPage';
import ProtectedRoute from './DeliveryDriver/ProtectedRoute';
import Store2ReportsPage from './Store2/Store2ReportsPage';
import Store2ManagementPage from './Store2/Store2ManagementPage';

const Router: React.FC = () => {
  // Solicitar permissão para notificações ao iniciar o app
  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      // Solicitar permissão
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
      });
    }
  }, []);

  const [loggedInOperator, setLoggedInOperator] = useState<PDVOperator | null>(null);

  const handlePDVLogin = (operator: PDVOperator) => {
    setLoggedInOperator(operator);
    localStorage.setItem('pdv_operator', JSON.stringify(operator));
    window.location.href = '/pdv/app'; 
  };

  const handlePDVLogout = () => {
    setLoggedInOperator(null);
    localStorage.removeItem('pdv_operator');
    window.location.href = '/pdv';
  };
  
  // Check for stored operator on component mount
  useEffect(() => {
    const storedOperator = localStorage.getItem('pdv_operator');
    if (storedOperator) {
      try {
        const operator = JSON.parse(storedOperator);
        setLoggedInOperator(operator);
      } catch (error) {
        console.error('Error parsing stored operator:', error);
        localStorage.removeItem('pdv_operator');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeliveryPage />} />
        <Route path="/buscar-pedido" element={<OrderLookup />} />
        <Route path="/pedido/:orderId" element={<OrderTrackingPage />} />
        <Route path="/meu-cashback" element={<CustomerCashbackPage />} />
        <Route path="/atendimento" element={<AttendancePage />} />
        <Route path="/administrativo" element={<AdminPage />} />
        <Route path="/acesso-negado" element={<AccessDeniedPage />} />
        <Route path="/pdv" element={loggedInOperator ? <PDVMain onBack={handlePDVLogout} operator={loggedInOperator} /> : <PDVLogin onLogin={handlePDVLogin} />} />
        <Route path="/pdv/app" element={loggedInOperator ? <PDVMain onBack={handlePDVLogout} operator={loggedInOperator} /> : <PDVLogin onLogin={handlePDVLogin} />} />
        <Route path="/login" element={<DeliveryLogin />} />
        <Route path="/entregas" element={
          <ProtectedRoute>
            <DeliveryOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/atendimento2" element={<Store2AttendancePage />} />
        <Route path="/relatorios_loja2" element={<Store2ReportsPage />} />
        <Route path="/gerenciamento_loja2" element={<Store2ManagementPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;