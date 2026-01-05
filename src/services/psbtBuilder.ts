/**
 * PSBT Builder Service
 * 
 * Constructs Bitcoin transactions (PSBTs) for BitWill vault operations.
 * Integrates Charms spell data into OP_RETURN outputs.
 */

import * as btc from '@scure/btc-signer';
import { hex, base64 } from '@scure/base';
import type { UTXO } from './bitcoinWallet';

// Network configuration
const NETWORK_CONFIG = {
    Mainnet: btc.NETWORK,
    Testnet: btc.TEST_NETWORK,
    Signet: btc.TEST_NETWORK, // Signet uses similar config to testnet
};

export type NetworkType = keyof typeof NETWORK_CONFIG;

// Vault creation params
export interface CreateVaultParams {
    ownerAddress: string;
    ownerPublicKey: string;
    amountSats: number;
    beneficiaries: {
        address: string;
        name: string;
        percentage: number;
    }[];
    inactivityPeriodDays: number;
    utxos: UTXO[];
    feeRate: number; // sats/vbyte
}

// Check-in params
export interface CheckInParams {
    vaultUtxo: UTXO;
    ownerAddress: string;
    ownerPublicKey: string;
    feeRate: number;
}

// Claim params
export interface ClaimParams {
    vaultUtxo: UTXO;
    beneficiaryAddress: string;
    beneficiaryPublicKey: string;
    claimAmountSats: number;
    feeRate: number;
}

// Cancel params
export interface CancelParams {
    vaultUtxo: UTXO;
    ownerAddress: string;
    ownerPublicKey: string;
    feeRate: number;
}

// PSBT result
export interface PsbtResult {
    psbtBase64: string;
    psbtHex: string;
    fee: number;
    inputCount: number;
    outputCount: number;
}

/**
 * PSBT Builder Class
 */
export class PSBTBuilder {
    private network: typeof btc.NETWORK;
    private networkType: NetworkType;

    constructor(networkType: NetworkType = 'Testnet') {
        this.networkType = networkType;
        this.network = NETWORK_CONFIG[networkType];
    }

    /**
     * Build a vault creation PSBT
     * 
     * This creates a transaction that:
     * 1. Spends user UTXOs
     * 2. Creates a vault output with Charms spell in OP_RETURN
     * 3. Returns change to user
     */
    async buildCreateVaultPsbt(params: CreateVaultParams): Promise<PsbtResult> {
        const { ownerAddress, ownerPublicKey, amountSats, beneficiaries, inactivityPeriodDays, utxos, feeRate } = params;

        console.log('[PSBTBuilder] Building create vault PSBT...');
        console.log('[PSBTBuilder] Amount:', amountSats, 'sats');
        console.log('[PSBTBuilder] UTXOs:', utxos.length);

        // Calculate total input value
        const totalInputSats = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

        // Estimate transaction size (rough estimate)
        // P2WPKH input: ~68 vbytes, P2TR input: ~57.5 vbytes
        // P2WPKH output: 31 vbytes, P2TR output: 43 vbytes, OP_RETURN: variable
        const estimatedSize = utxos.length * 68 + 31 + 31 + 100; // inputs + vault output + change + OP_RETURN
        const estimatedFee = Math.ceil(estimatedSize * feeRate);

        // Check if we have enough funds
        if (totalInputSats < amountSats + estimatedFee) {
            throw new Error(`Insufficient funds. Have ${totalInputSats} sats, need ${amountSats + estimatedFee} sats`);
        }

        // Calculate change
        const changeSats = totalInputSats - amountSats - estimatedFee;

        // Generate vault ID
        const vaultId = this.generateVaultId(utxos[0]);

        // Create Charms spell data for vault
        const spellData = this.createVaultSpellData({
            vaultId,
            owner: ownerAddress,
            beneficiaries,
            inactivityPeriodDays,
            amountSats,
            createdAt: Math.floor(Date.now() / 1000)
        });

        // Build the transaction with allowUnknownOutputs for OP_RETURN
        const tx = new btc.Transaction({ allowUnknownOutputs: true });

        // Add inputs
        for (const utxo of utxos) {
            tx.addInput({
                txid: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    script: btc.p2wpkh(hex.decode(ownerPublicKey)).script,
                    amount: BigInt(utxo.value)
                }
            });
        }

