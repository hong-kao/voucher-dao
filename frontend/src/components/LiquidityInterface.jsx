import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { calculateEthAmountForVoucher } from '../utils/amm';
import './LiquidityInterface.css';

const LiquidityInterface = ({ tokenId, voucherName }) => {
    const { account, signer, provider } = useWallet();
    const contract = useContract(signer, provider);

    const [tab, setTab] = useState('add');
    const [voucherAmount, setVoucherAmount] = useState('');
    const [ethAmount, setEthAmount] = useState('');
    const [lpAmount, setLpAmount] = useState('');
    const [reserves, setReserves] = useState({ voucherReserve: '0', ethReserve: '0' });
    const [voucherBalance, setVoucherBalance] = useState('0');
    const [ethBalance, setEthBalance] = useState('0');
    const [lpBalance, setLpBalance] = useState('0');
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!tokenId) return;

            const res = await contract.getReserves(tokenId);
            setReserves(res);

            if (account) {
                const vBal = await contract.getVoucherBalance(account, tokenId);
                const eBal = await provider.getBalance(account);
                const lpBal = await contract.getLpBalance(account, tokenId);

                setVoucherBalance(vBal.toString());
                setEthBalance(eBal.toString());
                setLpBalance(lpBal.toString());
            }
        };

        loadData();
    }, [tokenId, account, contract, provider]);

    useEffect(() => {
        if (tab !== 'add' || !voucherAmount || voucherAmount === '0') return;

        try {
            const voucherAmountBN = ethers.utils.parseEther(voucherAmount);
            const ethNeeded = calculateEthAmountForVoucher(
                voucherAmountBN,
                reserves.voucherReserve,
                reserves.ethReserve
            );
            setEthAmount(ethers.utils.formatEther(ethNeeded));
        } catch (err) {
            console.error('Error calculating optimal ratio:', err);
        }
    }, [voucherAmount, reserves, tab]);

    const handleAddLiquidity = async () => {
        if (!account) {
            setError('Please connect your wallet');
            return;
        }

        if (!voucherAmount || !ethAmount) {
            setError('Enter amounts');
            return;
        }

        setIsLoading(true);
        setError('');
        setTxHash('');

        try {
            const voucherAmountBN = ethers.utils.parseEther(voucherAmount);
            const ethAmountBN = ethers.utils.parseEther(ethAmount);

            const approved = await contract.checkPoolApproval(account);
            if (!approved) {
                await contract.approve();
            }

            const tx = await contract.addLiquidity(tokenId, voucherAmountBN, ethAmountBN);
            setTxHash(tx.hash);

            const res = await contract.getReserves(tokenId);
            setReserves(res);
            setVoucherAmount('');
            setEthAmount('');
        } catch (err) {
            setError(err.message || 'Failed to add liquidity');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveLiquidity = async () => {
        if (!account) {
            setError('Please connect your wallet');
            return;
        }

        if (!lpAmount) {
            setError('Enter LP amount');
            return;
        }

        setIsLoading(true);
        setError('');
        setTxHash('');

        try {
            const lpAmountBN = ethers.utils.parseEther(lpAmount);
            const tx = await contract.removeLiquidity(tokenId, lpAmountBN);
            setTxHash(tx.hash);

            const res = await contract.getReserves(tokenId);
            setReserves(res);
            setLpAmount('');
        } catch (err) {
            setError(err.message || 'Failed to remove liquidity');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMaxVoucher = () => {
        setVoucherAmount(ethers.utils.formatEther(voucherBalance));
    };

    const handleMaxETH = () => {
        const balanceBN = ethers.BigNumber.from(ethBalance);
        const gasReserve = ethers.utils.parseEther('0.01');
        const maxAmount = balanceBN.sub(gasReserve);
        setEthAmount(ethers.utils.formatEther(maxAmount));
    };

    const handleMaxLP = () => {
        setLpAmount(ethers.utils.formatEther(lpBalance));
    };

    return (
        <div className="liquidity-interface glass-card">
            <div className="liquidity-tabs">
                <button
                    onClick={() => setTab('add')}
                    className={`tab ${tab === 'add' ? 'active' : ''}`}
                >
                    ADD LIQUIDITY
                </button>
                <button
                    onClick={() => setTab('remove')}
                    className={`tab ${tab === 'remove' ? 'active' : ''}`}
                >
                    REMOVE LIQUIDITY
                </button>
            </div>

            {tab === 'add' ? (
                <div className="liquidity-content">
                    <div className="liquidity-info">
                        <p className="text-muted text-sm">
                            ADD {voucherName.toUpperCase()} AND ETH TO THE LIQUIDITY POOL TO EARN TRADING FEES
                        </p>
                    </div>

                    <div className="input-group">
                        <div className="input-header">
                            <label className="input-label">{voucherName.toUpperCase()} AMOUNT</label>
                            <span className="balance-label">
                                BALANCE: {parseFloat(ethers.utils.formatEther(voucherBalance || '0')).toFixed(4)}
                            </span>
                        </div>
                        <div className="liquidity-input-wrapper">
                            <input
                                type="number"
                                value={voucherAmount}
                                onChange={(e) => setVoucherAmount(e.target.value)}
                                placeholder="0.0"
                                className="liquidity-input"
                            />
                            <button onClick={handleMaxVoucher} className="max-button">MAX</button>
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-header">
                            <label className="input-label">ETH AMOUNT</label>
                            <span className="balance-label">
                                BALANCE: {parseFloat(ethers.utils.formatEther(ethBalance || '0')).toFixed(4)}
                            </span>
                        </div>
                        <div className="liquidity-input-wrapper">
                            <input
                                type="number"
                                value={ethAmount}
                                onChange={(e) => setEthAmount(e.target.value)}
                                placeholder="0.0"
                                className="liquidity-input"
                            />
                            <button onClick={handleMaxETH} className="max-button">MAX</button>
                        </div>
                    </div>

                    {voucherAmount && ethAmount && (
                        <div className="pool-info">
                            <div className="stat-row">
                                <span>SHARE OF POOL</span>
                                <span>~0.5%</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleAddLiquidity}
                        disabled={isLoading || !account || !voucherAmount || !ethAmount}
                        className="btn btn-primary btn-lg w-full"
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                ADDING LIQUIDITY...
                            </>
                        ) : !account ? (
                            'CONNECT WALLET'
                        ) : (
                            'ADD LIQUIDITY'
                        )}
                    </button>
                </div>
            ) : (
                <div className="liquidity-content">
                    <div className="liquidity-info">
                        <p className="text-muted text-sm">
                            REMOVE YOUR LIQUIDITY FROM THE POOL
                        </p>
                        <div className="lp-balance-card">
                            <span className="lp-label">YOUR LP TOKENS</span>
                            <span className="lp-value">
                                {parseFloat(ethers.utils.formatEther(lpBalance || '0')).toFixed(6)}
                            </span>
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-header">
                            <label className="input-label">LP TOKEN AMOUNT</label>
                        </div>
                        <div className="liquidity-input-wrapper">
                            <input
                                type="number"
                                value={lpAmount}
                                onChange={(e) => setLpAmount(e.target.value)}
                                placeholder="0.0"
                                className="liquidity-input"
                            />
                            <button onClick={handleMaxLP} className="max-button">MAX</button>
                        </div>
                    </div>

                    <div className="percentage-buttons">
                        {[25, 50, 75, 100].map(percent => (
                            <button
                                key={percent}
                                onClick={() => {
                                    const amount = ethers.BigNumber.from(lpBalance)
                                        .mul(percent)
                                        .div(100);
                                    setLpAmount(ethers.utils.formatEther(amount));
                                }}
                                className="btn btn-secondary btn-sm"
                            >
                                {percent}%
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRemoveLiquidity}
                        disabled={isLoading || !account || !lpAmount}
                        className="btn btn-primary btn-lg w-full"
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                REMOVING LIQUIDITY...
                            </>
                        ) : !account ? (
                            'CONNECT WALLET'
                        ) : (
                            'REMOVE LIQUIDITY'
                        )}
                    </button>
                </div>
            )}

            {error && <div className="liquidity-error">{error}</div>}
            {txHash && (
                <div className="liquidity-success">
                    TRANSACTION SUCCESSFUL!{' '}
                    <a
                        href={`https://etherscan.io/tx/${txHash}`}
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

export default LiquidityInterface;
