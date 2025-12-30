import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import './VoucherCard.css';

const VoucherCard = ({ voucher, reserves }) => {
    const { tokenId, store, faceValue, face_value, currency, imageUrl, image_url } = voucher;
    const { voucherReserve, ethReserve } = reserves || {};

    const calculatePrice = () => {
        if (!voucherReserve || !ethReserve) {
            return 'N/A';
        }

        try {
            const voucherBN = ethers.BigNumber.from(voucherReserve.toString());
            const ethBN = ethers.BigNumber.from(ethReserve.toString());

            if (voucherBN.isZero()) return 'N/A';

            // Price = ETH reserve / Voucher reserve 
            // ethReserve is in wei, voucherReserve is raw count
            // Result is wei per voucher, then format to ETH
            const priceWei = ethBN.div(voucherBN);
            const priceEth = parseFloat(ethers.utils.formatEther(priceWei));

            if (priceEth === 0) return 'N/A';
            if (priceEth < 0.0001) return priceEth.toFixed(6);
            if (priceEth < 0.01) return priceEth.toFixed(4);
            return priceEth.toFixed(3);
        } catch (err) {
            console.error('Price calc error:', err);
            return 'N/A';
        }
    };

    const formatLiquidity = () => {
        if (!ethReserve) return 'NO POOL';

        try {
            const eth = parseFloat(ethers.utils.formatEther(ethReserve.toString()));
            if (eth === 0) return 'NO POOL';
            if (eth < 0.01) return `${eth.toFixed(4)} ETH`;
            if (eth < 1) return `${eth.toFixed(3)} ETH`;
            return `${eth.toFixed(2)} ETH`;
        } catch {
            return 'NO POOL';
        }
    };

    const price = calculatePrice();
    const liquidity = formatLiquidity();
    const displayValue = faceValue || face_value || 0;
    const displayImage = imageUrl || image_url;
    const storeName = store || 'Unknown';
    const hasLiquidity = liquidity !== 'NO POOL';

    // Generate a gradient based on store name
    const getGradient = () => {
        const gradients = {
            'Amazon': 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)',
            'Zara': 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
            'Starbucks': 'linear-gradient(135deg, #00704A 0%, #1E9964 100%)',
        };
        return gradients[store] || 'linear-gradient(135deg, var(--color-light-brown), var(--color-mid-brown))';
    };

    return (
        <Link to={`/voucher/${tokenId}`} className="voucher-card glass-card">
            <div className="voucher-image-container" style={{ background: displayImage ? 'transparent' : getGradient() }}>
                {displayImage ? (
                    <img src={displayImage} alt={storeName} className="voucher-image" />
                ) : (
                    <div className="voucher-image-placeholder">
                        <span className="store-name-overlay">{storeName.toUpperCase()}</span>
                    </div>
                )}
                <div className="voucher-badge">
                    <span className={`badge ${hasLiquidity ? 'badge-success' : 'badge-warning'}`}>
                        {hasLiquidity ? 'ACTIVE' : 'NO POOL'}
                    </span>
                </div>
            </div>

            <div className="voucher-content">
                <h3 className="voucher-store">{storeName.toUpperCase()}</h3>
                <p className="voucher-value">
                    ₹{displayValue.toLocaleString()} {currency || 'INR'}
                </p>

                <div className="voucher-stats">
                    <div className="stat">
                        <span className="stat-label">PRICE</span>
                        <span className="stat-value price">{price === 'N/A' ? '—' : `${price} ETH`}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">LIQUIDITY</span>
                        <span className="stat-value">{liquidity}</span>
                    </div>
                </div>

                <button className="btn btn-primary w-full mt-md">
                    {hasLiquidity ? 'TRADE NOW' : 'ADD LIQUIDITY'}
                </button>
            </div>
        </Link>
    );
};

export default VoucherCard;
