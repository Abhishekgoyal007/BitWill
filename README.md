# BitWill - Bitcoin Inheritance Protocol

<p align="center">
  <img src="public/favicon.svg" alt="BitWill Logo" width="80" height="80">
</p>

<p align="center">
  <strong>The world's first programmable inheritance protocol for Bitcoin</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#wallet-integration">Wallet Integration</a> •
  <a href="#charms-integration">Charms Integration</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bitcoin-Testnet4-orange?logo=bitcoin" alt="Bitcoin">
  <img src="https://img.shields.io/badge/Charms-Protocol-blue" alt="Charms">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript" alt="TypeScript">
</p>

---

## 🎯 Problem Statement

Every year, **$140 billion+** worth of Bitcoin becomes permanently inaccessible:
- Private keys are lost
- Owners pass away unexpectedly
- Families have no way to access their loved one's digital assets

Traditional solutions require either:
- Sharing private keys (security risk)
- Trusting centralized custodians
- Complex multi-sig setups

**BitWill solves this with a trustless, programmable "dead man's switch" for Bitcoin.**

## ✨ Features

### 🔐 Secure Vaults
Create programmable vaults that lock your Bitcoin with customizable inheritance rules. You maintain full control of your keys.

### 🔗 Real Wallet Integration
Connect your **Xverse** wallet (or use Demo Mode) to interact with real Bitcoin on Testnet. Sign real transactions with your wallet.

### ⏰ Time-Based Triggers
Set an inactivity period (e.g., 90 days). If you don't "check in" within that period, the vault automatically unlocks for beneficiaries.

### 👨‍👩‍👧‍👦 Multiple Beneficiaries
Designate family members or friends as beneficiaries with custom percentage splits.

### ⚡ Instant Claims
When a vault triggers, beneficiaries can claim their share instantly and trustlessly.

### 🛡️ Non-Custodial
Your keys, your Bitcoin. BitWill never has access to your private keys.

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BITWILL FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. CONNECT WALLET                                                      │
│     ┌─────────┐     ┌─────────────────┐     ┌──────────────────┐        │
│     │ Xverse  │────▶│  Real Wallet    │────▶│  View Balance    │       │
│     └─────────┘     └─────────────────┘     └──────────────────┘        │
│                                                                         │
│  2. CREATE VAULT                                                        │
│     ┌─────────┐     ┌─────────────────┐     ┌──────────────────┐        │
│     │  User   │────▶│  Lock Bitcoin   │────▶│ Set Beneficiaries│       │
│     └─────────┘     └─────────────────┘     └──────────────────┘        │
│                                                      │                  │
│                                                      ▼                  │
│  3. SET INACTIVITY PERIOD               ┌──────────────────────┐        │
│                                          │ Inactivity: 90 days │        │
│                                          └──────────────────────┘       │
│                                                      │                  │
│  4. PERIODIC CHECK-IN                                │                  │
│     ┌─────────────┐                                  │                  │
│     │  Check-In   │◀────── Every X days ────────────┘                  │
│     │  (Resets    │                                                     │
│     │   Timer)    │                                                     │
│     └─────────────┘                                                     │
│            │                                                            │
│            │ If no check-in after inactivity period:                    │
│            ▼                                                            │
│  5. AUTOMATIC TRANSFER                                                  │
│     ┌────────────────────────────────────────────────┐                  │
│     │  Vault Triggers → Beneficiaries Can Claim      │                   │
│     │                                                │                  │
│     │  ┌────────┐  ┌────────┐  ┌────────┐            │                   │
│     │  │ Son 50%│  │Wife 30%│  │Bro 20% │            │                   │
│     │  └────────┘  └────────┘  └────────┘            │                   │
│     └────────────────────────────────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Lucide React** for beautiful icons

### Wallet Integration
- **sats-connect** - Real Bitcoin wallet connection (Xverse, Leather)
- **@scure/btc-signer** - PSBT construction
- **mempool.space API** - Balance and UTXO queries

### Blockchain
- **Charms Protocol** - Programmable tokens on Bitcoin
- **Bitcoin Testnet4** - For development and testing

