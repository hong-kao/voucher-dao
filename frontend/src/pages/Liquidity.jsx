import { useState, useEffect } from 'react';
import { getAllVouchers } from '../utils/api';
import LiquidityInterface from '../components/LiquidityInterface';
import './Liquidity.css';

const Liquidity = () => {
    const [vouchers, setVouchers] = useState([]);
    const [selectedTokenId, setSelectedTokenId] = useState(null);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    useEffect(() => {
        loadVouchers();
    }, []);

    const loadVouchers = async () => {
        try {
            const response = await getAllVouchers();
            const voucherList = response.items || response || [];
            setVouchers(voucherList);

            if (voucherList.length > 0) {
                setSelectedTokenId(voucherList[0].tokenId);
                setSelectedVoucher(voucherList[0]);
            }
        } catch (err) {
            console.error('Failed to load vouchers:', err);
            // Fallback sample data
            const sampleVouchers = [
                { tokenId: 1, store: 'Amazon', faceValue: 5000, currency: 'INR' },
                { tokenId: 2, store: 'Zara', faceValue: 2000, currency: 'INR' }
            ];
            setVouchers(sampleVouchers);
            setSelectedTokenId(1);
            setSelectedVoucher(sampleVouchers[0]);
        }
    };

    const handleVoucherChange = (tokenId) => {
        setSelectedTokenId(parseInt(tokenId));
        const voucher = vouchers.find(v => v.tokenId === parseInt(tokenId));
        setSelectedVoucher(voucher);
    };

    return (
        <div className="liquidity-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">PROVIDE LIQUIDITY</h1>
                    <p className="page-description">
                        ADD LIQUIDITY TO EARN TRADING FEES. REMOVE LIQUIDITY ANYTIME.
                    </p>
                </div>

                {vouchers.length > 0 && (
                    <div className="voucher-selector-container">
                        <label className="selector-label">SELECT VOUCHER POOL</label>
                        <select
                            value={selectedTokenId || ''}
                            onChange={(e) => handleVoucherChange(e.target.value)}
                            className="voucher-selector"
                        >
                            {vouchers.map(voucher => (
                                <option key={voucher.tokenId} value={voucher.tokenId}>
                                    {voucher.store} - {voucher.faceValue} {voucher.currency}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedTokenId && selectedVoucher && (
                    <div className="liquidity-container-page">
                        <LiquidityInterface
                            tokenId={selectedTokenId}
                            voucherName={selectedVoucher.store}
                        />
                    </div>
                )}

                <div className="liquidity-info-section">
                    <div className="info-card glass-card">
                        <h3>HOW IT WORKS</h3>
                        <ul>
                            <li>ADD BOTH VOUCHERS AND ETH TO THE LIQUIDITY POOL</li>
                            <li>RECEIVE LP TOKENS REPRESENTING YOUR SHARE</li>
                            <li>EARN 0.3% FEE ON ALL TRADES IN YOUR POOL</li>
                            <li>REMOVE LIQUIDITY ANYTIME BY BURNING LP TOKENS</li>
                        </ul>
                    </div>

                    <div className="info-card glass-card">
                        <h3>IMPORTANT NOTES</h3>
                        <ul>
                            <li>PRICES ARE DETERMINED BY THE CONSTANT PRODUCT FORMULA</li>
                            <li>YOU MAY EXPERIENCE IMPERMANENT LOSS</li>
                            <li>YOUR SHARE OF THE POOL MAY CHANGE AS OTHERS ADD/REMOVE</li>
                            <li>ALWAYS MAINTAIN OPTIMAL RATIO FOR BEST RETURNS</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Liquidity;
