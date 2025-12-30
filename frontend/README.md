# Voucher Trading Platform - Frontend

A decentralized marketplace for trading gift vouchers built with **React**, **ethers.js**, and **Ethereum smart contracts**.

## 🚀 Features

- **Direct Smart Contract Integration**: All DeFi operations (swaps, liquidity) talk directly to Ethereum contracts
- **MetaMask Wallet**: Seamless wallet connection and transaction signing
- **AMM Trading**: Automated Market Maker for instant voucher-ETH swaps
- **Liquidity Pools**: Add/remove liquidity to earn trading fees
- **Real-time Price Calculation**: Live price updates based on pool reserves
- **Slippage Protection**: Customizable slippage tolerance for swaps
- **Premium UI**: Dark space theme with glassmorphism and smooth animations
- **Fully Responsive**: Works beautifully on mobile and desktop

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Backend API** (optional, for voucher metadata)
- **Deployed Smart Contracts** (VoucherToken & VoucherPool)

## 🛠️ Installation

1. **Clone or navigate to the project**:
   ```bash
   cd voucher-trading-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your contract addresses:
   ```env
   VITE_VOUCHER_TOKEN_ADDRESS=0xYourVoucherTokenAddress
   VITE_VOUCHER_POOL_ADDRESS=0xYourVoucherPoolAddress
   VITE_API_URL=http://localhost:3001/api
   VITE_CHAIN_ID=1337
   VITE_NETWORK_NAME=Localhost
   ```

## 🏃 Running the App

### Development Mode

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
voucher-trading-frontend/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── Navbar.jsx        # Navigation bar
│   │   ├── WalletConnect.jsx # Wallet connection
│   │   ├── VoucherCard.jsx   # Voucher display card
│   │   ├── SwapInterface.jsx # Swap UI
│   │   └── LiquidityInterface.jsx # Liquidity UI
│   ├── pages/                # Page components
│   │   ├── Home.jsx          # Homepage with voucher grid
│   │   ├── VoucherDetail.jsx # Individual voucher page
│   │   ├── Swap.jsx          # Standalone swap page
│   │   └── Liquidity.jsx     # Standalone liquidity page
│   ├── hooks/                # Custom React hooks
│   │   ├── useWallet.js      # Wallet management
│   │   └── useContract.js    # Contract interactions
│   ├── utils/                # Utility functions
│   │   ├── contracts.js      # Contract ABIs & helpers
│   │   ├── amm.js            # AMM math utilities
│   │   └── api.js            # Backend API client
│   ├── styles/               # CSS files
│   │   └── index.css         # Global design system
│   ├── App.jsx               # Main app component
│   └── main.jsx              # React entry point
├── public/                   # Static assets
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🔧 Configuration

### Smart Contract Setup

1. **Deploy Contracts**: Deploy `VoucherToken` (ERC-1155) and `VoucherPool` (AMM) contracts
2. **Update `.env`**: Add contract addresses to environment variables
3. **Network**: Make sure MetaMask is connected to the same network

### Backend API (Optional)

The frontend works without a backend for all contract interactions. The backend is only needed for:
- Voucher metadata (store names, logos, descriptions)
- Optional authentication
- Optional analytics

If backend is not available, the app will use sample data for demonstration.

## 💡 Usage Guide

### Connect Wallet

1. Click "Connect Wallet" in the top-right corner
2. Approve MetaMask connection
3. Make sure you're on the correct network

### Browse Vouchers

- Homepage displays all available vouchers
- Each card shows store name, face value, current price, and liquidity
- Click on any voucher to see details

### Swap Vouchers

**Option 1: From Voucher Detail Page**
1. Click on a voucher card
2. Select "Swap" tab
3. Choose direction (Voucher → ETH or ETH → Voucher)
4. Enter amount
5. Approve tokens (first time only)
6. Click "Swap"

**Option 2: From Swap Page**
1. Navigate to `/swap`
2. Select voucher from dropdown
3. Follow same steps as above

### Add Liquidity

1. Go to Liquidity page or select a voucher and click "Liquidity" tab
2. Enter voucher amount (ETH amount auto-calculates)
3. Approve tokens (first time only)
4. Click "Add Liquidity"
5. Receive LP tokens

### Remove Liquidity

1. Go to Liquidity page
2. Switch to "Remove Liquidity" tab
3. Enter LP token amount (or use percentage buttons)
4. Click "Remove Liquidity"
5. Receive vouchers and ETH back

## 🎨 Design System

The app uses a **premium dark space theme** with:
- Deep space blue/purple gradients
- Glassmorphism effects with backdrop blur
- Vibrant accent colors (HSL-based palette)
- Smooth animations and transitions
- Responsive grid layouts
- Modern typography (Inter font)

## 🔐 Security Notes

- ⚠️ **Never share your private keys**
- ✅ Always verify contract addresses
- ✅ Check slippage settings before swapping
- ✅ Review transaction details in MetaMask
- ✅ Start with small amounts for testing

## 🐛 Troubleshooting

### MetaMask Not Detected
- Install  MetaMask browser extension
- Refresh the page after installation

### Wrong Network Error
- Click "Wrong Network" button to switch
- Or manually switch in MetaMask to the correct network

### Transaction Fails
- Check you have enough ETH for gas
- Verify you have sufficient balance
- Increase slippage tolerance if needed
- Make sure contracts are deployed correctly

### Backend Connection Failed
- The app will still work for swaps/liquidity
- Voucher metadata will show sample data
- Start your backend API if you want real metadata

## 📚 Technical Details

### Smart Contract Functions Used

**VoucherToken (ERC-1155)**:
- `balanceOf(address, uint256)` - Get voucher balance
- `setApprovalForAll(address, bool)` - Approve pool
- `isApprovedForAll(address, address)` - Check approval

**VoucherPool (AMM)**:
- `getReserves(uint256)` - Get pool reserves
- `swapVoucherForETH(uint256, uint256, uint256)` - Swap vouchers for ETH
- `swapETHForVoucher(uint256, uint256)` - Swap ETH for vouchers
- `addLiquidity(uint256, uint256)` - Add liquidity
- `removeLiquidity(uint256, uint256)` - Remove liquidity
- `getUserLpBalance(address, uint256)` - Get LP token balance

### AMM Formula

The platform uses the **constant product formula** (Uniswap V2 style):

```
x * y = k
```

Where:
- `x` = voucher reserve
- `y` = ETH reserve
- `k` = constant product

With 0.3% trading fee applied to each swap.

## 🤝 Contributing

This is a hackathon/educational project. Feel free to:
- Fork and modify
- Submit issues
- Suggest improvements
- Add new features

## 📄 License

MIT License - feel free to use this code for your own projects!

## 🙏 Acknowledgments

- **Uniswap** - AMM design inspiration
- **ethers.js** - Ethereum library
- **React** - UI framework
- **Vite** - Build tool

---

## 🚀 Quick Start Checklist

- [ ] Install Node.js and npm
- [ ] Install MetaMask
- [ ] Clone/download project
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Update contract addresses in `.env`
- [ ] Run `npm run dev`
- [ ] Connect MetaMask
- [ ] Start trading!

---

**Built with ❤️  for decentralized finance**
