import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { WalletState, Vault, Beneficiary, TransactionResult } from '../types';
import { charmsService } from '../services/charms';
import { bitcoinWallet, satsToBtc, btcToSats } from '../services/bitcoinWallet';
import { psbtBuilder } from '../services/psbtBuilder';

interface WalletContextType {
    wallet: WalletState;
    vaults: Vault[];
    claimableVaults: Vault[];
    isLoading: boolean;
    error: string | null;
    // Wallet actions
    connectWallet: (useRealWallet?: boolean) => Promise<void>;
    disconnectWallet: () => void;
    refreshBalance: () => Promise<void>;
    // Vault actions
    createVault: (name: string, amount: number, beneficiaries: Beneficiary[], inactivityPeriod: number) => Promise<Vault>;
    checkIn: (vaultId: string) => Promise<TransactionResult>;
    claimVault: (vaultId: string) => Promise<TransactionResult>;
    cancelVault: (vaultId: string) => Promise<TransactionResult>;
    // Utility
    clearError: () => void;
    isWalletAvailable: () => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Default wallet state
const defaultWalletState: WalletState = {
    isConnected: false,
    address: null,
    ordinalsAddress: null,
    publicKey: null,
    ordinalsPublicKey: null,
    balance: 0,
    balanceSats: 0,
    network: 'Testnet',
    walletType: null,
    isRealWallet: false,
};

// Demo wallet generator (for testing without real wallet)
const generateDemoWallet = (): WalletState => {
    const chars = 'abcdef0123456789';
    let address = 'tb1q'; // Testnet address
    for (let i = 0; i < 38; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return {
        isConnected: true,
        address,
        ordinalsAddress: null,
        publicKey: null,
        ordinalsPublicKey: null,
        balance: 2.5847,
        balanceSats: 258470000,
        network: 'Testnet',
        walletType: 'demo',
        isRealWallet: false,
    };
};

interface WalletProviderProps {
    children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [wallet, setWallet] = useState<WalletState>(defaultWalletState);
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [claimableVaults, setClaimableVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for saved wallet state on mount
    useEffect(() => {
        const savedWallet = localStorage.getItem('bitwill_wallet');
        if (savedWallet) {
            try {
                const parsed = JSON.parse(savedWallet);
                // If it was a real wallet, don't auto-restore (need to reconnect)
                if (!parsed.isRealWallet) {
                    setWallet(parsed);
                }
            } catch (e) {
                console.error('Error parsing saved wallet:', e);
            }
        }

        const savedVaults = localStorage.getItem('bitwill_vaults');
        if (savedVaults) {
            try {
                const parsed = JSON.parse(savedVaults);
                const vaultsWithDates = parsed.map((v: Vault) => ({
                    ...v,
                    lastCheckIn: new Date(v.lastCheckIn),
                    createdAt: new Date(v.createdAt),
                }));
                setVaults(vaultsWithDates);
            } catch (e) {
                console.error('Error parsing saved vaults:', e);
            }
        }
    }, []);

    // Save wallet state
    useEffect(() => {
        if (wallet.isConnected) {
            localStorage.setItem('bitwill_wallet', JSON.stringify(wallet));
        } else {
            localStorage.removeItem('bitwill_wallet');
        }
    }, [wallet]);

    // Save vaults
    useEffect(() => {
        localStorage.setItem('bitwill_vaults', JSON.stringify(vaults));
    }, [vaults]);

    // Update vault statuses based on time
    useEffect(() => {
        const updateStatuses = () => {
            setVaults(prevVaults =>
                prevVaults.map(vault => {
                    if (vault.status === 'claimed' || vault.status === 'cancelled') return vault;

                    const now = new Date();
                    const daysSinceCheckIn = Math.floor(
                        (now.getTime() - new Date(vault.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const daysRemaining = vault.inactivityPeriod - daysSinceCheckIn;

                    if (daysRemaining <= 0) {
                        return { ...vault, status: 'triggered' as const };
                    } else if (daysRemaining <= 7) {
                        return { ...vault, status: 'warning' as const };
                    }
                    return { ...vault, status: 'active' as const };
                })
            );
        };

        updateStatuses();
        const interval = setInterval(updateStatuses, 60000);
        return () => clearInterval(interval);
    }, []);

    // Find claimable vaults for current wallet
    useEffect(() => {
        if (!wallet.address) {
            setClaimableVaults([]);
            return;
        }

        const claimable = vaults.filter(
            vault =>
                vault.status === 'triggered' &&
                vault.beneficiaries.some(b => b.address.toLowerCase() === wallet.address?.toLowerCase())
        );
        setClaimableVaults(claimable);
    }, [vaults, wallet.address]);

    // Check if wallet extension is available
    const isWalletAvailable = useCallback((): boolean => {
        return bitcoinWallet.isWalletAvailable();
    }, []);

    // Connect wallet (real or demo)
    const connectWallet = useCallback(async (useRealWallet: boolean = true) => {
        setIsLoading(true);
        setError(null);

        try {
            // Initialize Charms service
            await charmsService.initialize();

            if (useRealWallet && bitcoinWallet.isWalletAvailable()) {
                // Try to connect real wallet
                console.log('[WalletContext] Connecting to real Bitcoin wallet...');

                const connectedWallet = await bitcoinWallet.connect();

                if (connectedWallet.paymentAddress) {
                    // Fetch real balance
                    const balance = await bitcoinWallet.getBalance();

                    setWallet({
                        isConnected: true,
                        address: connectedWallet.paymentAddress.address,
                        ordinalsAddress: connectedWallet.ordinalsAddress?.address || null,
                        publicKey: connectedWallet.paymentAddress.publicKey,
                        ordinalsPublicKey: connectedWallet.ordinalsAddress?.publicKey || null,
                        balance: satsToBtc(balance.total),
                        balanceSats: balance.total,
                        network: connectedWallet.network,
                        walletType: connectedWallet.walletType === 'other' ? 'xverse' : connectedWallet.walletType,
                        isRealWallet: true,
                    });

                    console.log('[WalletContext] Real wallet connected:', connectedWallet.paymentAddress.address);
                } else {
                    throw new Error('No payment address received from wallet');
                }
            } else {
                // Use demo wallet
                console.log('[WalletContext] Using demo wallet...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
                setWallet(generateDemoWallet());
                console.log('[WalletContext] Demo wallet connected');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
            console.error('[WalletContext] Connection error:', errorMessage);
            setError(errorMessage);

            // Fall back to demo wallet if real wallet fails
            if (useRealWallet) {
                console.log('[WalletContext] Falling back to demo wallet...');
                setWallet(generateDemoWallet());
            }
        }

        setIsLoading(false);
    }, []);

    // Disconnect wallet
    const disconnectWallet = useCallback(() => {
        if (wallet.isRealWallet) {
            bitcoinWallet.disconnect();
        }
        setWallet(defaultWalletState);
        localStorage.removeItem('bitwill_wallet');
        console.log('[WalletContext] Wallet disconnected');
    }, [wallet.isRealWallet]);

    // Refresh balance
    const refreshBalance = useCallback(async () => {
        if (!wallet.isConnected || !wallet.address) return;

        try {
            if (wallet.isRealWallet) {
                const balance = await bitcoinWallet.getBalance(wallet.address);
                setWallet(prev => ({
                    ...prev,
                    balance: satsToBtc(balance.total),
                    balanceSats: balance.total,
                }));
            }
        } catch (err) {
            console.error('[WalletContext] Error refreshing balance:', err);
        }
    }, [wallet.isConnected, wallet.address, wallet.isRealWallet]);

    // Create vault
    const createVault = useCallback(async (
        name: string,
        amount: number,
        beneficiaries: Beneficiary[],
        inactivityPeriod: number
    ): Promise<Vault> => {
        setIsLoading(true);
        setError(null);

        try {
            const vaultId = generateId();
            const amountSats = btcToSats(amount);
            let txid: string | undefined;
            let isOnChain = false;

            if (wallet.isRealWallet && wallet.publicKey && wallet.address) {
                // Real wallet - create actual transaction
                console.log('[WalletContext] Creating on-chain vault...');

                // Get UTXOs
                const utxos = await bitcoinWallet.getUtxos(wallet.address);
                if (utxos.length === 0) {
                    throw new Error('No UTXOs available. Please fund your wallet first.');
                }

                // Get fee rate
                const feeRate = await psbtBuilder.getFeeRate('medium');

                // Build PSBT
                const psbtResult = await psbtBuilder.buildCreateVaultPsbt({
                    ownerAddress: wallet.address,
                    ownerPublicKey: wallet.publicKey,
                    amountSats,
                    beneficiaries,
                    inactivityPeriodDays: inactivityPeriod,
                    utxos,
                    feeRate,
                });

                // Sign PSBT with wallet
                const signResult = await bitcoinWallet.signPsbt(
                    psbtResult.psbtBase64,
                    { [wallet.address]: Array.from({ length: psbtResult.inputCount }, (_, i) => i) },
                    true // broadcast
                );

                if (signResult.success && signResult.txid) {
                    txid = signResult.txid;
                    isOnChain = true;
                    console.log('[WalletContext] Vault created on-chain:', txid);
                } else {
                    throw new Error(signResult.error || 'Failed to sign transaction');
                }
            } else {
                // Demo mode - simulate transaction
                console.log('[WalletContext] Creating demo vault...');
                await charmsService.createVault(
                    wallet.address!,
                    name,
                    amountSats,
                    beneficiaries,
                    inactivityPeriod,
                    `${vaultId}:0`
                );
                txid = `demo_tx_${Date.now().toString(16)}`;
            }

            const newVault: Vault = {
                id: vaultId,
                name,
                amount,
                amountSats,
                beneficiaries,
                inactivityPeriod,
                lastCheckIn: new Date(),
                createdAt: new Date(),
                status: 'active',
                ownerAddress: wallet.address!,
                txid,
                vout: 0,
                isOnChain,
            };

            setVaults(prev => [...prev, newVault]);

            // Update balance
            setWallet(prev => ({
                ...prev,
                balance: prev.balance - amount,
                balanceSats: prev.balanceSats - amountSats,
            }));

            setIsLoading(false);
            return newVault;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create vault';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    }, [wallet]);

    // Check-in
    const checkIn = useCallback(async (vaultId: string): Promise<TransactionResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const vault = vaults.find(v => v.id === vaultId);
            if (!vault) {
                throw new Error('Vault not found');
            }

            let txid: string | undefined;

            if (wallet.isRealWallet && wallet.publicKey && vault.txid && vault.isOnChain) {
                // Real transaction
                console.log('[WalletContext] Performing on-chain check-in...');

                const feeRate = await psbtBuilder.getFeeRate('medium');

                const psbtResult = await psbtBuilder.buildCheckInPsbt({
                    vaultUtxo: {
                        txid: vault.txid,
                        vout: vault.vout || 0,
                        value: vault.amountSats,
                        status: { confirmed: true }
                    },
                    ownerAddress: wallet.address!,
                    ownerPublicKey: wallet.publicKey,
                    feeRate,
                });

                const signResult = await bitcoinWallet.signPsbt(
                    psbtResult.psbtBase64,
                    { [wallet.address!]: [0] },
                    true
                );

                if (signResult.success && signResult.txid) {
                    txid = signResult.txid;
                } else {
                    throw new Error(signResult.error || 'Failed to sign check-in transaction');
                }
            } else {
                // Demo mode
                await charmsService.checkIn(vaultId, wallet.address!);
                txid = `demo_checkin_${Date.now().toString(16)}`;
            }

            // Update vault
            setVaults(prev =>
                prev.map(v =>
                    v.id === vaultId
                        ? {
                            ...v,
                            lastCheckIn: new Date(),
                            status: 'active' as const,
                            txid: txid || v.txid
                        }
                        : v
                )
            );

            setIsLoading(false);
            return { success: true, txid, message: 'Check-in successful' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
            setError(errorMessage);
            setIsLoading(false);
            return { success: false, error: errorMessage };
        }
    }, [vaults, wallet]);

    // Claim vault
    const claimVault = useCallback(async (vaultId: string): Promise<TransactionResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const vault = vaults.find(v => v.id === vaultId);
            if (!vault || !wallet.address) {
                throw new Error('Vault not found or wallet not connected');
            }

            const beneficiary = vault.beneficiaries.find(
                b => b.address.toLowerCase() === wallet.address?.toLowerCase()
            );

            if (!beneficiary) {
                throw new Error('You are not a beneficiary of this vault');
            }

            const claimAmountSats = Math.floor(vault.amountSats * (beneficiary.percentage / 100));
            let txid: string | undefined;

            if (wallet.isRealWallet && wallet.publicKey && vault.txid && vault.isOnChain) {
                // Real transaction
                console.log('[WalletContext] Performing on-chain claim...');

                const feeRate = await psbtBuilder.getFeeRate('medium');

                const psbtResult = await psbtBuilder.buildClaimPsbt({
                    vaultUtxo: {
                        txid: vault.txid,
                        vout: vault.vout || 0,
                        value: vault.amountSats,
                        status: { confirmed: true }
                    },
                    beneficiaryAddress: wallet.address,
                    beneficiaryPublicKey: wallet.publicKey,
                    claimAmountSats,
                    feeRate,
                });

                const signResult = await bitcoinWallet.signPsbt(
                    psbtResult.psbtBase64,
                    { [wallet.address]: [0] },
                    true
                );

                if (signResult.success && signResult.txid) {
                    txid = signResult.txid;
                } else {
                    throw new Error(signResult.error || 'Failed to sign claim transaction');
                }
            } else {
                // Demo mode
                await charmsService.claimVault(vaultId, wallet.address, beneficiary.percentage);
                txid = `demo_claim_${Date.now().toString(16)}`;
            }

            const claimAmount = vault.amount * (beneficiary.percentage / 100);

            // Update wallet balance
            setWallet(prev => ({
                ...prev,
                balance: prev.balance + claimAmount,
                balanceSats: prev.balanceSats + claimAmountSats,
            }));

            // Mark vault as claimed
            setVaults(prev =>
                prev.map(v =>
                    v.id === vaultId ? { ...v, status: 'claimed' as const, txid } : v
                )
            );

            setIsLoading(false);
            return { success: true, txid, message: `Claimed ${claimAmount.toFixed(8)} BTC` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim vault';
            setError(errorMessage);
            setIsLoading(false);
            return { success: false, error: errorMessage };
        }
    }, [vaults, wallet]);

    // Cancel vault
    const cancelVault = useCallback(async (vaultId: string): Promise<TransactionResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const vault = vaults.find(v => v.id === vaultId);
            if (!vault) {
                throw new Error('Vault not found');
            }

            let txid: string | undefined;

            if (wallet.isRealWallet && wallet.publicKey && vault.txid && vault.isOnChain) {
                // Real transaction
                console.log('[WalletContext] Performing on-chain cancellation...');

                const feeRate = await psbtBuilder.getFeeRate('medium');

                const psbtResult = await psbtBuilder.buildCancelPsbt({
                    vaultUtxo: {
                        txid: vault.txid,
                        vout: vault.vout || 0,
                        value: vault.amountSats,
                        status: { confirmed: true }
                    },
                    ownerAddress: wallet.address!,
                    ownerPublicKey: wallet.publicKey,
                    feeRate,
                });

                const signResult = await bitcoinWallet.signPsbt(
                    psbtResult.psbtBase64,
                    { [wallet.address!]: [0] },
                    true
                );

                if (signResult.success && signResult.txid) {
                    txid = signResult.txid;
                } else {
                    throw new Error(signResult.error || 'Failed to sign cancel transaction');
                }
            } else {
                // Demo mode
                await charmsService.cancelVault(vaultId, wallet.address!);
                txid = `demo_cancel_${Date.now().toString(16)}`;
            }

            // Return funds to wallet
            setWallet(prev => ({
                ...prev,
                balance: prev.balance + vault.amount,
                balanceSats: prev.balanceSats + vault.amountSats,
            }));

            // Mark vault as cancelled
            setVaults(prev =>
                prev.map(v =>
                    v.id === vaultId ? { ...v, status: 'cancelled' as const, txid } : v
                )
            );

            setIsLoading(false);
            return { success: true, txid, message: 'Vault cancelled and funds returned' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel vault';
            setError(errorMessage);
            setIsLoading(false);
            return { success: false, error: errorMessage };
        }
    }, [vaults, wallet]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <WalletContext.Provider
            value={{
                wallet,
                vaults,
                claimableVaults,
                isLoading,
                error,
                connectWallet,
                disconnectWallet,
                refreshBalance,
                createVault,
                checkIn,
                claimVault,
                cancelVault,
                clearError,
                isWalletAvailable,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
