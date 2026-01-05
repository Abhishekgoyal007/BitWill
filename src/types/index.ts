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
    amount: number; // in BTC
    amountSats: number; // in satoshis
    beneficiaries: Beneficiary[];
    inactivityPeriod: number; // in days
    lastCheckIn: Date;
    createdAt: Date;
    status: 'active' | 'warning' | 'triggered' | 'claimed' | 'cancelled';
    ownerAddress: string;
    // On-chain data
    txid?: string; // Transaction ID that created/last updated the vault
    vout?: number; // Output index in the transaction
    isOnChain: boolean; // Whether this vault exists on-chain
}

// Wallet state - extended for real wallet support
export interface WalletState {
    isConnected: boolean;
    address: string | null;
    ordinalsAddress: string | null;
    publicKey: string | null;
    ordinalsPublicKey: string | null;
    balance: number; // in BTC
    balanceSats: number; // in satoshis
    network: 'Mainnet' | 'Testnet' | 'Signet';
    walletType: 'xverse' | 'leather' | 'demo' | null;
    isRealWallet: boolean;
}

// Check-in record
export interface CheckInRecord {
    id: string;
    vaultId: string;
    timestamp: Date;
    txHash: string;
    confirmed: boolean;
}

// Claim record
export interface ClaimRecord {
    id: string;
    vaultId: string;
    beneficiaryAddress: string;
    amount: number;
    timestamp: Date;
    txHash: string;
    confirmed: boolean;
}

// Transaction status
export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

// Create vault form data
export interface CreateVaultFormData {
    name: string;
    amount: number; // in BTC
    beneficiaries: Beneficiary[];
    inactivityPeriod: number; // in days
}

// Transaction result
export interface TransactionResult {
    success: boolean;
    txid?: string;
    error?: string;
    message?: string;
}

// UTXO type for Bitcoin transactions
export interface BitcoinUTXO {
    txid: string;
    vout: number;
    value: number; // satoshis
    confirmed: boolean;
    blockHeight?: number;
}

// App context state
export interface AppState {
    wallet: WalletState;
    vaults: Vault[];
    isLoading: boolean;
    error: string | null;
}

// Fee estimate
export interface FeeEstimate {
    low: number; // sats/vbyte
    medium: number;
    high: number;
}

// Vault creation result
export interface VaultCreationResult {
    success: boolean;
    vault?: Vault;
    txid?: string;
    error?: string;
}
