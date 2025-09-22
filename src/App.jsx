import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth-context';
import Login       from './pages/Login';
import Onboarding  from './pages/Onboarding';
import Dashboard   from './pages/Dashboard';
import Profile from './pages/Profile';
import ServiceBanner from './components/ServiceBanner';

function Protected({ children }) {
    const { user } = useAuth();
    // si no hay usuario, redirige (cambia URL) a /login
    return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ServiceBanner />
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login"       element={<Login />} />
                    <Route path="/onboarding"  element={<Protected><Onboarding /></Protected>} />
                    <Route path="/dashboard"   element={<Protected><Dashboard  /></Protected>} />
                    <Route path="/profile"   element={<Protected><Profile   /></Protected>} />
                    {/* 404: cualquier otra URL */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
