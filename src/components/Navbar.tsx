import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Shield, Wallet, LogOut, ChevronDown } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { wallet, connectWallet, disconnectWallet, isLoading } = useWallet();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = React.useState(false);

    const isActive = (path: string) => location.pathname === path;

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <Shield size={24} />
                    </div>
                    <span className="logo-text">BitWill</span>
                </Link>

                <div className="navbar-links">
                    {wallet.isConnected && (
                        <>
                            <Link
                                to="/dashboard"
                                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/create"
                                className={`navbar-link ${isActive('/create') ? 'active' : ''}`}
                            >
                                Create Vault
                            </Link>
                            <Link
                                to="/claim"
                                className={`navbar-link ${isActive('/claim') ? 'active' : ''}`}
                            >
                                Claim
                            </Link>
                        </>
                    )}
                </div>

                <div className="navbar-actions">
                    {wallet.isConnected ? (
                        <div className="wallet-info">
                            <div className="wallet-balance">
                                <span className="balance-label">Balance</span>
                                <span className="balance-value">{wallet.balance.toFixed(4)} BTC</span>
                            </div>
                            <div
                                className="wallet-address-container"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <div className="wallet-address">
                                    <Wallet size={16} />
                                    <span>{formatAddress(wallet.address!)}</span>
                                    <ChevronDown size={16} />
                                </div>
                                {showDropdown && (
                                    <div className="wallet-dropdown">
                                        <div className="dropdown-address">
                                            <span className="dropdown-label">Full Address</span>
                                            <span className="dropdown-value">{wallet.address}</span>
                                        </div>
                                        <button
                                            className="dropdown-disconnect"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                disconnectWallet();
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <LogOut size={16} />
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary connect-btn"
                            onClick={connectWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading-spinner" />
                            ) : (
                                <>
                                    <Wallet size={18} />
                                    Connect Wallet
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
