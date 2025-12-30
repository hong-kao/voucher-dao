import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { calculateSwapOutput, applySlippage, calculatePriceImpact } from '../utils/amm';
import './SwapInterface.css';

const SwapInterface = ({ tokenId, voucherName }) => {
    const { account, signer, provider } = useWallet();
    const contract = useContract(signer, provider);

    const [swapDirection, setSwapDirection] = useState('voucherToEth');
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('0');
    const [slippage, setSlippage] = useState(0.5);
    const [customSlippage, setCustomSlippage] = useState('');
    const [reserves, setReserves] = useState({ voucherReserve: '0', ethReserve: '0' });
    const [balance, setBalance] = useState('0');
    const [priceImpact, setPriceImpact] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!tokenId) return;

            try {
                const res = await contract.getReserves(tokenId);
                setReserves({
                    voucherReserve: res.voucherReserve?.toString() || '0',
                    ethReserve: res.ethReserve?.toString() || '0'
                });

                if (account) {
                    if (swapDirection === 'voucherToEth') {
                        const bal = await contract.getVoucherBalance(account, tokenId);
                        setBalance(bal?.toString() || '0');
                    } else {
                        const bal = await provider.getBalance(account);
                        setBalance(bal?.toString() || '0');
                    }
                }
            } catch (err) {
                console.error('Failed to load data:', err);
            }
        };

        loadData();
    }, [tokenId, account, swapDirection, contract, provider]);

    useEffect(() => {
        if (!inputAmount || inputAmount === '0') {
            setOutputAmount('0');
            setPriceImpact(0);
            return;
        }

        try {
            const amountIn = ethers.utils.parseEther(inputAmount);

            let output;
            if (swapDirection === 'voucherToEth') {
                output = calculateSwapOutput(amountIn, reserves.voucherReserve, reserves.ethReserve);
                const impact = calculatePriceImpact(amountIn, reserves.voucherReserve, reserves.ethReserve);
                setPriceImpact(impact);
            } else {
                output = calculateSwapOutput(amountIn, reserves.ethReserve, reserves.voucherReserve);
                const impact = calculatePriceImpact(amountIn, reserves.ethReserve, reserves.voucherReserve);
                setPriceImpact(impact);
            }

            setOutputAmount(ethers.utils.formatEther(output));
        } catch (err) {
            setOutputAmount('0');
        }
    }, [inputAmount, reserves, swapDirection]);

    const handleSwapDirectionToggle = () => {
        setSwapDirection(prev => prev === 'voucherToEth' ? 'ethToVoucher' : 'voucherToEth');
        setInputAmount('');
        setOutputAmount('0');
        setPriceImpact(0);
    };

    const handleMaxClick = () => {
        if (balance === '0') return;

        try {
            let maxAmount = ethers.BigNumber.from(balance);
            if (swapDirection === 'ethToVoucher') {
                const gasReserve = ethers.utils.parseEther('0.01');
                maxAmount = maxAmount.gt(gasReserve) ? maxAmount.sub(gasReserve) : ethers.BigNumber.from(0);
            }
            setInputAmount(ethers.utils.formatEther(maxAmount));
        } catch (err) {
            console.error('Error setting max:', err);
        }
    };

    const handleSwap = async () => {
        if (!account) {
            setError('Please connect your wallet');
            return;
        }

        if (!inputAmount || inputAmount === '0') {
            setError('Enter an amount');
            return;
        }

        setIsLoading(true);
        setError('');
        setTxHash('');

        try {
            const amountIn = ethers.utils.parseEther(inputAmount);
            const amountOut = ethers.utils.parseEther(outputAmount);
            const minOut = applySlippage(amountOut, slippage);

            let tx;
            if (swapDirection === 'voucherToEth') {
                const approved = await contract.checkPoolApproval(account);
                if (!approved) {
                    await contract.approve();
                }

                tx = await contract.swapVoucherForETH(tokenId, amountIn, minOut);
            } else {
                tx = await contract.swapETHForVoucher(tokenId, amountIn, minOut);
            }

            setTxHash(tx.hash);

            const res = await contract.getReserves(tokenId);
            setReserves({
                voucherReserve: res.voucherReserve?.toString() || '0',
                ethReserve: res.ethReserve?.toString() || '0'
            });
            setInputAmount('');
            setOutputAmount('0');
        } catch (err) {
            setError(err.message || 'Swap failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inputToken = swapDirection === 'voucherToEth' ? voucherName : 'ETH';
    const outputToken = swapDirection === 'voucherToEth' ? 'ETH' : voucherName;

    const formatBalance = (bal) => {
        try {
            return parseFloat(ethers.utils.formatEther(bal || '0')).toFixed(4);
        } catch {
            return '0';
        }
    };

    return (
        <div className="swap-interface glass-card">
            <h3 className="swap-title">SWAP</h3>

            <div className="swap-container">
                <div className="swap-input-group">
                    <div className="input-header">
                        <label className="input-label">FROM</label>
                        <span className="balance-label">
                            BALANCE: {formatBalance(balance)}
                        </span>
                    </div>
                    <div className="swap-input-wrapper">
                        <input
                            type="number"
                            value={inputAmount}
                            onChange={(e) => setInputAmount(e.target.value)}
                            placeholder="0.0"
                            className="swap-input"
                        />
                        <div className="token-selector">
                            <span className="token-name">{inputToken}</span>
                            <button onClick={handleMaxClick} className="max-button">MAX</button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSwapDirectionToggle} className="swap-toggle">
                    <span className="swap-icon">⇅</span>
                </button>

                <div className="swap-input-group">
                    <div className="input-header">
                        <label className="input-label">TO (ESTIMATED)</label>
                    </div>
                    <div className="swap-input-wrapper">
                        <input
                            type="number"
                            value={outputAmount}
                            readOnly
                            placeholder="0.0"
                            className="swap-input"
                        />
                        <div className="token-selector">
                            <span className="token-name">{outputToken}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="slippage-settings">
                <label className="input-label">SLIPPAGE TOLERANCE</label>
                <div className="slippage-buttons">
                    {[0.5, 1, 5].map(value => (
                        <button
                            key={value}
                            onClick={() => setSlippage(value)}
                            className={`slippage-btn ${slippage === value ? 'active' : ''}`}
                        >
                            {value}%
                        </button>
                    ))}
                    <input
                        type="number"
                        value={customSlippage}
                        onChange={(e) => {
                            setCustomSlippage(e.target.value);
                            setSlippage(parseFloat(e.target.value) || 0.5);
                        }}
                        placeholder="CUSTOM"
                        className="slippage-input"
                    />
                </div>
            </div>

            {parseFloat(outputAmount) > 0 && (
                <div className="swap-stats">
                    <div className="stat-row">
                        <span>PRICE IMPACT</span>
                        <span className={priceImpact > 5 ? 'text-warning' : ''}>
                            {priceImpact.toFixed(2)}%
                        </span>
                    </div>
                    <div className="stat-row">
                        <span>MINIMUM RECEIVED</span>
                        <span>{(parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)} {outputToken}</span>
                    </div>
                </div>
            )}

            <button
                onClick={handleSwap}
                disabled={isLoading || !account || !inputAmount}
                className="btn btn-primary btn-lg w-full"
            >
                {isLoading ? (
                    <>
                        <span className="spinner"></span>
                        SWAPPING...
                    </>
                ) : !account ? (
                    'CONNECT WALLET'
                ) : (
                    'SWAP'
                )}
            </button>

            {error && <div className="swap-error">{error}</div>}
            {txHash && (
                <div className="swap-success">
                    SWAP SUCCESSFUL!{' '}
                    <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View on Etherscan
                    </a>
                </div>
            )}
        </div>
    );
};

export default SwapInterface;
