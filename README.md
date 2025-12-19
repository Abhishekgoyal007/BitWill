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
  <a href="#charms-integration">Charms Integration</a> •
  <a href="#roadmap">Roadmap</a>
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

### ⏰ Time-Based Triggers
Set an inactivity period (e.g., 90 days). If you don't "check in" within that period, the vault automatically triggers.

### 👨‍👩‍👧‍👦 Multiple Beneficiaries
Designate family members or friends as beneficiaries with custom percentage splits.

### ⚡ Instant Claims
When a vault triggers, beneficiaries can claim their share instantly and trustlessly.

### 🛡️ Non-Custodial
Your keys, your Bitcoin. BitWill never has access to your private keys.

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BITWILL FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. CREATE VAULT                                                         │
│     ┌─────────┐     ┌─────────────────┐     ┌──────────────────┐        │
│     │  User   │────▶│  Lock Bitcoin   │────▶│  Set Beneficiaries│       │
│     └─────────┘     └─────────────────┘     └──────────────────┘        │
│                                                      │                  │
│                                                      ▼                  │
│  2. SET INACTIVITY PERIOD               ┌──────────────────────┐       │
│                                          │ Inactivity: 90 days │        │
│                                          └──────────────────────┘       │
│                                                      │                  │
│  3. PERIODIC CHECK-IN                                │                  │
│     ┌─────────────┐                                  │                  │
│     │  Check-In   │◀────── Every X days ────────────┘                  │
│     │  (Resets    │                                                     │
│     │   Timer)    │                                                     │
│     └─────────────┘                                                     │
│            │                                                            │
│            │ If no check-in after inactivity period:                    │
│            ▼                                                            │
│  4. AUTOMATIC TRANSFER                                                  │
│     ┌────────────────────────────────────────────────┐                  │
│     │  Vault Triggers → Beneficiaries Can Claim     │                  │
│     │                                                │                  │
│     │  ┌────────┐  ┌────────┐  ┌────────┐           │                  │
│     │  │ Son 50%│  │Wife 30%│  │Bro 20% │           │                  │
│     │  └────────┘  └────────┘  └────────┘           │                  │
│     └────────────────────────────────────────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Lucide React** for icons
- **CSS Variables** for theming

### Blockchain Integration
- **Charms Protocol** - Programmable tokens on Bitcoin
- **Bitcoin Testnet** - For development and testing

### Architecture
```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Navigation with wallet connection
│   ├── VaultCard.tsx   # Vault display card
│   └── ...
├── context/
│   └── WalletContext.tsx  # Wallet state management
├── pages/
│   ├── Landing.tsx     # Landing page
│   ├── Dashboard.tsx   # User dashboard
│   ├── CreateVault.tsx # Vault creation wizard
│   ├── VaultDetail.tsx # Individual vault view
│   └── Claim.tsx       # Beneficiary claim page
├── services/
│   └── charms.ts       # Charms Protocol integration
├── types/
│   └── index.ts        # TypeScript type definitions
└── index.css           # Global styles and design system
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

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
VITE_CHARMS_API_URL=https://api.charms.dev
VITE_BITCOIN_NETWORK=testnet
```

## 🔗 Charms Integration

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

### Charm App Contract (Pseudo-code)

```rust
pub fn app_contract(
    app: &App,
    tx: &Transaction,
    x: &VaultState,
    w: &Witness
) -> bool {
    match w.action {
        Action::CheckIn => {
            // Verify owner signature
            verify_owner_signature(tx, x.owner_address) &&
            // Update last check-in time
            x.last_check_in = current_time() &&
            x.status == VaultStatus::Active
        },
        Action::Claim => {
            // Verify vault is triggered
            is_triggered(x) &&
            // Verify claimer is a beneficiary
            is_valid_beneficiary(w.claimer, x.beneficiaries) &&
            // Verify correct amount is being claimed
            verify_claim_amount(tx, w.claimer, x.beneficiaries)
        },
        Action::Cancel => {
            // Only owner can cancel
            verify_owner_signature(tx, x.owner_address) &&
            x.status == VaultStatus::Active
        }
    }
}
```

### Spell Structure

```yaml
# Create Vault Spell
version: 2
apps:
  $app_id:
    id: $app_vk
    binary: ./target/riscv32im-risc0-zkvm-elf/release/bitwill-vault
ins:
  - utxo: $owner_utxo
    charms: []
outs:
  - address: $owner_address
    sats: 10000
    charms:
      - app: $app_id@$app_vk
        charm:
          type: vault
          owner: $owner_address
          beneficiaries: $beneficiaries
          inactivity_period: 7776000  # 90 days in seconds
          last_check_in: $current_timestamp
          status: active
          amount: 100000000  # 1 BTC in satoshis
```

## 📋 API Reference

### WalletContext

```typescript
interface WalletContextType {
  wallet: WalletState;
  vaults: Vault[];
  claimableVaults: Vault[];
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  createVault: (data: CreateVaultFormData) => Promise<void>;
  checkIn: (vaultId: string) => Promise<void>;
  claimVault: (vaultId: string) => Promise<void>;
  cancelVault: (vaultId: string) => Promise<void>;
}
```

### Vault Type

```typescript
interface Vault {
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
```

## 🗺️ Roadmap

### Phase 1: MVP (Current) ✅
- [x] Landing page with value proposition
- [x] Wallet connection (mock)
- [x] Dashboard with vault overview
- [x] Create vault wizard
- [x] Vault detail view with timer
- [x] Beneficiary claim page
- [x] Check-in functionality

### Phase 2: Charms Integration 🔄
- [ ] Integrate Charms SDK
- [ ] Implement vault creation as Charm minting
- [ ] Implement check-in as state update
- [ ] Implement claim flow with proof verification
- [ ] Testnet deployment

### Phase 3: Production Ready
- [ ] Mainnet deployment
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] Email/SMS notifications for check-in reminders
- [ ] Multi-signature vault support
- [ ] Recovery options (trusted contacts)
- [ ] Mobile app

### Phase 4: Advanced Features
- [ ] Recurring payments to beneficiaries
- [ ] Condition-based inheritance (not just time)
- [ ] Integration with legal frameworks
- [ ] Estate planning partnerships
- [ ] Insurance integration

## 🧪 Demo

Visit the live demo: [Coming Soon]

### Demo Credentials
- The app automatically connects with a mock wallet
- Test vault creation, check-ins, and claims

## 🏆 Hackathon Submission

This project was built for the **BOS Hackathon** - Building Bitcoin Smart Contracts with the BitcoinOS Stack.

### Challenge: Best Idea using Charms - A Programmable Token

**Prize Pool:** Up to $15,000

### How BitWill Uses Charms

BitWill demonstrates the power of programmable tokens on Bitcoin by implementing:
1. **Time-locked state transitions** - Vaults trigger after inactivity period
2. **Multi-party claims** - Multiple beneficiaries with percentage splits
3. **Provable execution** - zkVM proofs ensure trustless inheritance

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## 📧 Contact

- GitHub: [@abhishekgoyal](https://github.com/abhishekgoyal)
- Twitter: [@abhishekgoyal](https://twitter.com/abhishekgoyal)

---

<p align="center">
  Built with ❤️ for the BOS Hackathon 2025
</p>
