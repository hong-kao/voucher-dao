import { ethers } from 'ethers';

// Contract ABIs - matching deployed contracts
export const VOUCHER_TOKEN_ABI = [
    // ERC-1155 Standard Functions
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address account, address operator) view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",

    // Custom VoucherToken functions
    "function create_voucher_type(uint256 token_id, string name, uint256 face_value)",
    "function mint(address to, uint256 token_id, uint256 amount)",
    "function burn(address from, uint256 token_id, uint256 amount)",
    "function get_voucher_info(uint256 token_id) view returns (string name, uint256 face_value, bool exists)",
    "function voucher_names(uint256) view returns (string)",
    "function face_values(uint256) view returns (uint256)",
    "function token_exists(uint256) view returns (bool)",

    // Events
    "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
    "event VoucherTypeCreated(uint256 indexed token_id, string name, uint256 face_value)",
    "event VouchersMinted(address indexed to, uint256 indexed token_id, uint256 amount)",
    "event VouchersBurned(address indexed from, uint256 indexed token_id, uint256 amount)"
];

export const LIQUIDITY_POOL_ABI = [
    // View Functions
    "function getReserves(uint256 voucherId) view returns (uint256 voucherReserve, uint256 ethReserve)",
    "function getETHOut(uint256 voucherId, uint256 voucherAmountIn) view returns (uint256)",
    "function getVouchersOut(uint256 voucherId, uint256 ethAmountIn) view returns (uint256)",
    "function voucherReserves(uint256) view returns (uint256)",
    "function ethReserves(uint256) view returns (uint256)",
    "function liquidityShares(uint256, address) view returns (uint256)",
    "function totalLiquidityShares(uint256) view returns (uint256)",
    "function getRedemption(uint256 redeemId) view returns (address user, uint256 voucherId, uint256 timestamp, bool exists)",

    // State-changing Functions
    "function depositVoucher(uint256 voucherId, uint256 amount)",
    "function swapVoucherForETH(uint256 voucherId, uint256 voucherAmount, uint256 minETHOut)",
    "function swapETHForVoucher(uint256 voucherId, uint256 minVouchersOut) payable",
    "function addLiquidity(uint256 voucherId, uint256 voucherAmount) payable",
    "function removeLiquidity(uint256 voucherId, uint256 shares)",
    "function redeemVoucher(uint256 voucherId)",

    // Events
    "event VoucherDeposited(address indexed user, uint256 indexed voucherId, uint256 amount)",
    "event VoucherSwappedForETH(address indexed user, uint256 indexed voucherId, uint256 voucherAmount, uint256 ethAmount)",
    "event ETHSwappedForVoucher(address indexed user, uint256 indexed voucherId, uint256 ethAmount, uint256 voucherAmount)",
    "event LiquidityAdded(address indexed provider, uint256 indexed voucherId, uint256 voucherAmount, uint256 ethAmount, uint256 shares)",
    "event LiquidityRemoved(address indexed provider, uint256 indexed voucherId, uint256 voucherAmount, uint256 ethAmount, uint256 shares)",
    "event VoucherRedeemed(address indexed user, uint256 indexed voucherId, uint256 redeemId)"
];

export const ESCROW_ABI = [
    // View Functions
    "function getEscrow(uint256 escrowId) view returns (address seller, address buyer, uint256 voucherId, uint256 amount, uint256 ethAmount, uint8 status, uint256 createdAt, bool exists)",
    "function getActiveEscrowsForUser(address user) view returns (uint256[])",
    "function escrowCounter() view returns (uint256)",

    // State-changing Functions  
    "function createEscrow(address buyer, uint256 voucherId, uint256 amount, uint256 ethAmount) returns (uint256)",
    "function buyAndRelease(uint256 escrowId) payable",
    "function refundEscrow(uint256 escrowId)",
    "function disputeEscrow(uint256 escrowId)",
    "function resolveDispute(uint256 escrowId, bool releaseToBuyer)",

    // Events
    "event EscrowCreated(uint256 indexed escrowId, address indexed seller, address indexed buyer, uint256 voucherId, uint256 amount, uint256 ethAmount)",
    "event VoucherReleased(uint256 indexed escrowId, address indexed buyer)",
    "event EscrowRefunded(uint256 indexed escrowId, address indexed seller)",
    "event EscrowDisputed(uint256 indexed escrowId, address indexed disputer)",
    "event DisputeResolved(uint256 indexed escrowId, address winner)"
];

// Contract Addresses from environment variables
export const VOUCHER_TOKEN_ADDRESS = import.meta.env.VITE_VOUCHER_TOKEN_ADDRESS;
export const LIQUIDITY_POOL_ADDRESS = import.meta.env.VITE_LIQUIDITY_POOL_ADDRESS;
export const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_ADDRESS;

// Initialize contract instances
export const getVoucherTokenContract = (signerOrProvider) => {
    return new ethers.Contract(VOUCHER_TOKEN_ADDRESS, VOUCHER_TOKEN_ABI, signerOrProvider);
};

export const getLiquidityPoolContract = (signerOrProvider) => {
    return new ethers.Contract(LIQUIDITY_POOL_ADDRESS, LIQUIDITY_POOL_ABI, signerOrProvider);
};

export const getEscrowContract = (signerOrProvider) => {
    return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signerOrProvider);
};

// Helper function to check if user has approved the pool
export const checkApproval = async (voucherTokenContract, userAddress) => {
    return await voucherTokenContract.isApprovedForAll(userAddress, LIQUIDITY_POOL_ADDRESS);
};

// Helper function to approve pool for all tokens
export const approvePool = async (voucherTokenContract) => {
    const tx = await voucherTokenContract.setApprovalForAll(LIQUIDITY_POOL_ADDRESS, true);
    await tx.wait();
    return tx;
};

// Error handling helper
export const handleContractError = (error) => {
    console.error('Contract Error:', error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
        return 'Insufficient funds for transaction';
    }

    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return 'Transaction may fail. Please check your inputs.';
    }

    if (error.message?.includes('user rejected')) {
        return 'Transaction rejected by user';
    }

    if (error.reason) {
        return error.reason;
    }

    return 'Transaction failed. Please try again.';
};
