import { ethers } from 'ethers';

/**
 * Calculate the current price of a voucher in ETH
 * Formula: price = ethReserve / voucherReserve
 */
export const calculatePrice = (voucherReserve, ethReserve) => {
    if (!voucherReserve || voucherReserve === '0') return '0';

    const voucherBN = ethers.BigNumber.from(voucherReserve);
    const ethBN = ethers.BigNumber.from(ethReserve);

    // Return price with 18 decimals precision
    return ethBN.mul(ethers.constants.WeiPerEther).div(voucherBN);
};

/**
 * Calculate swap output using constant product formula (x * y = k)
 * Uniswap V2 style with 0.3% fee
 * 
 * Formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
 */
export const calculateSwapOutput = (amountIn, reserveIn, reserveOut, feePercent = 0.3) => {
    if (!amountIn || !reserveIn || !reserveOut) return ethers.BigNumber.from(0);

    const amountInBN = ethers.BigNumber.from(amountIn);
    const reserveInBN = ethers.BigNumber.from(reserveIn);
    const reserveOutBN = ethers.BigNumber.from(reserveOut);

    // Calculate fee multiplier (997 = 1000 - 3 for 0.3% fee)
    const feeMultiplier = 1000 - Math.floor(feePercent * 10);

    const amountInWithFee = amountInBN.mul(feeMultiplier);
    const numerator = amountInWithFee.mul(reserveOutBN);
    const denominator = reserveInBN.mul(1000).add(amountInWithFee);

    return numerator.div(denominator);
};

/**
 * Apply slippage tolerance to an amount
 */
export const applySlippage = (amount, slippagePercent) => {
    const amountBN = ethers.BigNumber.from(amount);
    const slippageBasisPoints = Math.floor(slippagePercent * 100); // Convert to basis points
    const slippageAmount = amountBN.mul(slippageBasisPoints).div(10000);

    return amountBN.sub(slippageAmount);
};

/**
 * Calculate the optimal liquidity ratio
 * Returns the ratio of vouchers to ETH based on current reserves
 */
export const calculateLiquidityRatio = (voucherReserve, ethReserve) => {
    if (!voucherReserve || !ethReserve) return { voucherRatio: 1, ethRatio: 1 };

    const voucherBN = ethers.BigNumber.from(voucherReserve);
    const ethBN = ethers.BigNumber.from(ethReserve);

    return {
        voucherReserve: voucherBN,
        ethReserve: ethBN,
        ratio: voucherBN.mul(ethers.constants.WeiPerEther).div(ethBN)
    };
};

/**
 * Calculate the amount of vouchers needed for a given ETH amount to maintain ratio
 */
export const calculateVoucherAmountForEth = (ethAmount, voucherReserve, ethReserve) => {
    if (!ethReserve || ethReserve === '0') return ethers.BigNumber.from(0);

    const ethAmountBN = ethers.BigNumber.from(ethAmount);
    const voucherReserveBN = ethers.BigNumber.from(voucherReserve);
    const ethReserveBN = ethers.BigNumber.from(ethReserve);

    return ethAmountBN.mul(voucherReserveBN).div(ethReserveBN);
};

/**
 * Calculate the amount of ETH needed for a given voucher amount to maintain ratio
 */
export const calculateEthAmountForVoucher = (voucherAmount, voucherReserve, ethReserve) => {
    if (!voucherReserve || voucherReserve === '0') return ethers.BigNumber.from(0);

    const voucherAmountBN = ethers.BigNumber.from(voucherAmount);
    const voucherReserveBN = ethers.BigNumber.from(voucherReserve);
    const ethReserveBN = ethers.BigNumber.from(ethReserve);

    return voucherAmountBN.mul(ethReserveBN).div(voucherReserveBN);
};

/**
 * Format price for display (convert from wei to readable format)
 */
export const formatPrice = (priceInWei) => {
    if (!priceInWei) return '0';
    return ethers.utils.formatEther(priceInWei);
};

/**
 * Calculate price impact percentage
 */
export const calculatePriceImpact = (amountIn, reserveIn, reserveOut) => {
    if (!amountIn || !reserveIn || !reserveOut) return 0;

    const amountOut = calculateSwapOutput(amountIn, reserveIn, reserveOut);

    // Calculate spot price before swap
    const spotPriceBefore = calculatePrice(reserveIn, reserveOut);

    // Calculate effective price (what you actually get)
    const amountInBN = ethers.BigNumber.from(amountIn);
    const effectivePrice = amountOut.mul(ethers.constants.WeiPerEther).div(amountInBN);

    // Price impact = (effectivePrice - spotPrice) / spotPrice * 100
    const impact = effectivePrice.sub(spotPriceBefore).mul(10000).div(spotPriceBefore);

    return parseFloat(ethers.utils.formatUnits(impact.abs(), 2));
};

/**
 * Validate swap amounts
 */
export const validateSwapAmount = (amount, balance, reserves) => {
    const errors = [];

    if (!amount || amount === '0') {
        errors.push('Enter an amount');
    }

    const amountBN = ethers.BigNumber.from(amount || '0');
    const balanceBN = ethers.BigNumber.from(balance || '0');

    if (amountBN.gt(balanceBN)) {
        errors.push('Insufficient balance');
    }

    if (reserves && amountBN.gte(ethers.BigNumber.from(reserves))) {
        errors.push('Amount exceeds liquidity');
    }

    return errors;
};
