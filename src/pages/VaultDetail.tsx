import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import {
    ArrowLeft,
    Shield,
    Clock,
    Users,
    CheckCircle,
    AlertTriangle,
    Trash2,
    Loader2,
    Calendar,
    Activity
} from 'lucide-react';
import './VaultDetail.css';

const VaultDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { vaults, checkIn, cancelVault, isLoading, wallet } = useWallet();
    const navigate = useNavigate();
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const vault = vaults.find(v => v.id === id);

    if (!vault) {
        return (
            <div className="vault-detail-page">
                <div className="container container-sm">
                    <div className="not-found">
                        <Shield size={64} />
                        <h2>Vault Not Found</h2>
                        <p>This vault doesn't exist or you don't have access to it.</p>
                        <Link to="/dashboard" className="btn btn-primary">
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isOwner = vault.ownerAddress === wallet.address;

    const getDaysRemaining = () => {
        const now = new Date();
        const daysSinceCheckIn = Math.floor(
            (now.getTime() - new Date(vault.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        return Math.max(0, vault.inactivityPeriod - daysSinceCheckIn);
    };

    const daysRemaining = getDaysRemaining();
    const progressPercentage = Math.min(
        100,
        ((vault.inactivityPeriod - daysRemaining) / vault.inactivityPeriod) * 100
    );

    const getStatusConfig = () => {
        switch (vault.status) {
            case 'active':
                return { label: 'Active', color: 'success', icon: CheckCircle };
            case 'warning':
                return { label: 'Check-in Required', color: 'warning', icon: AlertTriangle };
            case 'triggered':
                return { label: 'Triggered', color: 'error', icon: AlertTriangle };
            case 'claimed':
                return { label: 'Claimed', color: 'neutral', icon: CheckCircle };
            default:
                return { label: 'Unknown', color: 'neutral', icon: Shield };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    const handleCheckIn = async () => {
        setIsCheckingIn(true);
        await checkIn(vault.id);
        setIsCheckingIn(false);
    };

    const handleCancel = async () => {
        setIsCanceling(true);
        await cancelVault(vault.id);
        setIsCanceling(false);
        navigate('/dashboard');
    };

    return (
        <div className="vault-detail-page">
            <div className="container container-sm">
                {/* Back Button */}
                <Link to="/dashboard" className="back-link">
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>

                {/* Vault Header */}
                <div className="vault-detail-header">
                    <div className="vault-detail-icon">
                        <Shield size={32} />
                    </div>
                    <div className="vault-detail-info">
                        <h1>{vault.name}</h1>
                        <div className={`status-badge status-${statusConfig.color}`}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
                        </div>
                    </div>
                    <div className="vault-detail-amount">
                        <span className="amount-value">{vault.amount.toFixed(4)}</span>
                        <span className="amount-label">BTC Locked</span>
                    </div>
                </div>

                {/* Timer Card */}
                <div className="timer-card">
                    <div className="timer-header">
                        <Clock size={24} />
                        <h3>Time Until Trigger</h3>
                    </div>
                    <div className="timer-display">
                        <div className="timer-value">
                            {vault.status === 'claimed' ? 'N/A' : daysRemaining}
                        </div>
                        <div className="timer-label">Days Remaining</div>
                    </div>
                    <div className="timer-progress">
                        <div
                            className={`timer-progress-fill ${progressPercentage > 80
                                    ? 'danger'
                                    : progressPercentage > 60
                                        ? 'warning'
                                        : ''
                                }`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="timer-meta">
                        <div className="timer-meta-item">
                            <Calendar size={16} />
                            <span>
                                Last check-in: {new Date(vault.lastCheckIn).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="timer-meta-item">
                            <Activity size={16} />
                            <span>Inactivity period: {vault.inactivityPeriod} days</span>
                        </div>
                    </div>

                    {isOwner && vault.status !== 'claimed' && vault.status !== 'triggered' && (
                        <button
                            className="btn btn-primary btn-lg checkin-btn"
                            onClick={handleCheckIn}
                            disabled={isCheckingIn || isLoading}
                        >
                            {isCheckingIn ? (
                                <>
                                    <Loader2 size={20} className="spin" />
                                    Checking In...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    I'm Still Here
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Beneficiaries Card */}
                <div className="beneficiaries-card">
                    <div className="beneficiaries-header">
                        <Users size={24} />
                        <h3>Beneficiaries</h3>
                    </div>
                    <div className="beneficiaries-grid">
                        {vault.beneficiaries.map((ben) => (
                            <div key={ben.id} className="beneficiary-card">
                                <div className="beneficiary-avatar">
                                    {ben.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="beneficiary-info">
                                    <span className="beneficiary-name">{ben.name}</span>
                                    <span className="beneficiary-address">{ben.address}</span>
                                </div>
                                <div className="beneficiary-share">
                                    <span className="share-percentage">{ben.percentage}%</span>
                                    <span className="share-amount">
                                        {((vault.amount * ben.percentage) / 100).toFixed(4)} BTC
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vault Details */}
                <div className="details-card">
                    <h3>Vault Details</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Created</span>
                            <span className="detail-value">
                                {new Date(vault.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Vault ID</span>
                            <span className="detail-value mono">{vault.id}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Owner</span>
                            <span className="detail-value mono">
                                {vault.ownerAddress.slice(0, 12)}...{vault.ownerAddress.slice(-8)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Network</span>
                            <span className="detail-value">Bitcoin (Testnet)</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {isOwner && vault.status !== 'claimed' && vault.status !== 'triggered' && (
                    <div className="danger-zone">
                        <h3>Danger Zone</h3>
                        <p>
                            Cancel this vault and withdraw all funds back to your wallet.
                            This action cannot be undone.
                        </p>
                        {!showCancelConfirm ? (
                            <button
                                className="btn btn-danger"
                                onClick={() => setShowCancelConfirm(true)}
                            >
                                <Trash2 size={18} />
                                Cancel Vault
                            </button>
                        ) : (
                            <div className="cancel-confirm">
                                <p className="confirm-text">
                                    Are you sure? This will return <strong>{vault.amount} BTC</strong> to
                                    your wallet and remove all beneficiary settings.
                                </p>
                                <div className="confirm-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowCancelConfirm(false)}
                                    >
                                        Keep Vault
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleCancel}
                                        disabled={isCanceling}
                                    >
                                        {isCanceling ? (
                                            <>
                                                <Loader2 size={18} className="spin" />
                                                Canceling...
                                            </>
                                        ) : (
                                            'Yes, Cancel Vault'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VaultDetail;
