import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateVault from './pages/CreateVault';
import VaultDetail from './pages/VaultDetail';
import Claim from './pages/Claim';
import './index.css';

function App() {
    return (
        <WalletProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create" element={<CreateVault />} />
                    <Route path="/vault/:id" element={<VaultDetail />} />
                    <Route path="/claim" element={<Claim />} />
                </Routes>
            </Router>
        </WalletProvider>
    );
}

export default App;
