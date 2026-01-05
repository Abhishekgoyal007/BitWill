/**
 * Bitcoin Wallet Service
 * 
 * Real wallet integration using sats-connect for Xverse and other Bitcoin wallets.
 * Supports testnet4 for development and mainnet for production.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let satsConnect: any = null;

// Dynamic import for sats-connect to handle SSR and type issues
async function getSatsConnect() {
    if (!satsConnect) {
        satsConnect = await import('sats-connect');
    }
    return satsConnect;
}

// Types for wallet addresses
export interface WalletAddress {
    address: string;
    publicKey: string;
    purpose: 'payment' | 'ordinals' | 'stacks';
    addressType: string;
}

export interface ConnectedWallet {
    paymentAddress: WalletAddress | null;
    ordinalsAddress: WalletAddress | null;
    network: BitcoinNetwork;
    walletType: 'xverse' | 'leather' | 'other';
}

export type BitcoinNetwork = 'Mainnet' | 'Testnet' | 'Signet';

// Configuration
const NETWORK: BitcoinNetwork = (import.meta.env.VITE_BITCOIN_NETWORK as BitcoinNetwork) || 'Testnet';

// Mempool API for UTXO and balance queries
const MEMPOOL_API_MAINNET = 'https://mempool.space/api';
const MEMPOOL_API_TESTNET = 'https://mempool.space/testnet4/api';

/**
 * Get the appropriate mempool API URL based on network
 */
export function getMempoolApiUrl(): string {
    return NETWORK === 'Mainnet' ? MEMPOOL_API_MAINNET : MEMPOOL_API_TESTNET;
}

/**
 * Bitcoin Wallet Service Class
 */
export class BitcoinWalletService {
    private connectedWallet: ConnectedWallet | null = null;
    private network: BitcoinNetwork;

    constructor(network: BitcoinNetwork = NETWORK) {
        this.network = network;
    }

