import React from 'react';
import type { Vault } from '../types';
import { Clock, Users, AlertTriangle, CheckCircle, XCircle, Loader2, Link as LinkIcon, Wifi, WifiOff } from 'lucide-react';
import './VaultCard.css';

interface VaultCardProps {
    vault: Vault;
    onCheckIn?: (vaultId: string) => void;
    onViewDetails?: (vaultId: string) => void;
    isLoading?: boolean;
}

const VaultCard: React.FC<VaultCardProps> = ({ vault, onCheckIn, onViewDetails, isLoading }) => {
    const getDaysRemaining = () => {
        const now = new Date();
        const daysSinceCheckIn = Math.floor(
            (now.getTime() - new Date(vault.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        return Math.max(0, vault.inactivityPeriod - daysSinceCheckIn);
    };

    const daysRemaining = getDaysRemaining();
    const progressPercentage = Math.min(100, ((vault.inactivityPeriod - daysRemaining) / vault.inactivityPeriod) * 100);

    const getStatusConfig = () => {
        switch (vault.status) {
            case 'active':
                return {
                    label: 'Active',
                    icon: CheckCircle,
                    className: 'status-active',
                    color: 'var(--color-success)',
                };
            case 'warning':
                return {
                    label: 'Check-in Soon',
                    icon: AlertTriangle,
                    className: 'status-warning',
                    color: 'var(--color-warning)',
                };
            case 'triggered':
                return {
                    label: 'Triggered',
                    icon: AlertTriangle,
                    className: 'status-triggered',
                    color: 'var(--color-error)',
                };
            case 'claimed':
                return {
                    label: 'Claimed',
                    icon: XCircle,
                    className: 'status-claimed',
                    color: 'var(--text-tertiary)',
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    icon: XCircle,
                    className: 'status-claimed',
                    color: 'var(--text-tertiary)',
                };
            default:
                return {
                    label: 'Unknown',
                    icon: Clock,
                    className: '',
                    color: 'var(--text-tertiary)',
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    // Get transaction explorer URL
    const getTxUrl = () => {
        if (!vault.txid) return null;
        // Check if it's a demo transaction
        if (vault.txid.startsWith('demo_')) return null;
        // Testnet explorer
        return `https://mempool.space/testnet4/tx/${vault.txid}`;
    };

    const txUrl = getTxUrl();

    return (
        <div className={`vault-card ${vault.status === 'claimed' || vault.status === 'cancelled' ? 'vault-claimed' : ''}`}>
            <div className="vault-header">
                <div className="vault-title-section">
                    <h3 className="vault-name">{vault.name}</h3>
                    <div className="vault-badges">
                        <div className={`vault-status ${statusConfig.className}`}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
                        </div>
                        <div className={`vault-chain-badge ${vault.isOnChain ? 'on-chain' : 'demo'}`}>
                            {vault.isOnChain ? (
                                <>
                                    <Wifi size={12} />
                                    On-Chain
                                </>
                            ) : (
                                <>
                                    <WifiOff size={12} />
                                    Demo
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="vault-amount">
                    <span className="amount-value">{vault.amount.toFixed(4)}</span>
                    <span className="amount-unit">BTC</span>
                    {vault.amountSats > 0 && (
                        <span className="amount-sats">{vault.amountSats.toLocaleString()} sats</span>
                    )}
                </div>
            </div>

            {/* Transaction Link */}
            {txUrl && (
                <a
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vault-tx-link"
                >
                    <LinkIcon size={12} />
                    View on Explorer
                    <span className="tx-id">{vault.txid?.slice(0, 8)}...{vault.txid?.slice(-8)}</span>
                </a>
            )}

            <div className="vault-progress-section">
                <div className="progress-header">
                    <div className="progress-label">
                        <Clock size={14} />
                        <span>Time until trigger</span>
                    </div>
                    <span className="progress-days">
                        {vault.status === 'claimed' || vault.status === 'cancelled' ? 'N/A' : `${daysRemaining} days`}
                    </span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: vault.status === 'claimed' || vault.status === 'cancelled' ? '100%' : `${progressPercentage}%`,
                            background: vault.status === 'claimed' || vault.status === 'cancelled'
                                ? 'var(--text-tertiary)'
                                : progressPercentage > 80
                                    ? 'var(--color-error)'
                                    : progressPercentage > 60
                                        ? 'var(--color-warning)'
                                        : 'var(--color-success)'
                        }}
                    />
                </div>
            </div>

            <div className="vault-beneficiaries">
                <div className="beneficiaries-header">
                    <Users size={14} />
                    <span>{vault.beneficiaries.length} Beneficiar{vault.beneficiaries.length === 1 ? 'y' : 'ies'}</span>
                </div>
                <div className="beneficiaries-list">
                    {vault.beneficiaries.slice(0, 3).map((ben) => (
                        <div key={ben.id} className="beneficiary-item">
                            <span className="beneficiary-name">{ben.name}</span>
                            <span className="beneficiary-percentage">{ben.percentage}%</span>
                        </div>
                    ))}
                    {vault.beneficiaries.length > 3 && (
                        <span className="beneficiaries-more">+{vault.beneficiaries.length - 3} more</span>
                    )}
                </div>
            </div>

            <div className="vault-actions">
                {vault.status !== 'claimed' && vault.status !== 'cancelled' && vault.status !== 'triggered' && onCheckIn && (
                    <button
                        className="btn btn-primary vault-action-btn"
                        onClick={() => onCheckIn(vault.id)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="spin" />
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                I'm Still Here
                            </>
                        )}
                    </button>
                )}
                {onViewDetails && (
                    <button
                        className="btn btn-secondary vault-action-btn"
                        onClick={() => onViewDetails(vault.id)}
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default VaultCard;
