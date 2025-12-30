import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
    getVoucherTokenContract,
    getLiquidityPoolContract,
    getEscrowContract,
    checkApproval,
    approvePool,
    handleContractError
} from '../utils/contracts';

// Fallback provider using injected wallet (MetaMask) if available
const getFallbackProvider = () => {
    try {
        if (typeof window !== 'undefined' && window.ethereum) {
            return new ethers.providers.Web3Provider(window.ethereum);
        }
        return null;
    } catch {
        return null;
    }
};

export const useContract = (signer, provider) => {
    const [voucherToken, setVoucherToken] = useState(null);
    const [liquidityPool, setLiquidityPool] = useState(null);
    const [escrow, setEscrow] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize contracts
    useEffect(() => {
        // Use passed provider/signer, or fallback to public RPC for read-only
        const signerOrProvider = signer || provider || getFallbackProvider();

        if (signerOrProvider) {
            setVoucherToken(getVoucherTokenContract(signerOrProvider));
            setLiquidityPool(getLiquidityPoolContract(signerOrProvider));
            setEscrow(getEscrowContract(signerOrProvider));
        } else {
            setVoucherToken(null);
            setLiquidityPool(null);
            setEscrow(null);
        }
    }, [signer, provider]);

    // Check if pool is approved
    const checkPoolApproval = useCallback(async (userAddress) => {
        if (!voucherToken || !userAddress) return false;

        try {
            const approved = await checkApproval(voucherToken, userAddress);
            setIsApproved(approved);
            return approved;
        } catch (error) {
            console.error('Failed to check approval:', error);
            return false;
        }
    }, [voucherToken]);

    // Approve pool
    const approve = useCallback(async () => {
        if (!voucherToken) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await approvePool(voucherToken);
            setIsApproved(true);
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [voucherToken]);

    // Get voucher balance
    const getVoucherBalance = useCallback(async (userAddress, tokenId) => {
        if (!voucherToken || !userAddress) return ethers.BigNumber.from(0);

        try {
            return await voucherToken.balanceOf(userAddress, tokenId);
        } catch (error) {
            console.error('Failed to get balance:', error);
            return ethers.BigNumber.from(0);
        }
    }, [voucherToken]);

    // Get pool reserves
    const getReserves = useCallback(async (tokenId) => {
        if (!liquidityPool) return { voucherReserve: ethers.BigNumber.from(0), ethReserve: ethers.BigNumber.from(0) };

        try {
            const [voucherReserve, ethReserve] = await liquidityPool.getReserves(tokenId);
            return { voucherReserve, ethReserve };
        } catch (error) {
            console.error('Failed to get reserves:', error);
            return { voucherReserve: ethers.BigNumber.from(0), ethReserve: ethers.BigNumber.from(0) };
        }
    }, [liquidityPool]);

    // Get expected ETH out for swap
    const getETHOut = useCallback(async (tokenId, voucherAmount) => {
        if (!liquidityPool) return ethers.BigNumber.from(0);

        try {
            return await liquidityPool.getETHOut(tokenId, voucherAmount);
        } catch (error) {
            console.error('Failed to get ETH out:', error);
            return ethers.BigNumber.from(0);
        }
    }, [liquidityPool]);

    // Get expected vouchers out for swap
    const getVouchersOut = useCallback(async (tokenId, ethAmount) => {
        if (!liquidityPool) return ethers.BigNumber.from(0);

        try {
            return await liquidityPool.getVouchersOut(tokenId, ethAmount);
        } catch (error) {
            console.error('Failed to get vouchers out:', error);
            return ethers.BigNumber.from(0);
        }
    }, [liquidityPool]);

    // Get LP shares for user
    const getLPShares = useCallback(async (userAddress, tokenId) => {
        if (!liquidityPool || !userAddress) return ethers.BigNumber.from(0);

        try {
            return await liquidityPool.liquidityShares(tokenId, userAddress);
        } catch (error) {
            console.error('Failed to get LP shares:', error);
            return ethers.BigNumber.from(0);
        }
    }, [liquidityPool]);

    // Swap voucher for ETH
    const swapVoucherForETH = useCallback(async (tokenId, voucherAmount, minEthOut) => {
        if (!liquidityPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await liquidityPool.swapVoucherForETH(tokenId, voucherAmount, minEthOut);
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [liquidityPool]);

    // Swap ETH for voucher
    const swapETHForVoucher = useCallback(async (tokenId, ethAmount, minVoucherOut) => {
        if (!liquidityPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await liquidityPool.swapETHForVoucher(tokenId, minVoucherOut, {
                value: ethAmount,
            });
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [liquidityPool]);

    // Add liquidity
    const addLiquidity = useCallback(async (tokenId, voucherAmount, ethAmount) => {
        if (!liquidityPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await liquidityPool.addLiquidity(tokenId, voucherAmount, {
                value: ethAmount,
            });
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [liquidityPool]);

    // Remove liquidity
    const removeLiquidity = useCallback(async (tokenId, shares) => {
        if (!liquidityPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await liquidityPool.removeLiquidity(tokenId, shares);
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [liquidityPool]);

    // Redeem voucher
    const redeemVoucher = useCallback(async (tokenId) => {
        if (!liquidityPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await liquidityPool.redeemVoucher(tokenId);
            const receipt = await tx.wait();
            return { tx, receipt };
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [liquidityPool]);

    return {
        voucherToken,
        liquidityPool,
        escrow,
        isApproved,
        isLoading,
        checkPoolApproval,
        approve,
        getVoucherBalance,
        getReserves,
        getETHOut,
        getVouchersOut,
        getLPShares,
        swapVoucherForETH,
        swapETHForVoucher,
        addLiquidity,
        removeLiquidity,
        redeemVoucher,
    };
};
