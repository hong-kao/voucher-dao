import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { getVoucherById } from '../utils/api';
import SwapInterface from '../components/SwapInterface';
import LiquidityInterface from '../components/LiquidityInterface';
import './VoucherDetail.css';

const VoucherDetail = () => {
    const { tokenId } = useParams();
    const { account, provider } = useWallet();
    const contract = useContract(null, provider);

    const [voucher, setVoucher] = useState(null);
    const [reserves, setReserves] = useState({ voucherReserve: '0', ethReserve: '0' });
    const [userBalance, setUserBalance] = useState('0');
    const [lpBalance, setLpBalance] = useState('0');
    const [activeTab, setActiveTab] = useState('swap');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadVoucherData();
    }, [tokenId, account]);

    const loadVoucherData = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Load metadata from backend
            const voucherData = await getVoucherById(tokenId);
            setVoucher(voucherData);

            // Load on-chain data
            const res = await contract.getReserves(tokenId);
            setReserves({
                voucherReserve: res.voucherReserve?.toString() || '0',
                ethReserve: res.ethReserve?.toString() || '0'
            });

            if (account) {
                const balance = await contract.getVoucherBalance(account, tokenId);
                const lp = await contract.getLPShares(account, tokenId);
                setUserBalance(balance?.toString() || '0');
                setLpBalance(lp?.toString() || '0');
            }
        } catch (err) {
            console.error('Failed to load voucher:', err);
            setError('Failed to load voucher data');

            // Fallback sample data
            setVoucher({
                tokenId: parseInt(tokenId),
                store: 'Sample Store',
                faceValue: 1000,
                currency: 'INR',
                description: 'Sample voucher - connect backend for real data',
                imageUrl: null
            });
        } finally {
            setIsLoading(false);
        }
    };

    const calculatePrice = () => {
        if (!reserves.voucherReserve || reserves.voucherReserve === '0') return '0';

        try {
            const voucherBN = ethers.BigNumber.from(reserves.voucherReserve);
            const ethBN = ethers.BigNumber.from(reserves.ethReserve);
            const price = ethBN.mul(ethers.constants.WeiPerEther).div(voucherBN);
            return ethers.utils.formatEther(price);
        } catch {
            return '0';
        }
    };

    const formatBalance = (balance) => {
        try {
            // For voucher balance, just show the number
            return balance;
        } catch {
            return '0';
        }
    };

    const formatEth = (wei) => {
        try {
            return ethers.utils.formatEther(wei);
        } catch {
            return '0';
        }
    };

    if (isLoading) {
        return (
            <div className="voucher-detail-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading voucher data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!voucher) {
        return (
            <div className="voucher-detail-page">
                <div className="container">
                    <div className="error-state">
                        <p>{error || 'Voucher not found'}</p>
                    </div>
                </div>
            </div>
        );
    }

    const price = calculatePrice();

    return (
        <div className="voucher-detail-page">
            <div className="container">
                {/* Header */}
                <div className="voucher-header glass-card">
                    <div className="voucher-header-left">
                        {voucher.imageUrl ? (
                            <img src={voucher.imageUrl} alt={voucher.store} className="voucher-image-large" />
                        ) : (
                            <div className="voucher-image-placeholder-large">
                                <span>{voucher.store.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    <div className="voucher-header-right">
                        <h1 className="voucher-title">{voucher.store}</h1>
                        <p className="voucher-face-value">
                            {voucher.faceValue?.toLocaleString() || voucher.face_value?.toLocaleString() || '0'} {voucher.currency}
                        </p>
                        {voucher.description && (
                            <p className="voucher-description">{voucher.description}</p>
                        )}

                        <div className="voucher-stats-grid">
                            <div className="stat-box">
                                <span className="stat-label">Your Balance</span>
                                <span className="stat-value">
                                    {formatBalance(userBalance)} vouchers
                                </span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Current Price</span>
                                <span className="stat-value">{parseFloat(price).toFixed(6)} ETH</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Pool Liquidity</span>
                                <span className="stat-value">
                                    {parseFloat(formatEth(reserves.ethReserve)).toFixed(4)} ETH
                                </span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Your LP Shares</span>
                                <span className="stat-value">
                                    {formatBalance(lpBalance)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trading Interface */}
                <div className="trading-section">
                    <div className="trading-tabs">
                        <button
                            onClick={() => setActiveTab('swap')}
                            className={`trading-tab ${activeTab === 'swap' ? 'active' : ''}`}
                        >
                            SWAP
                        </button>
                        <button
                            onClick={() => setActiveTab('liquidity')}
                            className={`trading-tab ${activeTab === 'liquidity' ? 'active' : ''}`}
                        >
                            LIQUIDITY
                        </button>
                    </div>

                    <div className="trading-content">
                        {activeTab === 'swap' ? (
                            <SwapInterface tokenId={parseInt(tokenId)} voucherName={voucher.store} />
                        ) : (
                            <LiquidityInterface tokenId={parseInt(tokenId)} voucherName={voucher.store} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherDetail;
