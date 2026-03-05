import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandCenterProvider } from './context/CommandCenterContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Revenue from './pages/Revenue';
import Venues from './pages/Venues';
import Ads from './pages/Ads';
import Events from './pages/Events';
import Reports from './pages/Reports';
import Moderation from './pages/Moderation';
import Safety from './pages/Safety';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Map from './pages/Map';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<CommandCenterProvider><Layout /></CommandCenterProvider>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/events" element={<Events />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/moderation" element={<Moderation />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/map" element={<Map />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
