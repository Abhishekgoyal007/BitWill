import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import {
    Gift,
    Shield,
    Check,
    AlertCircle,
    Loader2,
    ArrowRight,
    Wallet
} from 'lucide-react';
import './Claim.css';

const Claim: React.FC = () => {
    const { wallet, claimableVaults, claimVault, isLoading, connectWallet } = useWallet();
    const navigate = useNavigate();
    const [claimingVaultId, setClaimingVaultId] = useState<string | null>(null);
    const [claimedVaults, setClaimedVaults] = useState<string[]>([]);

    const handleClaim = async (vaultId: string) => {
        setClaimingVaultId(vaultId);
        await claimVault(vaultId);
        setClaimedVaults([...claimedVaults, vaultId]);
        setClaimingVaultId(null);
    };

    const getMyShare = (vault: typeof claimableVaults[0]) => {
        const beneficiary = vault.beneficiaries.find(
            b => b.address.toLowerCase() === wallet.address?.toLowerCase()
        );
        if (beneficiary) {
            return {
                percentage: beneficiary.percentage,
                amount: (vault.amount * beneficiary.percentage) / 100,
            };
        }
        return { percentage: 0, amount: 0 };
    };

    if (!wallet.isConnected) {
        return (
            <div className="claim-page">
                <div className="container container-sm">
                    <div className="connect-card">
                        <div className="connect-icon">
                            <Wallet size={48} />
                        </div>
                        <h2>Connect to Claim</h2>
                        <p>
                            Connect your wallet to check if you have any inheritance funds
                            waiting to be claimed.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={connectWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="spin" />
                            ) : (
                                <>
                                    <Wallet size={20} />
                                    Connect Wallet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="claim-page">
            <div className="container container-sm">
                <div className="claim-header">
                    <h1>Claim Inheritance</h1>
                    <p>Claim funds from vaults where you are a designated beneficiary</p>
                </div>

                {claimableVaults.length === 0 ? (
                    <div className="empty-claim-state">
                        <div className="empty-icon">
                            <Gift size={48} />
                        </div>
                        <h3>No Funds to Claim</h3>
                        <p>
                            You don't have any inheritance funds waiting to be claimed.
                            This page will show vaults where:
                        </p>
                        <ul className="empty-list">
                            <li>
                                <Check size={16} />
                                You are listed as a beneficiary
                            </li>
                            <li>
                                <Check size={16} />
                                The vault owner has been inactive past the trigger period
                            </li>
                        </ul>
                    </div>
                ) : (
                    <div className="claimable-vaults">
                        {claimableVaults.map((vault) => {
                            const myShare = getMyShare(vault);
                            const isClaimed = claimedVaults.includes(vault.id);
                            const isClaiming = claimingVaultId === vault.id;

                            return (
                                <div
                                    key={vault.id}
                                    className={`claim-card ${isClaimed ? 'claimed' : ''}`}
                                >
                                    <div className="claim-card-header">
                                        <div className="claim-vault-info">
                                            <div className="claim-vault-icon">
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h3 className="claim-vault-name">{vault.name}</h3>
                                                <span className="claim-vault-status">
                                                    <AlertCircle size={14} />
                                                    Triggered - Ready to Claim
                                                </span>
                                            </div>
                                        </div>
                                        <div className="claim-amount-section">
                                            <span className="claim-amount">{myShare.amount.toFixed(4)} BTC</span>
                                            <span className="claim-percentage">Your share: {myShare.percentage}%</span>
                                        </div>
                                    </div>

                                    <div className="claim-card-details">
                                        <div className="claim-detail-item">
                                            <span className="detail-label">Total Vault</span>
                                            <span className="detail-value">{vault.amount.toFixed(4)} BTC</span>
                                        </div>
                                        <div className="claim-detail-item">
                                            <span className="detail-label">Inactivity Period</span>
                                            <span className="detail-value">{vault.inactivityPeriod} Days</span>
                                        </div>
                                        <div className="claim-detail-item">
                                            <span className="detail-label">Last Check-in</span>
                                            <span className="detail-value">
                                                {new Date(vault.lastCheckIn).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="claim-card-action">
                                        {isClaimed ? (
                                            <div className="claimed-badge">
                                                <Check size={20} />
                                                Claimed Successfully
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-gold btn-lg w-full"
                                                onClick={() => handleClaim(vault.id)}
                                                disabled={isClaiming || isLoading}
                                            >
                                                {isClaiming ? (
                                                    <>
                                                        <Loader2 size={20} className="spin" />
                                                        Claiming...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Gift size={20} />
                                                        Claim {myShare.amount.toFixed(4)} BTC
                                                        <ArrowRight size={20} />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="claim-info-card">
                    <h4>How Claiming Works</h4>
                    <p>
                        When a vault owner fails to check in within their specified inactivity
                        period, the vault becomes claimable. As a designated beneficiary, you
                        can claim your share of the locked Bitcoin directly to your wallet.
                    </p>
                    <ul>
                        <li>Claims are processed on the Bitcoin network via Charms Protocol</li>
                        <li>Each beneficiary can only claim their designated percentage</li>
                        <li>Once claimed, funds are transferred immediately to your wallet</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Claim;
