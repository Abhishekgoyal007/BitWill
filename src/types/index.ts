// Beneficiary type
export interface Beneficiary {
    id: string;
    name: string;
    address: string;
    percentage: number;
}

// Vault type
export interface Vault {
    id: string;
    name: string;
    amount: number;
    beneficiaries: Beneficiary[];
    inactivityPeriod: number;
    lastCheckIn: Date;
    createdAt: Date;
    status: 'active' | 'warning' | 'triggered' | 'claimed';
    ownerAddress: string;
}

// Wallet state
export interface WalletState {
    isConnected: boolean;
    address: string | null;
    balance: number;
}

// Check-in record
export interface CheckInRecord {
    id: string;
    vaultId: string;
    timestamp: Date;
    txHash: string;
}

// Claim record
export interface ClaimRecord {
    id: string;
    vaultId: string;
    beneficiaryAddress: string;
    amount: number;
    timestamp: Date;
    txHash: string;
}

// Transaction status
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// Create vault form data
export interface CreateVaultFormData {
    name: string;
    amount: number;
    beneficiaries: Beneficiary[];
    inactivityPeriod: number;
}

// App context state
export interface AppState {
    wallet: WalletState;
    vaults: Vault[];
    isLoading: boolean;
}
