import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Shield, Wallet, LogOut, ChevronDown, Wifi, WifiOff, X, Bitcoin, TestTube } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { wallet, connectWallet, disconnectWallet, isLoading, isWalletAvailable, refreshBalance, error, clearError } = useWallet();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const handleConnectClick = () => {
        setShowWalletModal(true);
    };

    const handleWalletConnect = async (useRealWallet: boolean) => {
        setShowWalletModal(false);
        await connectWallet(useRealWallet);
    };

    const getNetworkBadge = () => {
        if (!wallet.isConnected) return null;

        const isTestnet = wallet.network === 'Testnet' || wallet.network === 'Signet';
        return (
            <span className={`network-badge ${isTestnet ? 'testnet' : 'mainnet'}`}>
                {isTestnet ? <TestTube size={12} /> : <Bitcoin size={12} />}
                {wallet.network}
            </span>
        );
    };

    const getWalletTypeBadge = () => {
        if (!wallet.isConnected) return null;

        return (
            <span className={`wallet-type-badge ${wallet.isRealWallet ? 'real' : 'demo'}`}>
                {wallet.isRealWallet ? (
                    <>
                        <Wifi size={12} />
                        {wallet.walletType === 'xverse' ? 'Xverse' : 'Connected'}
                    </>
                ) : (
                    <>
                        <WifiOff size={12} />
                        Demo Mode
                    </>
                )}
            </span>
        );
    };

    return (
        <>
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
                                <div className="wallet-status">
                                    {getNetworkBadge()}
                                    {getWalletTypeBadge()}
                                </div>
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
                                        <ChevronDown size={16} className={showDropdown ? 'rotated' : ''} />
                                    </div>
                                    {showDropdown && (
                                        <div className="wallet-dropdown">
                                            <div className="dropdown-address">
                                                <span className="dropdown-label">Payment Address</span>
                                                <span className="dropdown-value">{wallet.address}</span>
                                            </div>
                                            {wallet.ordinalsAddress && (
                                                <div className="dropdown-address">
                                                    <span className="dropdown-label">Ordinals Address</span>
                                                    <span className="dropdown-value">{wallet.ordinalsAddress}</span>
                                                </div>
                                            )}
                                            <div className="dropdown-balance">
                                                <span className="dropdown-label">Balance</span>
                                                <span className="dropdown-value">
                                                    {wallet.balance.toFixed(8)} BTC
                                                    <span className="sats-value">({wallet.balanceSats.toLocaleString()} sats)</span>
                                                </span>
                                            </div>
                                            {wallet.isRealWallet && (
                                                <button
                                                    className="dropdown-refresh"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        refreshBalance();
                                                    }}
                                                >
                                                    Refresh Balance
                                                </button>
                                            )}
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
                                onClick={handleConnectClick}
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

            {/* Wallet Selection Modal */}
            {showWalletModal && (
                <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
                    <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowWalletModal(false)}>
                            <X size={20} />
                        </button>
                        <h2 className="modal-title">Connect Wallet</h2>
                        <p className="modal-subtitle">Choose how you want to connect</p>

                        <div className="wallet-options">
                            {isWalletAvailable() ? (
                                <button
                                    className="wallet-option real-wallet"
                                    onClick={() => handleWalletConnect(true)}
                                    disabled={isLoading}
                                >
                                    <div className="wallet-option-icon xverse">
                                        <Bitcoin size={32} />
                                    </div>
                                    <div className="wallet-option-info">
                                        <span className="wallet-option-name">Xverse Wallet</span>
                                        <span className="wallet-option-desc">Connect with your real Bitcoin wallet</span>
                                    </div>
                                    <span className="wallet-option-badge recommended">Recommended</span>
                                </button>
                            ) : (
                                <div className="wallet-option disabled">
                                    <div className="wallet-option-icon xverse">
                                        <Bitcoin size={32} />
                                    </div>
                                    <div className="wallet-option-info">
                                        <span className="wallet-option-name">Xverse Wallet</span>
                                        <span className="wallet-option-desc">
                                            Wallet not detected.
                                            <a href="https://www.xverse.app/" target="_blank" rel="noopener noreferrer">
                                                Install Xverse
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                className="wallet-option demo-wallet"
                                onClick={() => handleWalletConnect(false)}
                                disabled={isLoading}
                            >
                                <div className="wallet-option-icon demo">
                                    <TestTube size={32} />
                                </div>
                                <div className="wallet-option-info">
                                    <span className="wallet-option-name">Demo Mode</span>
                                    <span className="wallet-option-desc">Try BitWill with a simulated wallet</span>
                                </div>
                            </button>
                        </div>

                        <p className="modal-footer">
                            BitWill never has access to your private keys. All transactions require your approval.
                        </p>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="error-toast">
                    <span>{error}</span>
                    <button onClick={clearError}>
                        <X size={16} />
                    </button>
                </div>
            )}
        </>
    );
};

export default Navbar;