### Architecture
```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Navigation with wallet selector
│   ├── VaultCard.tsx   # Vault display with on-chain indicator
│   └── ...
├── context/
│   └── WalletContext.tsx  # Wallet & vault state management
├── pages/
│   ├── Landing.tsx     # Landing page
│   ├── Dashboard.tsx   # User dashboard
│   ├── CreateVault.tsx # Vault creation wizard
│   ├── VaultDetail.tsx # Individual vault view
│   └── Claim.tsx       # Beneficiary claim page
├── services/
│   ├── bitcoinWallet.ts    # sats-connect integration
│   ├── psbtBuilder.ts      # PSBT construction
│   └── charms.ts           # Charms Protocol integration
├── types/
│   └── index.ts        # TypeScript type definitions
└── index.css           # Global styles and design system
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- [Xverse Wallet](https://www.xverse.app/) browser extension (for real wallet testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bitwill.git
cd bitwill

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Bitcoin Network (Mainnet, Testnet, Signet)
VITE_BITCOIN_NETWORK=Testnet

# Charms API
VITE_CHARMS_API_URL=https://api.charms.dev
VITE_CHARMS_PROVER_URL=https://prove.charms.dev

# Bitcoin API
VITE_MEMPOOL_API_URL=https://mempool.space/testnet4/api

# App Info
VITE_APP_NAME=BitWill
VITE_APP_VERSION=1.0.0
```

## 🔗 Wallet Integration

BitWill supports **real Bitcoin wallet integration** using the sats-connect library.

### Supported Wallets
- **Xverse Wallet** (Recommended)
- **Leather Wallet**
- **Demo Mode** (No wallet required)

### Connect Your Wallet

