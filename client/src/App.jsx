import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/common/RouteGuards.jsx';
import UserLayout from './components/layout/UserLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

import Home from './pages/public/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

import Dashboard from './pages/user/Dashboard.jsx';
import Vehicles from './pages/user/Vehicles.jsx';
import Parking from './pages/user/Parking.jsx';
import Reservations from './pages/user/Reservations.jsx';
import ReservationDetail from './pages/user/ReservationDetail.jsx';
import ActiveParking from './pages/user/ActiveParking.jsx';
import BillPage from './pages/user/BillPage.jsx';
import ParkingHistory from './pages/user/ParkingHistory.jsx';
import PaymentHistory from './pages/user/PaymentHistory.jsx';
import Profile from './pages/user/Profile.jsx';
import PaymentPage from './pages/payment/PaymentPage.jsx';
import PaymentSuccess from './pages/payment/PaymentSuccess.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageFloors from './pages/admin/ManageFloors.jsx';
import ManageZones from './pages/admin/ManageZones.jsx';
import ManageSlots from './pages/admin/ManageSlots.jsx';
import ManageRates from './pages/admin/ManageRates.jsx';
import ManageReservations from './pages/admin/ManageReservations.jsx';
import ManageSessions from './pages/admin/ManageSessions.jsx';
import ManagePayments from './pages/admin/ManagePayments.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import Reports from './pages/admin/Reports.jsx';

import NotFound from './pages/errors/NotFound.jsx';
import Unauthorized from './pages/errors/Unauthorized.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<UserLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="parking" element={<Parking />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="reservations/:id" element={<ReservationDetail />} />
          <Route path="active" element={<ActiveParking />} />
          <Route path="bill/:sessionId" element={<BillPage />} />
          <Route path="pay/:sessionId" element={<PaymentPage />} />
          <Route path="success/:paymentId" element={<PaymentSuccess />} />
          <Route path="history" element={<ParkingHistory />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="floors" element={<ManageFloors />} />
          <Route path="zones" element={<ManageZones />} />
          <Route path="slots" element={<ManageSlots />} />
          <Route path="rates" element={<ManageRates />} />
          <Route path="reservations" element={<ManageReservations />} />
          <Route path="sessions" element={<ManageSessions />} />
          <Route path="payments" element={<ManagePayments />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
