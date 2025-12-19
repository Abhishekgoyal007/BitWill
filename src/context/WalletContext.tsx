import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { WalletState, Vault, Beneficiary } from '../types';
import { charmsService } from '../services/charms';

interface WalletContextType {
    wallet: WalletState;
    vaults: Vault[];
    claimableVaults: Vault[];
    isLoading: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    createVault: (name: string, amount: number, beneficiaries: Beneficiary[], inactivityPeriod: number) => Promise<Vault>;
    checkIn: (vaultId: string) => Promise<void>;
    claimVault: (vaultId: string) => Promise<void>;
    cancelVault: (vaultId: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Simulate wallet address
const generateMockAddress = () => {
    const chars = 'abcdef0123456789';
    let address = 'bc1q';
    for (let i = 0; i < 38; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<WalletState>({
        isConnected: false,
        address: null,
        balance: 0,
    });
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [claimableVaults, setClaimableVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Check for saved wallet state
    useEffect(() => {
        const savedWallet = localStorage.getItem('bitwill_wallet');
        if (savedWallet) {
            const parsed = JSON.parse(savedWallet);
            setWallet(parsed);
        }

        const savedVaults = localStorage.getItem('bitwill_vaults');
        if (savedVaults) {
            const parsed = JSON.parse(savedVaults);
            // Convert date strings back to Date objects
            const vaultsWithDates = parsed.map((v: Vault) => ({
                ...v,
                lastCheckIn: new Date(v.lastCheckIn),
                createdAt: new Date(v.createdAt),
            }));
            setVaults(vaultsWithDates);
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
                    if (vault.status === 'claimed') return vault;

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
        const interval = setInterval(updateStatuses, 60000); // Update every minute
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

    const connectWallet = useCallback(async () => {
        setIsLoading(true);

        // Simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In production, this would connect to actual Charms wallet
        // For demo, we create a mock wallet
        const mockAddress = generateMockAddress();

        setWallet({
            isConnected: true,
            address: mockAddress,
            balance: 2.5847, // Mock balance
        });

        setIsLoading(false);
    }, []);

    const disconnectWallet = useCallback(() => {
        setWallet({
            isConnected: false,
            address: null,
            balance: 0,
        });
        localStorage.removeItem('bitwill_wallet');
    }, []);

    const createVault = useCallback(async (
        name: string,
        amount: number,
        beneficiaries: Beneficiary[],
        inactivityPeriod: number
    ): Promise<Vault> => {
        setIsLoading(true);

        // Initialize Charms service
        await charmsService.initialize();

        // Generate vault ID
        const vaultId = generateId();

        // Create vault spell via Charms Protocol
        // In production, this would mint a Charm NFT on Bitcoin
        const mockUtxo = `${vaultId}:0`;
        const result = await charmsService.createVault(
            wallet.address!,
            name,
            Math.round(amount * 100_000_000), // Convert BTC to satoshis
            beneficiaries,
            inactivityPeriod,
            mockUtxo
        );

        console.log('[WalletContext] Vault created via Charms:', result);

        const newVault: Vault = {
            id: vaultId,
            name,
            amount,
            beneficiaries,
            inactivityPeriod,
            lastCheckIn: new Date(),
            createdAt: new Date(),
            status: 'active',
            ownerAddress: wallet.address!,
        };

        setVaults(prev => [...prev, newVault]);

        // Update wallet balance
        setWallet(prev => ({
            ...prev,
            balance: prev.balance - amount,
        }));

        setIsLoading(false);
        return newVault;
    }, [wallet.address]);

    const checkIn = useCallback(async (vaultId: string) => {
        setIsLoading(true);

        // Execute check-in via Charms Protocol
        const result = await charmsService.checkIn(vaultId, wallet.address!);
        console.log('[WalletContext] Check-in via Charms:', result);

        setVaults(prev =>
            prev.map(vault =>
                vault.id === vaultId
                    ? { ...vault, lastCheckIn: new Date(), status: 'active' as const }
                    : vault
            )
        );

        setIsLoading(false);
    }, [wallet.address]);

    const claimVault = useCallback(async (vaultId: string) => {
        setIsLoading(true);

        const vault = vaults.find(v => v.id === vaultId);
        if (!vault || !wallet.address) {
            setIsLoading(false);
            return;
        }

        // Execute claim via Charms Protocol
        const result = await charmsService.claimVault(vaultId, wallet.address);
        console.log('[WalletContext] Claim via Charms:', result);

        // Find beneficiary share
        const beneficiary = vault.beneficiaries.find(
            b => b.address.toLowerCase() === wallet.address?.toLowerCase()
        );

        if (beneficiary) {
            const claimAmount = (vault.amount * beneficiary.percentage) / 100;

            // Update wallet balance
            setWallet(prev => ({
                ...prev,
                balance: prev.balance + claimAmount,
            }));

            // Mark vault as claimed (in real app, would track partial claims)
            setVaults(prev =>
                prev.map(v =>
                    v.id === vaultId ? { ...v, status: 'claimed' as const } : v
                )
            );
        }

        setIsLoading(false);
    }, [vaults, wallet.address]);

    const cancelVault = useCallback(async (vaultId: string) => {
        setIsLoading(true);

        // Execute cancel via Charms Protocol
        const result = await charmsService.cancelVault(vaultId, wallet.address!);
        console.log('[WalletContext] Cancel via Charms:', result);

        const vault = vaults.find(v => v.id === vaultId);
        if (vault) {
            // Return funds to wallet
            setWallet(prev => ({
                ...prev,
                balance: prev.balance + vault.amount,
            }));

            // Remove vault
            setVaults(prev => prev.filter(v => v.id !== vaultId));
        }

        setIsLoading(false);
    }, [vaults]);

    return (
        <WalletContext.Provider
            value={{
                wallet,
                vaults,
                claimableVaults,
                isLoading,
                connectWallet,
                disconnectWallet,
                createVault,
                checkIn,
                claimVault,
                cancelVault,
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
