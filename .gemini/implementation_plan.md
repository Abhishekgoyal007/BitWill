# BitWill - Full Implementation Plan

## 🎯 Goal
Transform BitWill from a demo application to a fully functional Bitcoin inheritance protocol on testnet using **Charms Protocol** and **real wallet integration**.

---

## 📋 Implementation Phases

### Phase 1: Real Bitcoin Wallet Integration 🔐
**Status:** ✅ Complete

#### Completed Tasks:
1. ✅ **Installed sats-connect library**
   - `npm install sats-connect@4.2.x`
   - Supports Xverse and other Bitcoin wallets

2. ✅ **Created Bitcoin Wallet Service** (`src/services/bitcoinWallet.ts`)
   - Wallet connection using `wallet_connect`
   - Get payment and ordinals addresses
   - Network switching (Testnet/Mainnet)
   - PSBT signing capabilities
   - UTXO fetching via mempool.space API
   - Balance queries

3. ✅ **Updated WalletContext.tsx**
   - Supports both real wallet (Xverse) and demo mode
   - Stores real wallet addresses and public keys
   - Implements disconnect functionality
   - Network state management
   - Automatic fallback to demo if wallet unavailable

4. ✅ **Added Wallet Connection UI**
   - Wallet selection modal (Xverse vs Demo)
   - Connected wallet address display
   - Network indicator (Testnet/Mainnet)
   - Wallet type indicator (Real/Demo)
   - Real balance display

5. ✅ **Updated Type Definitions**
   - Extended WalletState with real wallet fields
   - Extended Vault with on-chain tracking fields
   - Added TransactionResult type

---

### Phase 2: PSBT Transaction Building 📝
**Status:** ✅ Complete

#### Completed Tasks:
1. ✅ **Installed Bitcoin libraries**
   - `npm install @scure/btc-signer @scure/base`
   - Required for building PSBTs

2. ✅ **Created PSBT Builder Service** (`src/services/psbtBuilder.ts`)
   - Build vault creation PSBTs
   - Build check-in PSBTs
   - Build claim PSBTs  
   - Build cancel PSBTs
   - Fee estimation from mempool.space

3. ✅ **Integrated with Charms Spells**
   - Embed spell data in OP_RETURN outputs
   - JSON-encoded spell format for BitWill protocol

---

### Phase 3: Charms Protocol Integration 🪄
**Status:** 🔄 In Progress (Requires Charms API)

#### Tasks:
1. **Charms Prover API Integration**
   - Call Charms API to prove spells
   - Handle proof responses
   - Error handling for invalid spells

2. **Update CharmsService**
   - Real spell submission
   - Proof verification
   - Transaction finalization

3. **Vault State Management**
   - Read charm state from transactions
   - Validate vault conditions (time-lock, beneficiaries)

---

### Phase 4: Bitcoin API Integration 📡
**Status:** ✅ Mostly Complete

#### Completed Tasks:
1. ✅ **UTXO Fetching**
   - Integrated with mempool.space API
   - Get user's available UTXOs
   - Track vault UTXOs

2. ✅ **Balance Display**
   - Show real BTC balance from blockchain
   - Show satoshi amounts

3. ✅ **Transaction Broadcasting**
   - Submit signed transactions to network
   - Broadcast via mempool.space API

---

### Phase 5: Complete Vault Flows 🔄
**Status:** 🔄 Framework Ready

The vault flow framework is complete with:
- ✅ PSBT construction for all operations
- ✅ Wallet signing integration
- ✅ Demo mode fallback
- ⏳ End-to-end testing with real wallet needed

#### Flow Status:
1. ✅ **Create Vault Flow** - Framework complete
2. ✅ **Check-In Flow** - Framework complete
3. ✅ **Claim Flow** - Framework complete
4. ✅ **Cancel Flow** - Framework complete

---

## 🛠️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BITWILL FRONTEND                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────┐    ┌───────────────────────────────────┐ │
│  │   WalletContext   │───▶│      BitcoinWalletService         │ │
│  │   (React State)   │    │   (sats-connect integration)      │ │
│  └───────────────────┘    └───────────────────────────────────┘ │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌───────────────────┐    ┌───────────────────────────────────┐ │
│  │   CharmsService   │───▶│       PSBTBuilderService          │ │
│  │  (Spell creation) │    │   (@scure/btc-signer)             │ │
│  └───────────────────┘    └───────────────────────────────────┘ │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌───────────────────┐    ┌───────────────────────────────────┐ │
│  │   Charms API      │    │       Bitcoin Network             │ │
│  │  (Spell proving)  │    │  (mempool.space / testnet4)       │ │
│  └───────────────────┘    └───────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Created/Modified

```
src/
├── services/
│   ├── bitcoinWallet.ts    ✅ Created - sats-connect integration
│   ├── psbtBuilder.ts      ✅ Created - PSBT construction
│   └── charms.ts           ✅ Updated - Added getApiUrl method
├── context/
│   └── WalletContext.tsx   ✅ Updated - Real wallet support
├── types/
│   └── index.ts            ✅ Updated - Extended type definitions
├── components/
│   ├── Navbar.tsx          ✅ Updated - Wallet selector modal
│   ├── Navbar.css          ✅ Updated - Modal & badge styles
│   ├── VaultCard.tsx       ✅ Updated - On-chain indicator
│   └── VaultCard.css       ✅ Updated - Badge styles
└── pages/
    ├── Landing.tsx         ✅ Fixed - Unused import
    ├── Dashboard.tsx       ✅ Fixed - Unused variable
    └── Claim.tsx           ✅ Fixed - onClick handler
```

---

## 🔧 Environment Variables

```env
# Bitcoin Network
VITE_BITCOIN_NETWORK=Testnet

# Charms API
VITE_CHARMS_API_URL=https://api.charms.dev
VITE_CHARMS_PROVER_URL=https://prove.charms.dev

# Bitcoin API (for UTXOs/broadcasts)
VITE_MEMPOOL_API_URL=https://mempool.space/testnet4/api

# App Info
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=BitWill
```

---

## 📚 Dependencies Installed

```bash
npm install sats-connect@latest @scure/btc-signer @scure/base
```

---

## 🏆 Hackathon Success Criteria Progress

1. ✅ Real wallet connection (Xverse/Leather)
2. ✅ PSBT transaction building framework
3. ⏳ Charms protocol integration for vault state (API dependent)
4. ✅ Working inheritance flow framework
5. ✅ Polished UI/UX
6. ⏳ Clear documentation and demo

---

## ⏰ Progress Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Wallet Integration | 2-3 hours | ✅ Complete |
| Phase 2: PSBT Building | 2-3 hours | ✅ Complete |
| Phase 3: Charms Integration | 2-3 hours | 🔄 API Needed |
| Phase 4: Bitcoin API | 1-2 hours | ✅ Complete |
| Phase 5: Complete Flows | 2-3 hours | 🔄 Framework Ready |
| Testing & Polish | 1-2 hours | ⏳ Pending |

---

## 🚀 Next Steps

1. **Test with Xverse Wallet** - Connect real wallet and verify connection
2. **Fund Testnet Wallet** - Get testnet BTC from a faucet
3. **Test Vault Creation** - Create a real on-chain vault
4. **Integrate Charms Prover** - When API is available
5. **End-to-end Flow Testing** - Complete inheritance cycle

---

## ✅ Build Status

**Last Build:** Success ✅
**TypeScript:** No errors
**Bundle Size:** ~128 kB (gzipped)