        // Add vault output (locked Bitcoin)
        tx.addOutputAddress(ownerAddress, BigInt(amountSats), this.network);

        // Add OP_RETURN with Charms spell data
        // OP_RETURN = 0x6a, then push the data
        const opReturnScript = this.buildOpReturnScript(spellData);
        tx.addOutput({
            script: opReturnScript,
            amount: BigInt(0)
        });

        // Add change output if significant
        if (changeSats > 546) { // Dust threshold
            tx.addOutputAddress(ownerAddress, BigInt(changeSats), this.network);
        }

        // Convert to PSBT
        const psbt = tx.toPSBT();
        const psbtBase64 = base64.encode(psbt);
        const psbtHex = hex.encode(psbt);

        console.log('[PSBTBuilder] Vault creation PSBT built');
        console.log('[PSBTBuilder] Vault ID:', vaultId);
        console.log('[PSBTBuilder] Fee:', estimatedFee, 'sats');

        return {
            psbtBase64,
            psbtHex,
            fee: estimatedFee,
            inputCount: utxos.length,
            outputCount: changeSats > 546 ? 3 : 2
        };
    }

    /**
     * Build a check-in PSBT
     * 
     * Updates the vault state to reset the inactivity timer
     */
    async buildCheckInPsbt(params: CheckInParams): Promise<PsbtResult> {
        const { vaultUtxo, ownerAddress, ownerPublicKey, feeRate } = params;

        console.log('[PSBTBuilder] Building check-in PSBT...');

        // Estimate fee
        const estimatedSize = 68 + 31 + 50; // 1 input + 1 output + OP_RETURN
        const estimatedFee = Math.ceil(estimatedSize * feeRate);

        // Amount after fee
        const outputAmount = vaultUtxo.value - estimatedFee;

        if (outputAmount < 546) {
            throw new Error('Vault amount too small for check-in transaction');
        }

        // Create check-in spell data
        const spellData = this.createCheckInSpellData({
            vaultId: `${vaultUtxo.txid}:${vaultUtxo.vout}`,
            checkInTime: Math.floor(Date.now() / 1000)
        });

        // Build transaction with allowUnknownOutputs for OP_RETURN
        const tx = new btc.Transaction({ allowUnknownOutputs: true });

        // Add vault UTXO as input
        tx.addInput({
            txid: vaultUtxo.txid,
            index: vaultUtxo.vout,
            witnessUtxo: {
                script: btc.p2wpkh(hex.decode(ownerPublicKey)).script,
                amount: BigInt(vaultUtxo.value)
            }
        });

        // Add vault output (continue locking)
        tx.addOutputAddress(ownerAddress, BigInt(outputAmount), this.network);

        // Add OP_RETURN with check-in spell
        const opReturnScript = this.buildOpReturnScript(spellData);
        tx.addOutput({
            script: opReturnScript,
            amount: BigInt(0)
        });

        const psbt = tx.toPSBT();

        return {
            psbtBase64: base64.encode(psbt),
            psbtHex: hex.encode(psbt),
            fee: estimatedFee,
            inputCount: 1,
            outputCount: 2
        };
    }

    /**
     * Build a claim PSBT
     * 
     * Allows beneficiary to claim their share from a triggered vault
     */
    async buildClaimPsbt(params: ClaimParams): Promise<PsbtResult> {
        const { vaultUtxo, beneficiaryAddress, beneficiaryPublicKey, claimAmountSats, feeRate } = params;

        console.log('[PSBTBuilder] Building claim PSBT...');
        console.log('[PSBTBuilder] Claim amount:', claimAmountSats, 'sats');

        // Estimate fee
        const estimatedSize = 68 + 31 + 31 + 50; // input + claim output + remaining output + OP_RETURN
        const estimatedFee = Math.ceil(estimatedSize * feeRate);

        // Calculate remaining vault amount
        const remainingAmount = vaultUtxo.value - claimAmountSats - estimatedFee;

        // Create claim spell data
        const spellData = this.createClaimSpellData({
            vaultId: `${vaultUtxo.txid}:${vaultUtxo.vout}`,
            beneficiary: beneficiaryAddress,
            claimAmount: claimAmountSats,
            claimTime: Math.floor(Date.now() / 1000)
        });

        // Build transaction with allowUnknownOutputs for OP_RETURN
        const tx = new btc.Transaction({ allowUnknownOutputs: true });

        // Add vault UTXO as input (requires multi-sig or timelock in production)
        tx.addInput({
            txid: vaultUtxo.txid,
            index: vaultUtxo.vout,
            witnessUtxo: {
                // In production, this would be the vault script
                script: btc.p2wpkh(hex.decode(beneficiaryPublicKey)).script,
                amount: BigInt(vaultUtxo.value)
            }
        });

        // Add claim output to beneficiary
        tx.addOutputAddress(beneficiaryAddress, BigInt(claimAmountSats), this.network);

        // Add remaining vault output if significant
        if (remainingAmount > 546) {
            // In production, this would go back to the vault for other beneficiaries
            tx.addOutputAddress(beneficiaryAddress, BigInt(remainingAmount), this.network);
        }

        // Add OP_RETURN with claim spell
        const opReturnScript = this.buildOpReturnScript(spellData);
        tx.addOutput({
            script: opReturnScript,
            amount: BigInt(0)
        });

        const psbt = tx.toPSBT();

        return {
            psbtBase64: base64.encode(psbt),
            psbtHex: hex.encode(psbt),
            fee: estimatedFee,
            inputCount: 1,
            outputCount: remainingAmount > 546 ? 3 : 2
        };
    }

    /**
     * Build a cancel vault PSBT
     * 
     * Returns funds to owner and closes the vault
     */
    async buildCancelPsbt(params: CancelParams): Promise<PsbtResult> {
        const { vaultUtxo, ownerAddress, ownerPublicKey, feeRate } = params;

        console.log('[PSBTBuilder] Building cancel PSBT...');

        // Estimate fee
        const estimatedSize = 68 + 31 + 50;
        const estimatedFee = Math.ceil(estimatedSize * feeRate);

        const outputAmount = vaultUtxo.value - estimatedFee;

        if (outputAmount < 546) {
            throw new Error('Vault amount too small for cancellation');
        }

        // Create cancel spell data
        const spellData = this.createCancelSpellData({
            vaultId: `${vaultUtxo.txid}:${vaultUtxo.vout}`,
            cancelTime: Math.floor(Date.now() / 1000)
        });

        // Build transaction with allowUnknownOutputs for OP_RETURN
        const tx = new btc.Transaction({ allowUnknownOutputs: true });

        tx.addInput({
            txid: vaultUtxo.txid,
            index: vaultUtxo.vout,
            witnessUtxo: {
                script: btc.p2wpkh(hex.decode(ownerPublicKey)).script,
                amount: BigInt(vaultUtxo.value)
            }
        });

        // Return funds to owner
        tx.addOutputAddress(ownerAddress, BigInt(outputAmount), this.network);

        // Add OP_RETURN with cancel spell
        const opReturnScript = this.buildOpReturnScript(spellData);
        tx.addOutput({
            script: opReturnScript,
            amount: BigInt(0)
        });

        const psbt = tx.toPSBT();

        return {
            psbtBase64: base64.encode(psbt),
            psbtHex: hex.encode(psbt),
            fee: estimatedFee,
            inputCount: 1,
            outputCount: 2
        };
    }

    /**
     * Build an OP_RETURN script with the given data
     */
    private buildOpReturnScript(data: Uint8Array): Uint8Array {
        // OP_RETURN = 0x6a
        const OP_RETURN = 0x6a;

        // Build script: OP_RETURN <push opcode> <data>
        if (data.length <= 75) {
            // Direct push
            const script = new Uint8Array(2 + data.length);
            script[0] = OP_RETURN;
            script[1] = data.length; // Push opcode for length <= 75
            script.set(data, 2);
            return script;
        } else if (data.length <= 255) {
            // OP_PUSHDATA1
            const script = new Uint8Array(3 + data.length);
            script[0] = OP_RETURN;
            script[1] = 0x4c; // OP_PUSHDATA1
            script[2] = data.length;
            script.set(data, 3);
            return script;
        } else {
            // OP_PUSHDATA2 (for larger data)
            const script = new Uint8Array(4 + data.length);
            script[0] = OP_RETURN;
            script[1] = 0x4d; // OP_PUSHDATA2
            script[2] = data.length & 0xff;
            script[3] = (data.length >> 8) & 0xff;
            script.set(data, 4);
            return script;
        }
    }

    /**
     * Generate a unique vault ID from the first input UTXO
     */
    private generateVaultId(utxo: UTXO): string {
        return `bitwill:${utxo.txid.slice(0, 8)}:${utxo.vout}`;
    }

    /**
     * Create vault creation spell data
     */
    private createVaultSpellData(params: {
        vaultId: string;
        owner: string;
        beneficiaries: { address: string; name: string; percentage: number }[];
        inactivityPeriodDays: number;
        amountSats: number;
        createdAt: number;
    }): Uint8Array {
        // Create a structured spell for Charms
        const spell = {
            protocol: 'bitwill',
            version: 1,
            action: 'create_vault',
            data: {
                id: params.vaultId,
                owner: params.owner,
                beneficiaries: params.beneficiaries.map(b => ({
                    addr: b.address,
                    name: b.name,
                    pct: b.percentage
                })),
                inactivity: params.inactivityPeriodDays * 86400, // Convert to seconds
                amount: params.amountSats,
                created: params.createdAt,
                lastCheckIn: params.createdAt,
                status: 'active'
            }
        };

        // Encode as JSON (in production, would use CBOR or more efficient encoding)
        const jsonStr = JSON.stringify(spell);
        return new TextEncoder().encode(jsonStr);
    }

    /**
     * Create check-in spell data
     */
    private createCheckInSpellData(params: {
        vaultId: string;
        checkInTime: number;
    }): Uint8Array {
        const spell = {
            protocol: 'bitwill',
            version: 1,
            action: 'check_in',
            data: {
                vaultId: params.vaultId,
                timestamp: params.checkInTime
            }
        };
        return new TextEncoder().encode(JSON.stringify(spell));
    }

    /**
     * Create claim spell data
     */
    private createClaimSpellData(params: {
        vaultId: string;
        beneficiary: string;
        claimAmount: number;
        claimTime: number;
    }): Uint8Array {
        const spell = {
            protocol: 'bitwill',
            version: 1,
            action: 'claim',
            data: {
                vaultId: params.vaultId,
                beneficiary: params.beneficiary,
                amount: params.claimAmount,
                timestamp: params.claimTime
            }
        };
        return new TextEncoder().encode(JSON.stringify(spell));
    }

    /**
     * Create cancel spell data
     */
    private createCancelSpellData(params: {
        vaultId: string;
        cancelTime: number;
    }): Uint8Array {
        const spell = {
            protocol: 'bitwill',
            version: 1,
            action: 'cancel',
            data: {
                vaultId: params.vaultId,
                timestamp: params.cancelTime
            }
        };
        return new TextEncoder().encode(JSON.stringify(spell));
    }

    /**
     * Get current fee rate from mempool
     */
    async getFeeRate(priority: 'low' | 'medium' | 'high' = 'medium'): Promise<number> {
        try {
            const apiUrl = this.networkType === 'Mainnet'
                ? 'https://mempool.space/api/v1/fees/recommended'
                : 'https://mempool.space/testnet4/api/v1/fees/recommended';

            const response = await fetch(apiUrl);
            const fees = await response.json();

            switch (priority) {
                case 'low': return fees.hourFee || 1;
                case 'high': return fees.fastestFee || 10;
                default: return fees.halfHourFee || 5;
            }
        } catch (error) {
            console.warn('[PSBTBuilder] Error fetching fee rate, using default:', error);
            return this.networkType === 'Mainnet' ? 5 : 1; // Default fee rates
        }
    }
}

// Export singleton instance
export const psbtBuilder = new PSBTBuilder(
    (import.meta.env.VITE_BITCOIN_NETWORK as NetworkType) || 'Testnet'
);
