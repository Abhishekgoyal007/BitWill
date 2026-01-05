/**
 * Charms Protocol Integration Service
 * 
 * This service provides the interface for interacting with the Charms Protocol
 * to create and manage Bitcoin inheritance vaults.
 * 
 * Charms are programmable tokens on top of Bitcoin UTXOs that enable:
 * - Time-locked state transitions
 * - Multi-party ownership and claims
 * - Provable execution via zkVM
 * 
 * Integration with charms-js library for reading/extracting charms from transactions.
 * Vault creation uses Charms spell format for future on-chain integration.
 */

import type { Beneficiary } from '../types';

// Try to import charms-js (for reading charms from transactions)
let charmsLib: typeof import('charms-js') | null = null;
let wasmReady = false;

// Initialize charms-js library
async function initCharmsLib() {
    if (charmsLib && wasmReady) return true;

    try {
        const lib = await import('charms-js');
        charmsLib = lib;

        // Check if WASM is ready (browser auto-initializes)
        if (typeof lib.isWasmReady === 'function') {
            // Wait for WASM to be ready (may take a moment)
            for (let i = 0; i < 10; i++) {
                if (lib.isWasmReady()) {
                    wasmReady = true;
                    console.log('[CharmsService] WASM initialized successfully');
                    return true;
                }
                await new Promise(r => setTimeout(r, 500));
            }
        }

        console.log('[CharmsService] charms-js loaded (WASM status unknown)');
        return true;
    } catch (error) {
        console.warn('[CharmsService] charms-js not available, using mock mode:', error);
        return false;
    }
}

// Configuration
const CHARMS_API_URL = import.meta.env.VITE_CHARMS_API_URL || 'https://api.charms.dev';
const BITCOIN_NETWORK = import.meta.env.VITE_BITCOIN_NETWORK || 'testnet4';

// BitWill Vault Charm App Verification Key
// In production, this would be our compiled app VK from `charms app build`
const BITWILL_APP_VK = 'bitwill_vault_app_v1_' + Date.now().toString(36);

// Vault state as stored in the Charm
export interface VaultCharmState {
    type: 'bitwill_vault';
    version: number;
    owner: string;
    beneficiaries: {
        address: string;
        name: string;
        percentage: number;
    }[];
    inactivityPeriod: number; // seconds
    lastCheckIn: number; // Unix timestamp
    createdAt: number; // Unix timestamp
    status: 'active' | 'warning' | 'triggered' | 'claimed';
    amountSats: number;
}

// Charm object structure (from charms-js)
export interface CharmObj {
    appId: string;
    amount: number;
    version: number;
    metadata: {
        ticker?: string;
        name?: string;
        description?: string;
        image?: string;
    };
    app: Record<string, unknown>;
    outputIndex: number;
    txid: string;
    address: string;
}

// Spell result
interface SpellResult {
    success: boolean;
    txId?: string;
    error?: string;
    proof?: string;
    spell?: string;
}

/**
 * Charms Protocol Service
 * 
 * Provides methods for creating and managing BitWill vaults using Charms Protocol.
 */
export class CharmsService {
    private apiUrl: string;
    private network: string;
    private appVk: string;
    private initialized: boolean = false;

    constructor() {
        this.apiUrl = CHARMS_API_URL;
        this.network = BITCOIN_NETWORK;
        this.appVk = BITWILL_APP_VK;
    }

    /**
     * Get the API URL for Charms
     */
    getApiUrl(): string {
        return this.apiUrl;
    }

    /**
     * Initialize the Charms service
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) return true;

        console.log('[CharmsService] Initializing...');
        console.log('[CharmsService] API URL:', this.apiUrl);

        // Try to load charms-js
        const libLoaded = await initCharmsLib();

        if (libLoaded) {
            console.log('[CharmsService] Charms library loaded');
        }

        this.initialized = true;
        console.log('[CharmsService] Initialized with app VK:', this.appVk);
        console.log('[CharmsService] Network:', this.network);

        return true;
    }

    /**
     * Check if the service is ready
     */
    isReady(): boolean {
        return this.initialized;
    }

    /**
     * Extract charms from a transaction
     * Uses the charms-js library to parse transaction and find charms
     */
    async extractCharmsFromTx(
        txHex: string,
        txId: string,
        walletOutpoints: Set<string>
    ): Promise<CharmObj[]> {
        if (!charmsLib) {
            console.warn('[CharmsService] charms-js not loaded, cannot extract charms');
            return [];
        }

        try {
            const charms = await charmsLib.extractCharmsForWallet(
                txHex,
                txId,
                walletOutpoints,
                this.network as 'testnet4' | 'mainnet'
            );

            console.log('[CharmsService] Extracted charms:', charms);
            return charms as CharmObj[];
        } catch (error) {
            console.error('[CharmsService] Error extracting charms:', error);
            return [];
        }
    }