    /**
     * Check if wallet extension is available
     */
    isWalletAvailable(): boolean {
        return typeof window !== 'undefined' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).XverseProviders !== undefined;
    }

    /**
     * Connect to user's Bitcoin wallet
     */
    async connect(): Promise<ConnectedWallet> {
        try {
            console.log('[BitcoinWallet] Connecting to wallet...');

            const sc = await getSatsConnect();
            const { request, RpcErrorCode, AddressPurpose } = sc;

            const response = await request('wallet_connect', {
                addresses: ['payment', 'ordinals'],
                message: 'BitWill needs wallet access to manage inheritance vaults.',
                network: this.network
            });

            if (response.status === 'success') {
                const addresses = response.result.addresses;

                // Find payment address (for BTC transactions)
                const paymentAddr = addresses.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (addr: any) => addr.purpose === AddressPurpose.Payment
                );

                // Find ordinals address (for Charms/NFTs)
                const ordinalsAddr = addresses.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (addr: any) => addr.purpose === AddressPurpose.Ordinals
                );

                this.connectedWallet = {
                    paymentAddress: paymentAddr ? {
                        address: paymentAddr.address,
                        publicKey: paymentAddr.publicKey,
                        purpose: 'payment',
                        addressType: paymentAddr.addressType
                    } : null,
                    ordinalsAddress: ordinalsAddr ? {
                        address: ordinalsAddr.address,
                        publicKey: ordinalsAddr.publicKey,
                        purpose: 'ordinals',
                        addressType: ordinalsAddr.addressType
                    } : null,
                    network: this.network,
                    walletType: 'xverse'
                };

                console.log('[BitcoinWallet] Connected successfully:', this.connectedWallet);
                return this.connectedWallet;
            } else {
                if (response.error.code === RpcErrorCode.USER_REJECTION) {
                    throw new Error('User rejected wallet connection');
                }
                throw new Error(response.error.message || 'Failed to connect wallet');
            }
        } catch (error) {
            console.error('[BitcoinWallet] Connection error:', error);
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    disconnect(): void {
        this.connectedWallet = null;
        console.log('[BitcoinWallet] Disconnected');
    }

    /**
     * Get connected wallet
     */
    getConnectedWallet(): ConnectedWallet | null {
        return this.connectedWallet;
    }

    /**
     * Get wallet address for display
     */
    getDisplayAddress(): string | null {
        if (!this.connectedWallet) return null;
        return this.connectedWallet.paymentAddress?.address ||
            this.connectedWallet.ordinalsAddress?.address ||
            null;
    }

    /**
     * Get balance for an address using mempool.space API
     */
    async getBalance(address?: string): Promise<{ confirmed: number; unconfirmed: number; total: number }> {
        const addr = address || this.connectedWallet?.paymentAddress?.address;
        if (!addr) {
            return { confirmed: 0, unconfirmed: 0, total: 0 };
        }

        try {
            const apiUrl = getMempoolApiUrl();
            const response = await fetch(`${apiUrl}/address/${addr}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch balance: ${response.statusText}`);
            }

            const data = await response.json();

            // Calculate balance from chain stats
            const confirmed = (data.chain_stats?.funded_txo_sum || 0) - (data.chain_stats?.spent_txo_sum || 0);
            const unconfirmed = (data.mempool_stats?.funded_txo_sum || 0) - (data.mempool_stats?.spent_txo_sum || 0);

            return {
                confirmed, // in satoshis
                unconfirmed, // in satoshis
                total: confirmed + unconfirmed
            };
        } catch (error) {
            console.error('[BitcoinWallet] Error fetching balance:', error);
            return { confirmed: 0, unconfirmed: 0, total: 0 };
        }
    }

    /**
     * Get UTXOs for an address
     */
    async getUtxos(address?: string): Promise<UTXO[]> {
        const addr = address || this.connectedWallet?.paymentAddress?.address;
        if (!addr) return [];

        try {
            const apiUrl = getMempoolApiUrl();
            const response = await fetch(`${apiUrl}/address/${addr}/utxo`);

            if (!response.ok) {
                throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
            }

            const utxos = await response.json();
            return utxos.map((utxo: MempoolUTXO) => ({
                txid: utxo.txid,
                vout: utxo.vout,
                value: utxo.value, // satoshis
                status: {
                    confirmed: utxo.status.confirmed,
                    blockHeight: utxo.status.block_height
                }
            }));
        } catch (error) {
            console.error('[BitcoinWallet] Error fetching UTXOs:', error);
            return [];
        }
    }

    /**
     * Sign a PSBT with the user's wallet
     */
    async signPsbt(psbtBase64: string, signInputs: Record<string, number[]>, broadcast: boolean = false): Promise<SignPsbtResult> {
        try {
            console.log('[BitcoinWallet] Requesting PSBT signature...');

            const sc = await getSatsConnect();
            const { request, RpcErrorCode } = sc;

            const response = await request('signPsbt', {
                psbt: psbtBase64,
                signInputs,
                broadcast
            });

            if (response.status === 'success') {
                console.log('[BitcoinWallet] PSBT signed successfully');
                return {
                    success: true,
                    signedPsbt: response.result.psbt,
                    txid: response.result.txid
                };
            } else {
                if (response.error.code === RpcErrorCode.USER_REJECTION) {
                    return {
                        success: false,
                        error: 'User rejected the transaction'
                    };
                }
                return {
                    success: false,
                    error: response.error.message || 'Failed to sign PSBT'
                };
            }
        } catch (error) {
            console.error('[BitcoinWallet] PSBT signing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error signing PSBT'
            };
        }
    }

    /**
     * Sign a message with the user's wallet
     */
    async signMessage(message: string, address?: string): Promise<{ signature: string } | null> {
        const addr = address || this.connectedWallet?.paymentAddress?.address;
        if (!addr) return null;

        try {
            const sc = await getSatsConnect();
            const { request } = sc;

            const response = await request('signMessage', {
                address: addr,
                message
            });

            if (response.status === 'success') {
                return { signature: response.result.signature };
            }
            return null;
        } catch (error) {
            console.error('[BitcoinWallet] Message signing error:', error);
            return null;
        }
    }

    /**
     * Broadcast a raw transaction
     */
    async broadcastTransaction(txHex: string): Promise<{ txid: string } | null> {
        try {
            const apiUrl = getMempoolApiUrl();
            const response = await fetch(`${apiUrl}/tx`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: txHex
            });

            if (response.ok) {
                const txid = await response.text();
                console.log('[BitcoinWallet] Transaction broadcasted:', txid);
                return { txid };
            } else {
                const errorText = await response.text();
                console.error('[BitcoinWallet] Broadcast failed:', errorText);
                return null;
            }
        } catch (error) {
            console.error('[BitcoinWallet] Broadcast error:', error);
            return null;
        }
    }

    /**
     * Get current network
     */
    getNetwork(): BitcoinNetwork {
        return this.network;
    }
}

// Type definitions
export interface UTXO {
    txid: string;
    vout: number;
    value: number; // satoshis
    status: {
        confirmed: boolean;
        blockHeight?: number;
    };
}

interface MempoolUTXO {
    txid: string;
    vout: number;
    value: number;
    status: {
        confirmed: boolean;
        block_height?: number;
    };
}

export interface SignPsbtResult {
    success: boolean;
    signedPsbt?: string;
    txid?: string;
    error?: string;
}

// Export singleton instance
export const bitcoinWallet = new BitcoinWalletService();

// Export helper to format satoshis to BTC
export function satsToBtc(sats: number): number {
    return sats / 100_000_000;
}

// Export helper to format BTC to satoshis
export function btcToSats(btc: number): number {
    return Math.round(btc * 100_000_000);
}

// Format address for display (truncate middle)
export function formatAddress(address: string, chars: number = 6): string {
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
