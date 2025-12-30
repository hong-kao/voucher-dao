import { useState, useEffect } from 'react';
import { getAllVouchers } from '../utils/api';
import SwapInterface from '../components/SwapInterface';
import './Swap.css';

const Swap = () => {
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
        <div className="swap-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">SWAP VOUCHERS</h1>
                    <p className="page-description">
                        TRADE YOUR VOUCHERS FOR ETH OR BUY VOUCHERS WITH ETH INSTANTLY
                    </p>
                </div>

                {vouchers.length > 0 && (
                    <div className="voucher-selector-container">
                        <label className="selector-label">SELECT VOUCHER</label>
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
                    <div className="swap-container-page">
                        <SwapInterface
                            tokenId={selectedTokenId}
                            voucherName={selectedVoucher.store}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Swap;