    /**
     * Create a new inheritance vault
     * 
     * This generates a spell to mint a new Charm NFT containing the vault state.
     * In production, this would:
     * 1. Generate the spell YAML
     * 2. Submit to Charms API/CLI for proof generation
     * 3. Create a Bitcoin transaction with the spell
     * 4. User signs and broadcasts the transaction
     */
    async createVault(
        ownerAddress: string,
        vaultName: string,
        amountSats: number,
        beneficiaries: Beneficiary[],
        inactivityPeriodDays: number,
        utxoToSpend: string
    ): Promise<SpellResult> {
        await this.initialize();

        console.log('[CharmsService] Creating vault:', vaultName);
        console.log('[CharmsService] Owner:', ownerAddress);
        console.log('[CharmsService] Amount:', amountSats, 'sats');
        console.log('[CharmsService] Beneficiaries:', beneficiaries.length);

        // Convert beneficiaries to charm format
        const charmBeneficiaries = beneficiaries.map(b => ({
            address: b.address,
            name: b.name,
            percentage: b.percentage,
        }));

        // Vault state for the charm
        const vaultState: VaultCharmState = {
            type: 'bitwill_vault',
            version: 1,
            owner: ownerAddress,
            beneficiaries: charmBeneficiaries,
            inactivityPeriod: inactivityPeriodDays * 24 * 60 * 60,
            lastCheckIn: Math.floor(Date.now() / 1000),
            createdAt: Math.floor(Date.now() / 1000),
            status: 'active',
            amountSats,
        };

        // Generate app ID from the UTXO (as per Charms spec)
        const appId = this.hashUtxo(utxoToSpend);

        // Generate the spell YAML
        const spell = this.generateCreateVaultSpell(
            ownerAddress,
            vaultState,
            utxoToSpend,
            appId
        );

        console.log('[CharmsService] Generated vault creation spell');
        console.log('[CharmsService] App ID:', appId);

        // In production, this would:
        // 1. Call Charms API: POST /spell/prove { spell }
        // 2. Get back proof
        // 3. Create Bitcoin transaction with spell in OP_RETURN
        // 4. Return transaction for user to sign

        // For now, simulate the spell execution
        const result = await this.simulateSpellExecution('create_vault', {
            vaultState,
            spell,
            appId,
        });

        return {
            ...result,
            spell,
        };
    }

    /**
     * Perform a check-in to reset the inactivity timer
     */
    async checkIn(vaultId: string, ownerAddress: string): Promise<SpellResult> {
        await this.initialize();

        console.log('[CharmsService] Check-in for vault:', vaultId);

        const newCheckInTime = Math.floor(Date.now() / 1000);

        const spell = `
# BitWill Check-In Spell
version: 2
action: update_state
app_id: ${vaultId}
app_vk: ${this.appVk}

# State transition
transition:
  type: check_in
  owner: ${ownerAddress}
  new_last_check_in: ${newCheckInTime}
  
# Proof requirements
proof:
  - verify_owner_signature
  - verify_vault_active
`;

        console.log('[CharmsService] Generated check-in spell');

        const result = await this.simulateSpellExecution('check_in', {
            vaultId,
            newCheckInTime,
        });

        return { ...result, spell };
    }

    /**
     * Claim funds from a triggered vault
     */
    async claimVault(
        vaultId: string,
        beneficiaryAddress: string,
        percentage: number
    ): Promise<SpellResult> {
        await this.initialize();

        console.log('[CharmsService] Claiming vault:', vaultId);
        console.log('[CharmsService] Beneficiary:', beneficiaryAddress);
        console.log('[CharmsService] Percentage:', percentage);

        const spell = `
# BitWill Claim Spell
version: 2
action: claim
app_id: ${vaultId}
app_vk: ${this.appVk}

# Claim parameters
claim:
  beneficiary: ${beneficiaryAddress}
  percentage: ${percentage}

# State transition
transition:
  type: claim
  mark_claimed: true

# Proof requirements
proof:
  - verify_vault_triggered
  - verify_beneficiary_in_list
  - verify_claim_amount
`;

        console.log('[CharmsService] Generated claim spell');

        const result = await this.simulateSpellExecution('claim', {
            vaultId,
            beneficiaryAddress,
            percentage,
        });

        return { ...result, spell };
    }

