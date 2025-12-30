import { ethers } from 'ethers';

/**
 * Calculate the current price of a voucher in ETH
 * Formula: price = ethReserve / voucherReserve
 */
export const calculatePrice = (voucherReserve, ethReserve) => {
    if (!voucherReserve || voucherReserve === '0' || voucherReserve === 0n) return ethers.BigNumber.from(0);

    try {
        const voucherBN = ethers.BigNumber.from(voucherReserve.toString());
        const ethBN = ethers.BigNumber.from(ethReserve.toString());
        return ethBN.mul(ethers.constants.WeiPerEther).div(voucherBN);
    } catch {
        return ethers.BigNumber.from(0);
    }
};

/**
 * Calculate swap output using constant product formula (x * y = k)
 * Uniswap V2 style with 0.3% fee
 */
export const calculateSwapOutput = (amountIn, reserveIn, reserveOut, feePercent = 0.3) => {
    if (!amountIn || !reserveIn || !reserveOut) return ethers.BigNumber.from(0);

    try {
        const amountInBN = ethers.BigNumber.from(amountIn.toString());
        const reserveInBN = ethers.BigNumber.from(reserveIn.toString());
        const reserveOutBN = ethers.BigNumber.from(reserveOut.toString());

        const feeMultiplier = 1000 - Math.floor(feePercent * 10);
        const amountInWithFee = amountInBN.mul(feeMultiplier);
        const numerator = amountInWithFee.mul(reserveOutBN);
        const denominator = reserveInBN.mul(1000).add(amountInWithFee);

        return numerator.div(denominator);
    } catch {
        return ethers.BigNumber.from(0);
    }
};

/**
 * Apply slippage tolerance to an amount
 */
export const applySlippage = (amount, slippagePercent) => {
    try {
        const amountBN = ethers.BigNumber.from(amount.toString());
        const slippageBasisPoints = Math.floor(slippagePercent * 100);
        const slippageAmount = amountBN.mul(slippageBasisPoints).div(10000);
        return amountBN.sub(slippageAmount);
    } catch {
        return ethers.BigNumber.from(0);
    }
};

/**
 * Calculate the optimal liquidity ratio
 */
export const calculateLiquidityRatio = (voucherReserve, ethReserve) => {
    if (!voucherReserve || !ethReserve) return { voucherRatio: 1, ethRatio: 1 };

    try {
        const voucherBN = ethers.BigNumber.from(voucherReserve.toString());
        const ethBN = ethers.BigNumber.from(ethReserve.toString());

        return {
            voucherReserve: voucherBN,
            ethReserve: ethBN,
            ratio: voucherBN.mul(ethers.constants.WeiPerEther).div(ethBN)
        };
    } catch {
        return { voucherRatio: 1, ethRatio: 1 };
    }
};

/**
 * Calculate the amount of vouchers needed for a given ETH amount to maintain ratio
 */
export const calculateVoucherAmountForEth = (ethAmount, voucherReserve, ethReserve) => {
    if (!ethReserve || ethReserve === '0' || ethReserve === 0n) return ethers.BigNumber.from(0);

    try {
        const ethAmountBN = ethers.BigNumber.from(ethAmount.toString());
        const voucherReserveBN = ethers.BigNumber.from(voucherReserve.toString());
        const ethReserveBN = ethers.BigNumber.from(ethReserve.toString());

        return ethAmountBN.mul(voucherReserveBN).div(ethReserveBN);
    } catch {
        return ethers.BigNumber.from(0);
    }
};

/**
 * Calculate the amount of ETH needed for a given voucher amount to maintain ratio
 */
export const calculateEthAmountForVoucher = (voucherAmount, voucherReserve, ethReserve) => {
    if (!voucherReserve || voucherReserve === '0' || voucherReserve === 0n) return ethers.BigNumber.from(0);

    try {
        const voucherAmountBN = ethers.BigNumber.from(voucherAmount.toString());
        const voucherReserveBN = ethers.BigNumber.from(voucherReserve.toString());
        const ethReserveBN = ethers.BigNumber.from(ethReserve.toString());

        return voucherAmountBN.mul(ethReserveBN).div(voucherReserveBN);
    } catch {
        return ethers.BigNumber.from(0);
    }
};

/**
 * Format price for display
 */
export const formatPrice = (priceInWei) => {
    if (!priceInWei) return '0';
    try {
        return ethers.utils.formatEther(priceInWei);
    } catch {
        return '0';
    }
};

/**
 * Calculate price impact percentage
 */
export const calculatePriceImpact = (amountIn, reserveIn, reserveOut) => {
    if (!amountIn || !reserveIn || !reserveOut) return 0;

    try {
        const amountOut = calculateSwapOutput(amountIn, reserveIn, reserveOut);
        const spotPriceBefore = calculatePrice(reserveIn, reserveOut);

        if (spotPriceBefore.isZero()) return 0;

        const amountInBN = ethers.BigNumber.from(amountIn.toString());
        if (amountInBN.isZero()) return 0;

        const effectivePrice = amountOut.mul(ethers.constants.WeiPerEther).div(amountInBN);
        const diff = effectivePrice.gt(spotPriceBefore)
            ? effectivePrice.sub(spotPriceBefore)
            : spotPriceBefore.sub(effectivePrice);
        const impact = diff.mul(10000).div(spotPriceBefore);

        return impact.toNumber() / 100;
    } catch {
        return 0;
    }
};

/**
 * Validate swap amounts
 */
export const validateSwapAmount = (amount, balance, reserves) => {
    const errors = [];

    if (!amount || amount === '0') {
        errors.push('Enter an amount');
        return errors;
    }

    try {
        const amountBN = ethers.BigNumber.from(amount.toString());
        const balanceBN = ethers.BigNumber.from((balance || 0).toString());

        if (amountBN.gt(balanceBN)) {
            errors.push('Insufficient balance');
        }

        if (reserves && amountBN.gte(ethers.BigNumber.from(reserves.toString()))) {
            errors.push('Amount exceeds liquidity');
        }
    } catch {
        errors.push('Invalid amount');
    }

    return errors;
};
