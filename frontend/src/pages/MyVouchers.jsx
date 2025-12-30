import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { getAllVouchers, getRedemptions, createRedemption } from '../utils/api';
import './MyVouchers.css';

const MyVouchers = () => {
    const { account, signer, provider } = useWallet();
    const contract = useContract(signer, provider);

    const [vouchers, setVouchers] = useState([]);
    const [userVouchers, setUserVouchers] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState(null);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (account) {
            loadUserVouchers();
            loadRedemptions();
        }
    }, [account]);

    const loadUserVouchers = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Get all voucher types from backend
            const response = await getAllVouchers();
            const voucherList = response.items || response || [];
            setVouchers(voucherList);

            // Check balances for each voucher type
            const vouchersWithBalances = await Promise.all(
                voucherList.map(async (voucher) => {
                    try {
                        const balance = await contract.getVoucherBalance(account, voucher.tokenId);
                        return {
                            ...voucher,
                            balance: balance?.toString() || '0'
                        };
                    } catch (err) {
                        console.error(`Failed to get balance for ${voucher.tokenId}:`, err);
                        return { ...voucher, balance: '0' };
                    }
                })
            );

            // Filter to only vouchers user owns
            const owned = vouchersWithBalances.filter(v => v.balance !== '0' && parseInt(v.balance) > 0);
            setUserVouchers(owned);
        } catch (err) {
            console.error('Failed to load vouchers:', err);
            setError('Failed to load vouchers. Make sure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadRedemptions = async () => {
        if (!account) return;

        try {
            const response = await getRedemptions(account);
            const redemptionList = response.items || response || [];
            setRedemptions(redemptionList);
        } catch (err) {
            console.error('Failed to load redemptions:', err);
        }
    };

    const handleRedeem = async (tokenId, voucherName) => {
        if (!account) {
            setError('Please connect your wallet');
            return;
        }

        setRedeemingId(tokenId);
        setError('');
        setSuccessMessage('');
        setTxHash('');

        try {
            // Call on-chain redeem function
            const { tx, receipt } = await contract.redeemVoucher(tokenId);
            setTxHash(tx.hash);

            // Get the redeem event to extract redeemId
            const redeemEvent = receipt.events?.find(e => e.event === 'VoucherRedeemed');
            const redeemId = redeemEvent?.args?.redeemId?.toString() || Date.now().toString();

            // Create redemption record in backend
            try {
                await createRedemption({
                    userAddress: account,
                    voucherId: tokenId,
                    redeemId: redeemId,
                    txHash: tx.hash
                });
            } catch (apiErr) {
                console.error('Backend redemption record failed:', apiErr);
            }

            // Reload data
            await loadUserVouchers();
            await loadRedemptions();

            setSuccessMessage(`${voucherName} voucher redeemed successfully! Check below for your claim code.`);
        } catch (err) {
            console.error('Redeem failed:', err);
            setError(err.message || 'Failed to redeem voucher');
        } finally {
            setRedeemingId(null);
        }
    };

    const formatBalance = (balance) => {
        try {
            return parseInt(balance).toString();
        } catch {
            return '0';
        }
    };

    if (!account) {
        return (
            <div className="my-vouchers-page">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">MY VOUCHERS</h1>
                        <p className="page-description">
                            CONNECT YOUR WALLET TO VIEW YOUR VOUCHERS AND REDEEM THEM
                        </p>
                    </div>

                    <div className="connect-prompt glass-card">
                        <div className="prompt-icon">🔗</div>
                        <h3>WALLET NOT CONNECTED</h3>
                        <p>Please connect your wallet using the button in the top right corner to view your vouchers.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-vouchers-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">MY VOUCHERS</h1>
                    <p className="page-description">
                        VIEW YOUR VOUCHER HOLDINGS AND REDEEM THEM FOR CLAIM CODES
                    </p>
                </div>

                {error && <div className="error-message glass-card">{error}</div>}
                {successMessage && (
                    <div className="success-message glass-card">
                        {successMessage}
                        {txHash && (
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tx-link"
                            >
                                View Transaction →
                            </a>
                        )}
                    </div>
                )}

                {/* User's Vouchers Section */}
                <section className="vouchers-section">
                    <h2 className="section-title">YOUR HOLDINGS</h2>

                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>LOADING YOUR VOUCHERS...</p>
                        </div>
                    ) : userVouchers.length === 0 ? (
                        <div className="empty-state glass-card">
                            <div className="empty-icon">📭</div>
                            <h3>NO VOUCHERS FOUND</h3>
                            <p>You don't own any vouchers yet. Visit the marketplace to buy some!</p>
                        </div>
                    ) : (
                        <div className="vouchers-grid">
                            {userVouchers.map(voucher => (
                                <div key={voucher.tokenId} className="voucher-card glass-card">
                                    <div className="voucher-header">
                                        {voucher.imageUrl ? (
                                            <img src={voucher.imageUrl} alt={voucher.store} className="voucher-image" />
                                        ) : (
                                            <div className="voucher-image-placeholder">
                                                <span>{voucher.store?.charAt(0) || 'V'}</span>
                                            </div>
                                        )}
                                        <div className="voucher-info">
                                            <h3 className="voucher-name">{voucher.store?.toUpperCase() || 'VOUCHER'}</h3>
                                            <p className="voucher-value">
                                                {voucher.faceValue?.toLocaleString() || voucher.face_value?.toLocaleString() || '0'} {voucher.currency || 'INR'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="voucher-balance">
                                        <span className="balance-label">YOUR BALANCE</span>
                                        <span className="balance-value">{formatBalance(voucher.balance)}</span>
                                    </div>

                                    <button
                                        onClick={() => handleRedeem(voucher.tokenId, voucher.store)}
                                        disabled={redeemingId === voucher.tokenId}
                                        className="btn btn-primary w-full"
                                    >
                                        {redeemingId === voucher.tokenId ? (
                                            <>
                                                <span className="spinner"></span>
                                                REDEEMING...
                                            </>
                                        ) : (
                                            'REDEEM VOUCHER'
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Redemptions / Claim Codes Section */}
                <section className="redemptions-section">
                    <h2 className="section-title">YOUR CLAIM CODES</h2>

                    {redemptions.length === 0 ? (
                        <div className="empty-state glass-card">
                            <div className="empty-icon">🎟️</div>
                            <h3>NO CLAIM CODES YET</h3>
                            <p>When you redeem a voucher, your claim code will appear here.</p>
                        </div>
                    ) : (
                        <div className="redemptions-list">
                            {redemptions.map((redemption, index) => (
                                <div key={index} className="redemption-card glass-card">
                                    <div className="redemption-info">
                                        <span className="redemption-label">VOUCHER</span>
                                        <span className="redemption-value">
                                            {vouchers.find(v => v.tokenId === redemption.voucherId)?.store || `Token #${redemption.voucherId}`}
                                        </span>
                                    </div>
                                    <div className="redemption-code-container">
                                        <span className="redemption-label">CLAIM CODE</span>
                                        <div className="claim-code">
                                            {redemption.claimCode || 'PENDING...'}
                                        </div>
                                    </div>
                                    <div className="redemption-status">
                                        <span className={`status-badge ${redemption.status?.toLowerCase() || 'pending'}`}>
                                            {redemption.status || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Info Section */}
                <section className="info-section">
                    <div className="info-card glass-card">
                        <h3>HOW REDEMPTION WORKS</h3>
                        <ul>
                            <li>CLICK "REDEEM VOUCHER" TO BURN YOUR ON-CHAIN TOKEN</li>
                            <li>YOUR VOUCHER IS TRANSFERRED TO THE CONTRACT</li>
                            <li>A UNIQUE CLAIM CODE IS GENERATED FOR YOU</li>
                            <li>USE THE CLAIM CODE AT THE STORE TO GET YOUR DISCOUNT</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MyVouchers;
