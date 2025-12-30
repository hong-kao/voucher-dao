import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import './VoucherCard.css';

const VoucherCard = ({ voucher, reserves }) => {
    const { tokenId, store, faceValue, face_value, currency, imageUrl, image_url } = voucher;
    const { voucherReserve, ethReserve } = reserves || {};

    const calculatePrice = () => {
        if (!voucherReserve || !ethReserve || voucherReserve === '0' || voucherReserve === 0n) {
            return 'N/A';
        }

        try {
            const voucherBN = ethers.BigNumber.from(voucherReserve.toString());
            const ethBN = ethers.BigNumber.from(ethReserve.toString());
            const price = ethBN.mul(ethers.constants.WeiPerEther).div(voucherBN);
            return parseFloat(ethers.utils.formatEther(price)).toFixed(6);
        } catch {
            return 'N/A';
        }
    };

    const formatLiquidity = () => {
        if (!ethReserve) return 'NO LIQUIDITY';

        try {
            const eth = parseFloat(ethers.utils.formatEther(ethReserve.toString()));
            if (eth < 0.01) return 'LOW LIQUIDITY';
            if (eth < 1) return `${eth.toFixed(3)} ETH`;
            return `${eth.toFixed(2)} ETH`;
        } catch {
            return 'NO LIQUIDITY';
        }
    };

    const price = calculatePrice();
    const liquidity = formatLiquidity();
    const displayValue = faceValue || face_value || 0;
    const displayImage = imageUrl || image_url;
    const storeName = store || 'Unknown';

    return (
        <Link to={`/voucher/${tokenId}`} className="voucher-card glass-card">
            <div className="voucher-image-container">
                {displayImage ? (
                    <img src={displayImage} alt={storeName} className="voucher-image" />
                ) : (
                    <div className="voucher-image-placeholder">
                        <span className="placeholder-text">{storeName.charAt(0)}</span>
                    </div>
                )}
                <div className="voucher-badge">
                    <span className="badge badge-success">ACTIVE</span>
                </div>
            </div>

            <div className="voucher-content">
                <h3 className="voucher-store">{storeName.toUpperCase()}</h3>
                <p className="voucher-value">
                    {displayValue.toLocaleString()} {currency || 'INR'}
                </p>

                <div className="voucher-stats">
                    <div className="stat">
                        <span className="stat-label">CURRENT PRICE</span>
                        <span className="stat-value">{price} ETH</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">LIQUIDITY</span>
                        <span className="stat-value">{liquidity}</span>
                    </div>
                </div>

                <button className="btn btn-primary w-full mt-md">
                    TRADE NOW
                </button>
            </div>
        </Link>
    );
};

export default VoucherCard;
