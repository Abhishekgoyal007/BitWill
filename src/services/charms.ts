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
 */

import type { Vault, Beneficiary } from '../types';

// Configuration
const CHARMS_API_URL = import.meta.env.VITE_CHARMS_API_URL || 'https://api.charms.dev';
const BITCOIN_NETWORK = import.meta.env.VITE_BITCOIN_NETWORK || 'testnet';

// Vault state as stored in the Charm
interface VaultCharmState {
    type: 'vault';
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

// Spell actions
type SpellAction = 'create' | 'check_in' | 'claim' | 'cancel';

// Transaction result
interface SpellResult {
    success: boolean;
    txId?: string;
    error?: string;
    proof?: string;
}

/**
 * Charms Protocol Service
 * 
 * Provides methods for creating and managing BitWill vaults using Charms Protocol.
 */
export class CharmsService {
    private apiUrl: string;
    private network: string;
    private appVk: string | null = null;

    constructor() {
        this.apiUrl = CHARMS_API_URL;
        this.network = BITCOIN_NETWORK;
    }

    /**
     * Initialize the service with the app verification key
     * The VK identifies our BitWill app contract
     */
    async initialize(): Promise<void> {
        // In production, this would load our pre-compiled app VK
        // For demo, we use a mock VK
        this.appVk = 'bitwill_app_vk_' + Date.now().toString(36);
        console.log('[CharmsService] Initialized with VK:', this.appVk);
    }

    /**
     * Create a new inheritance vault
     * 
     * This mints a new Charm NFT containing the vault state and attaches it
     * to the user's Bitcoin UTXO.
     */
    async createVault(
        ownerAddress: string,
        name: string,
        amountSats: number,
        beneficiaries: Beneficiary[],
        inactivityPeriodDays: number,
        utxoToSpend: string
    ): Promise<SpellResult> {
        console.log('[CharmsService] Creating vault...');

        // Convert beneficiaries to charm format
        const charmBeneficiaries = beneficiaries.map(b => ({
            address: b.address,
            name: b.name,
            percentage: b.percentage,
        }));

        // Vault state for the charm
        const vaultState: VaultCharmState = {
            type: 'vault',
            owner: ownerAddress,
            beneficiaries: charmBeneficiaries,
            inactivityPeriod: inactivityPeriodDays * 24 * 60 * 60, // Convert to seconds
            lastCheckIn: Math.floor(Date.now() / 1000),
            createdAt: Math.floor(Date.now() / 1000),
            status: 'active',
            amountSats,
        };

        // Generate the spell YAML
        const spell = this.generateCreateVaultSpell(
            ownerAddress,
            vaultState,
            utxoToSpend
        );

        console.log('[CharmsService] Generated spell:', spell);

        // In production, this would:
        // 1. Send the spell to the Charms API
        // 2. Get back a proof
        // 3. Create a Bitcoin transaction with the spell
        // 4. Return the txId

        // For demo, we simulate success
        return this.simulateSpellExecution('create', {
            vaultState,
            spell,
        });
    }

    /**
     * Perform a check-in to reset the inactivity timer
     * 
     * This updates the Charm's lastCheckIn timestamp without moving the Bitcoin.
     */
    async checkIn(vaultId: string, ownerAddress: string): Promise<SpellResult> {
        console.log('[CharmsService] Checking in for vault:', vaultId);

        const spell = this.generateCheckInSpell(vaultId, ownerAddress);

        // In production, this would update the charm state on-chain
        return this.simulateSpellExecution('check_in', {
            vaultId,
            spell,
        });
    }

    /**
     * Claim funds from a triggered vault
     * 
     * This allows a beneficiary to claim their percentage of the vault.
     * The charm's app logic validates:
     * 1. The vault is in 'triggered' status
     * 2. The claimer is a valid beneficiary
     * 3. The claim amount matches their percentage
     */
    async claimVault(
        vaultId: string,
        beneficiaryAddress: string
    ): Promise<SpellResult> {
        console.log('[CharmsService] Claiming vault:', vaultId, 'for:', beneficiaryAddress);

        const spell = this.generateClaimSpell(vaultId, beneficiaryAddress);

        // In production, this would:
        // 1. Verify the vault is triggered
        // 2. Calculate the beneficiary's share
        // 3. Create a transaction that splits the UTXO
        // 4. Update the charm state to track the claim

        return this.simulateSpellExecution('claim', {
            vaultId,
            beneficiaryAddress,
            spell,
        });
    }