    /**
     * Cancel a vault and return funds to owner
     */
    async cancelVault(vaultId: string, ownerAddress: string): Promise<SpellResult> {
        await this.initialize();

        console.log('[CharmsService] Canceling vault:', vaultId);

        const spell = `
# BitWill Cancel Spell
version: 2
action: cancel
app_id: ${vaultId}
app_vk: ${this.appVk}

# Cancel parameters
cancel:
  owner: ${ownerAddress}
  return_funds: true

# Proof requirements
proof:
  - verify_owner_signature
  - verify_vault_active
`;

        console.log('[CharmsService] Generated cancel spell');

        const result = await this.simulateSpellExecution('cancel', {
            vaultId,
            ownerAddress,
        });

        return { ...result, spell };
    }

    /**
     * Check vault status based on time elapsed
     */
    checkVaultStatus(
        lastCheckIn: Date,
        inactivityPeriodDays: number
    ): 'active' | 'warning' | 'triggered' {
        const now = Date.now();
        const checkInTime = new Date(lastCheckIn).getTime();
        const inactivityMs = inactivityPeriodDays * 24 * 60 * 60 * 1000;

        const elapsed = now - checkInTime;
        const remaining = inactivityMs - elapsed;

        if (remaining <= 0) {
            return 'triggered';
        } else if (remaining < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days
            return 'warning';
        }

        return 'active';
    }

    // ============================================================
    // PRIVATE METHODS
    // ============================================================

    private generateCreateVaultSpell(
        ownerAddress: string,
        vaultState: VaultCharmState,
        utxoToSpend: string,
        appId: string
    ): string {
        return `
# BitWill Vault Creation Spell
# Creates a new inheritance vault as a Charm NFT

version: 2

# App definition
apps:
  ${appId}:
    vk: ${this.appVk}

# Inputs - UTXO being spent
ins:
  - utxo: ${utxoToSpend}
    charms: []

# Outputs - New charmed UTXO
outs:
  - address: ${ownerAddress}
    sats: ${vaultState.amountSats}
    charms:
      - app: ${appId}
        state:
          type: bitwill_vault
          version: ${vaultState.version}
          owner: "${vaultState.owner}"
          beneficiaries:
${vaultState.beneficiaries.map(b => `            - address: "${b.address}"
              name: "${b.name}"
              percentage: ${b.percentage}`).join('\n')}
          inactivity_period: ${vaultState.inactivityPeriod}
          last_check_in: ${vaultState.lastCheckIn}
          created_at: ${vaultState.createdAt}
          status: active
          amount_sats: ${vaultState.amountSats}

# Metadata
metadata:
  name: "${vaultState.owner.slice(0, 8)}... Vault"
  description: "BitWill Inheritance Vault"
  ticker: "BTVLT"
`;
    }

    private hashUtxo(utxo: string): string {
        // Simple hash for demo - in production would use SHA256
        let hash = 0;
        for (let i = 0; i < utxo.length; i++) {
            const char = utxo.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'app_' + Math.abs(hash).toString(16).padStart(16, '0');
    }

    private async simulateSpellExecution(
        action: string,
        data: Record<string, unknown>
    ): Promise<SpellResult> {
        // Simulate network delay (would be API call in production)
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log(`[CharmsService] Simulated ${action} execution`);
        console.log('[CharmsService] Data:', JSON.stringify(data, null, 2));

        // Generate mock transaction ID
        const txId = 'tx_' + Date.now().toString(16) + '_' + Math.random().toString(16).slice(2, 10);

        return {
            success: true,
            txId,
            proof: 'zkproof_' + Date.now().toString(36),
        };
    }
}

// Export singleton instance
export const charmsService = new CharmsService();

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Format satoshis to BTC
 */
export function formatBtc(satoshis: number): string {
    return (satoshis / 100_000_000).toFixed(8);
}

/**
 * Parse BTC to satoshis
 */
export function parseBtc(btc: number): number {
    return Math.round(btc * 100_000_000);
}

/**
 * Validate a Bitcoin address
 */
export function isValidBitcoinAddress(address: string): boolean {
    // Testnet addresses
    const testnetRegex = /^(tb1[a-z0-9]{39,59}|[mn2][a-zA-Z0-9]{25,34})$/;
    // Mainnet addresses
    const mainnetRegex = /^(bc1[a-z0-9]{39,59}|[13][a-zA-Z0-9]{25,34})$/;

    return testnetRegex.test(address) || mainnetRegex.test(address);
}

/**
 * Calculate time remaining until vault triggers
 */
export function getTimeRemaining(lastCheckIn: Date, inactivityPeriodDays: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    percentRemaining: number;
} {
    const now = Date.now();
    const checkInTime = new Date(lastCheckIn).getTime();
    const inactivityMs = inactivityPeriodDays * 24 * 60 * 60 * 1000;
    const triggerTime = checkInTime + inactivityMs;

    const remaining = triggerTime - now;
    const percentRemaining = Math.max(0, Math.min(100, (remaining / inactivityMs) * 100));

    if (remaining <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, percentRemaining: 0 };
    }

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false, percentRemaining };
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
