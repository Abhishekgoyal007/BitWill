import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import VaultCard from '../components/VaultCard';
import {
    Plus,
    Shield,
    AlertCircle,
    TrendingUp,
    Vault,
    Clock,
    Wallet
} from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { wallet, vaults, checkIn } = useWallet();
    const navigate = useNavigate();
    const [checkingInVaultId, setCheckingInVaultId] = useState<string | null>(null);

    // Filter vaults for current user
    const myVaults = vaults.filter(v => v.ownerAddress === wallet.address);

    // Calculate stats
    const totalLocked = myVaults.reduce((sum, v) => sum + v.amount, 0);
    const activeVaults = myVaults.filter(v => v.status === 'active' || v.status === 'warning').length;
    const warningVaults = myVaults.filter(v => v.status === 'warning');

    const handleCheckIn = async (vaultId: string) => {
        setCheckingInVaultId(vaultId);
        await checkIn(vaultId);
        setCheckingInVaultId(null);
    };

    const handleViewDetails = (vaultId: string) => {
        navigate(`/vault/${vaultId}`);
    };

    if (!wallet.isConnected) {
        return (
            <div className="dashboard-page">
                <div className="container">
                    <div className="connect-prompt">
                        <Shield size={64} className="prompt-icon" />
                        <h2>Connect Your Wallet</h2>
                        <p>Connect your wallet to view and manage your inheritance vaults.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>Dashboard</h1>
                        <p>Manage your Bitcoin inheritance vaults</p>
                    </div>
                    <Link to="/create" className="btn btn-gold">
                        <Plus size={20} />
                        Create Vault
                    </Link>
                </div>

                {/* Warning Banner */}
                {warningVaults.length > 0 && (
                    <div className="warning-banner">
                        <AlertCircle size={20} />
                        <div className="warning-content">
                            <strong>{warningVaults.length} vault{warningVaults.length > 1 ? 's' : ''} need attention!</strong>
                            <span>Check in soon to prevent automatic transfer to beneficiaries.</span>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Wallet size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Locked</span>
                            <span className="stat-value gold">{totalLocked.toFixed(4)} BTC</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Vault size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Active Vaults</span>
                            <span className="stat-value">{activeVaults}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Need Check-in</span>
                            <span className="stat-value warning">{warningVaults.length}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Wallet Balance</span>
                            <span className="stat-value">{wallet.balance.toFixed(4)} BTC</span>
                        </div>
                    </div>
                </div>

                {/* Vaults Section */}
                <div className="vaults-section">
                    <h2 className="section-title">Your Vaults</h2>

                    {myVaults.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Shield size={48} />
                            </div>
                            <h3>No Vaults Yet</h3>
                            <p>Create your first vault to protect your Bitcoin legacy.</p>
                            <Link to="/create" className="btn btn-primary">
                                <Plus size={20} />
                                Create Your First Vault
                            </Link>
                        </div>
                    ) : (
                        <div className="vaults-grid">
                            {myVaults.map((vault) => (
                                <VaultCard
                                    key={vault.id}
                                    vault={vault}
                                    onCheckIn={handleCheckIn}
                                    onViewDetails={handleViewDetails}
                                    isLoading={checkingInVaultId === vault.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