    /**
     * Cancel a vault and return funds to owner
     * 
     * Only the owner can cancel, and only if the vault is still active.
     */
    async cancelVault(vaultId: string, ownerAddress: string): Promise<SpellResult> {
        console.log('[CharmsService] Canceling vault:', vaultId);

        const spell = this.generateCancelSpell(vaultId, ownerAddress);

        return this.simulateSpellExecution('cancel', {
            vaultId,
            spell,
        });
    }

    /**
     * Check if a vault should be triggered based on inactivity
     */
    async checkVaultStatus(vault: Vault): Promise<'active' | 'warning' | 'triggered'> {
        const now = Date.now();
        const lastCheckIn = new Date(vault.lastCheckIn).getTime();
        const inactivityMs = vault.inactivityPeriod * 24 * 60 * 60 * 1000;

        const elapsed = now - lastCheckIn;
        const remaining = inactivityMs - elapsed;

        if (remaining <= 0) {
            return 'triggered';
        } else if (remaining < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days
            return 'warning';
        }

        return 'active';
    }

    // ============================================================
    // PRIVATE METHODS - Spell Generation
    // ============================================================

    private generateCreateVaultSpell(
        ownerAddress: string,
        vaultState: VaultCharmState,
        utxoToSpend: string
    ): string {
        // Generate app ID from the UTXO being spent (as per Charms spec)
        const appId = this.hashUtxo(utxoToSpend);

        return `
# BitWill Vault Creation Spell
version: 2
apps:
  ${appId}:
    id: ${this.appVk}
    # binary would be: ./target/riscv32im-risc0-zkvm-elf/release/bitwill-vault
ins:
  - utxo: ${utxoToSpend}
    charms: []
outs:
  - address: ${ownerAddress}
    sats: ${vaultState.amountSats}
    charms:
      - app: ${appId}@${this.appVk}
        charm:
          type: vault
          owner: "${vaultState.owner}"
          beneficiaries: ${JSON.stringify(vaultState.beneficiaries)}
          inactivity_period: ${vaultState.inactivityPeriod}
          last_check_in: ${vaultState.lastCheckIn}
          created_at: ${vaultState.createdAt}
          status: active
          amount_sats: ${vaultState.amountSats}
`;
    }

    private generateCheckInSpell(vaultId: string, ownerAddress: string): string {
        const newCheckInTime = Math.floor(Date.now() / 1000);

        return `
# BitWill Check-In Spell
version: 2
# This spell updates the last_check_in timestamp
# The app contract verifies owner signature
action: check_in
vault_id: ${vaultId}
owner: ${ownerAddress}
new_check_in_time: ${newCheckInTime}
`;
    }

    private generateClaimSpell(vaultId: string, beneficiaryAddress: string): string {
        return `
# BitWill Claim Spell
version: 2
# This spell allows a beneficiary to claim their share
# The app contract verifies:
# 1. Vault is in triggered status
# 2. Claimer is a valid beneficiary
# 3. Amount matches percentage
action: claim
vault_id: ${vaultId}
claimer: ${beneficiaryAddress}
`;
    }

    private generateCancelSpell(vaultId: string, ownerAddress: string): string {
        return `
# BitWill Cancel Spell
version: 2
# This spell cancels the vault and returns funds to owner
# The app contract verifies owner signature and active status
action: cancel
vault_id: ${vaultId}
owner: ${ownerAddress}
`;
    }

    // ============================================================
    // PRIVATE METHODS - Utilities
    // ============================================================

    private hashUtxo(utxo: string): string {
        // Simple hash for demo - in production would use SHA256
        let hash = 0;
        for (let i = 0; i < utxo.length; i++) {
            const char = utxo.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    private async simulateSpellExecution(
        action: SpellAction,
        data: Record<string, unknown>
    ): Promise<SpellResult> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate success (in production, this would call the Charms API)
        console.log(`[CharmsService] Simulated ${action} execution:`, data);

        // Generate a mock transaction ID
        const txId = 'tx_' + Date.now().toString(16) + '_' + Math.random().toString(16).slice(2);

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
 * Format Bitcoin amount from satoshis
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
 * Validate a Bitcoin address (basic validation)
 */
export function isValidBitcoinAddress(address: string): boolean {
    // Testnet addresses start with tb1, m, n, or 2
    // Mainnet addresses start with bc1, 1, or 3
    const testnetRegex = /^(tb1[a-z0-9]{39,59}|[mn2][a-zA-Z0-9]{25,34})$/;
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
    isExpired: boolean;
} {
    const now = Date.now();
    const checkInTime = new Date(lastCheckIn).getTime();
    const inactivityMs = inactivityPeriodDays * 24 * 60 * 60 * 1000;
    const triggerTime = checkInTime + inactivityMs;

    const remaining = triggerTime - now;

    if (remaining <= 0) {
        return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    return { days, hours, minutes, isExpired: false };
}
