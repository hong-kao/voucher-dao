import { ethers } from 'ethers';

// Contract ABIs
export const VOUCHER_TOKEN_ABI = [
    // ERC-1155 Standard Functions
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address account, address operator) view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",

    // Custom minting (may need owner privileges)
    "function mint(address to, uint256 id, uint256 amount, bytes data)",

    // Events
    "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    "event ApprovalForAll(address indexed account, address indexed operator, bool approved)"
];

export const VOUCHER_POOL_ABI = [
    // View Functions
    "function getReserves(uint256 tokenId) view returns (uint256 voucherReserve, uint256 ethReserve)",
    "function getPrice(uint256 tokenId) view returns (uint256)",
    "function getUserLpBalance(address user, uint256 tokenId) view returns (uint256)",

    // Swap Functions
    "function swapVoucherForETH(uint256 tokenId, uint256 voucherAmount, uint256 minEthOut)",
    "function swapETHForVoucher(uint256 tokenId, uint256 minVoucherOut) payable",

    // Liquidity Functions
    "function addLiquidity(uint256 tokenId, uint256 voucherAmount) payable returns (uint256 lpTokens)",
    "function removeLiquidity(uint256 tokenId, uint256 lpAmount) returns (uint256 voucherAmount, uint256 ethAmount)",

    // Events
    "event Swap(address indexed user, uint256 indexed tokenId, uint256 voucherAmount, uint256 ethAmount, bool isVoucherToEth)",
    "event LiquidityAdded(address indexed user, uint256 indexed tokenId, uint256 voucherAmount, uint256 ethAmount, uint256 lpTokens)",
    "event LiquidityRemoved(address indexed user, uint256 indexed tokenId, uint256 voucherAmount, uint256 ethAmount, uint256 lpTokens)"
];

// Contract Addresses from environment variables
export const VOUCHER_TOKEN_ADDRESS = import.meta.env.VITE_VOUCHER_TOKEN_ADDRESS;
export const VOUCHER_POOL_ADDRESS = import.meta.env.VITE_VOUCHER_POOL_ADDRESS;

// Initialize contract instances
export const getVoucherTokenContract = (signerOrProvider) => {
    return new ethers.Contract(VOUCHER_TOKEN_ADDRESS, VOUCHER_TOKEN_ABI, signerOrProvider);
};

export const getVoucherPoolContract = (signerOrProvider) => {
    return new ethers.Contract(VOUCHER_POOL_ADDRESS, VOUCHER_POOL_ABI, signerOrProvider);
};

// Helper function to check if user has approved the pool
export const checkApproval = async (voucherTokenContract, userAddress) => {
    return await voucherTokenContract.isApprovedForAll(userAddress, VOUCHER_POOL_ADDRESS);
};

// Helper function to approve pool for all tokens
export const approvePool = async (voucherTokenContract) => {
    const tx = await voucherTokenContract.setApprovalForAll(VOUCHER_POOL_ADDRESS, true);
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