1. Install the [Xverse Wallet](https://www.xverse.app/) browser extension
2. Click "Connect Wallet" in the BitWill navbar
3. Select "Xverse Wallet" from the modal
4. Approve the connection request

### Get Testnet BTC

To test real vault creation, you'll need Testnet BTC:

1. **Testnet4 Faucet**: [https://testnet4.anyone.eu.org](https://testnet4.anyone.eu.org)
2. **Alternative**: [mempool.space testnet4 faucet](https://mempool.space/testnet4/faucet)

### Features by Mode

| Feature | Demo Mode | Real Wallet |
|---------|-----------|-------------|
| View Dashboard | ✅ | ✅ |
| Create Vaults | ✅ (Simulated) | ✅ (Real Tx) |
| Check-in | ✅ (Simulated) | ✅ (Real Tx) |
| View Balance | ✅ (Mock) | ✅ (Real Balance) |
| Claim Funds | ✅ (Simulated) | ✅ (Real Tx) |

## 🪄 Charms Integration

BitWill leverages the **Charms Protocol** to create programmable Bitcoin vaults with time-locked inheritance logic.

### How We Use Charms

1. **Vault Creation (Charm Minting)**
   - When a user creates a vault, we mint a new Charm NFT
   - The Charm contains the vault state: beneficiaries, inactivity period, last check-in
   - The Charm is attached to the user's Bitcoin UTXO

2. **Check-In (Charm State Update)**
   - Check-ins update the Charm's `lastCheckIn` timestamp
   - This resets the inactivity timer
   - Each update requires a new spell to be cast

3. **Vault Trigger (Time-Based Condition)**
   - When `currentTime - lastCheckIn > inactivityPeriod`, the vault triggers
   - The Charm's state changes from 'active' to 'triggered'
   - This unlocks the claim functionality for beneficiaries

4. **Claim (Charm Transfer)**
   - Beneficiaries can claim their percentage by spending the Charm
   - The Charm's app logic validates the claim against beneficiary addresses
   - Bitcoin is transferred according to the predefined splits

### PSBT Structure

All vault operations create PSBTs with Charms spell data embedded in OP_RETURN outputs:

```
┌─────────────────────────────────────────────────────────────┐
│                    VAULT CREATION PSBT                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUTS:                                                     │
│  ┌────────────────────────────────────────────┐             │
│  │ User's UTXO (to fund vault)                │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  OUTPUTS:                                                    │
│  ┌────────────────────────────────────────────┐             │
│  │ 1. Owner Address: Vault Amount             │             │
│  ├────────────────────────────────────────────┤             │
│  │ 2. OP_RETURN: Charms Spell Data            │             │
│  │    {                                        │             │
│  │      "action": "create_vault",             │             │
│  │      "owner": "tb1q...",                   │             │
│  │      "beneficiaries": [...],               │             │
│  │      "inactivityPeriod": 7776000           │             │
│  │    }                                        │             │
│  ├────────────────────────────────────────────┤             │
│  │ 3. Change Address: Remaining sats          │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📋 API Reference

### WalletContext

```typescript
interface WalletContextType {
  wallet: WalletState;
  vaults: Vault[];
  claimableVaults: Vault[];
  isLoading: boolean;
  error: string | null;
  connectWallet: (useRealWallet?: boolean) => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  createVault: (name: string, amount: number, beneficiaries: Beneficiary[], inactivityPeriod: number) => Promise<Vault>;
  checkIn: (vaultId: string) => Promise<TransactionResult>;
  claimVault: (vaultId: string) => Promise<TransactionResult>;
  cancelVault: (vaultId: string) => Promise<TransactionResult>;
  clearError: () => void;
  isWalletAvailable: () => boolean;
}
```

### Vault Type

```typescript
interface Vault {
  id: string;
  name: string;
  amount: number;
  amountSats: number;
  beneficiaries: Beneficiary[];
  inactivityPeriod: number;
  lastCheckIn: Date;
  createdAt: Date;
  status: 'active' | 'warning' | 'triggered' | 'claimed' | 'cancelled';
  ownerAddress: string;
  txid?: string;
  vout?: number;
  isOnChain: boolean;
}
```

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] Landing page with value proposition
- [x] Dashboard with vault overview
- [x] Create vault wizard
- [x] Vault detail view with timer
- [x] Beneficiary claim page
- [x] Check-in functionality

### Phase 2: Real Wallet Integration ✅
- [x] sats-connect for Xverse/Leather wallets
- [x] Real balance fetching from mempool.space
- [x] PSBT construction for all operations
- [x] Wallet selector modal (Real vs Demo)
- [x] On-chain indicators and explorer links

### Phase 3: Charms Integration 🔄
- [ ] Integrate Charms Prover API
- [ ] Real spell proof generation
- [ ] Testnet vault deployment
- [ ] On-chain state verification

### Phase 4: Production Ready
- [ ] Mainnet deployment
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] Email/SMS notifications for check-in reminders
- [ ] Multi-signature vault support

## 🧪 Demo

### Quick Start
1. Visit the app at `http://localhost:5173`
2. Click "Connect Wallet" → "Demo Mode" for testing
3. Create a vault with test beneficiaries
4. Try check-in and claim functionality

### Real Wallet Testing
1. Install [Xverse Wallet](https://www.xverse.app/)
2. Switch to Testnet in Xverse settings
3. Get Testnet BTC from a faucet
4. Connect wallet and create real vaults

## 🏆 Hackathon Submission

This project was built for the **BOS Hackathon** - Building Bitcoin Smart Contracts with the BitcoinOS Stack.

### Challenge: Best Idea using Charms - A Programmable Token

**Prize Pool:** Up to $15,000

### How BitWill Uses Charms

BitWill demonstrates the power of programmable tokens on Bitcoin by implementing:
1. **Time-locked state transitions** - Vaults trigger after inactivity period
2. **Multi-party claims** - Multiple beneficiaries with percentage splits
3. **Provable execution** - zkVM proofs ensure trustless inheritance
4. **Real wallet integration** - Sign transactions with your actual Bitcoin wallet

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## 📧 Contact

- GitHub: [@Abhishekgoyal007](https://github.com/Abhishekgoyal007)
- Project: [BitWill on GitHub](https://github.com/Abhishekgoyal007/BitWill)

---

<p align="center">
  Built with ❤️ for the BOS Hackathon 2025
</p>
