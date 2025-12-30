import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
    getVoucherTokenContract,
    getVoucherPoolContract,
    checkApproval,
    approvePool,
    handleContractError
} from '../utils/contracts';

export const useContract = (signer, provider) => {
    const [voucherToken, setVoucherToken] = useState(null);
    const [voucherPool, setVoucherPool] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize contracts
    useEffect(() => {
        if (signer || provider) {
            const signerOrProvider = signer || provider;
            setVoucherToken(getVoucherTokenContract(signerOrProvider));
            setVoucherPool(getVoucherPoolContract(signerOrProvider));
        } else {
            setVoucherToken(null);
            setVoucherPool(null);
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
        if (!voucherPool) return { voucherReserve: '0', ethReserve: '0' };

        try {
            const [voucherReserve, ethReserve] = await voucherPool.getReserves(tokenId);
            return { voucherReserve, ethReserve };
        } catch (error) {
            console.error('Failed to get reserves:', error);
            return { voucherReserve: '0', ethReserve: '0' };
        }
    }, [voucherPool]);

    // Get LP balance
    const getLpBalance = useCallback(async (userAddress, tokenId) => {
        if (!voucherPool || !userAddress) return ethers.BigNumber.from(0);

        try {
            return await voucherPool.getUserLpBalance(userAddress, tokenId);
        } catch (error) {
            console.error('Failed to get LP balance:', error);
            return ethers.BigNumber.from(0);
        }
    }, [voucherPool]);

    // Swap voucher for ETH
    const swapVoucherForETH = useCallback(async (tokenId, voucherAmount, minEthOut) => {
        if (!voucherPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await voucherPool.swapVoucherForETH(tokenId, voucherAmount, minEthOut);
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [voucherPool]);

    // Swap ETH for voucher
    const swapETHForVoucher = useCallback(async (tokenId, ethAmount, minVoucherOut) => {
        if (!voucherPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await voucherPool.swapETHForVoucher(tokenId, minVoucherOut, {
                value: ethAmount,
            });
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [voucherPool]);

    // Add liquidity
    const addLiquidity = useCallback(async (tokenId, voucherAmount, ethAmount) => {
        if (!voucherPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await voucherPool.addLiquidity(tokenId, voucherAmount, {
                value: ethAmount,
            });
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [voucherPool]);

    // Remove liquidity
    const removeLiquidity = useCallback(async (tokenId, lpAmount) => {
        if (!voucherPool) throw new Error('Contract not initialized');

        setIsLoading(true);
        try {
            const tx = await voucherPool.removeLiquidity(tokenId, lpAmount);
            await tx.wait();
            return tx;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setIsLoading(false);
        }
    }, [voucherPool]);

    return {
        voucherToken,
        voucherPool,
        isApproved,
        isLoading,
        checkPoolApproval,
        approve,
        getVoucherBalance,
        getReserves,
        getLpBalance,
        swapVoucherForETH,
        swapETHForVoucher,
        addLiquidity,
        removeLiquidity,
    };
};
