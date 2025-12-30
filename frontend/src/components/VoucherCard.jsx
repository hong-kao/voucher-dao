import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import './VoucherCard.css';

const VoucherCard = ({ voucher, reserves }) => {
    const { tokenId, store, faceValue, currency, imageUrl } = voucher;
    const { voucherReserve, ethReserve } = reserves || {};

    const calculatePrice = () => {
        if (!voucherReserve || !ethReserve || voucherReserve === '0') {
            return 'N/A';
        }

        const price = ethers.BigNumber.from(ethReserve)
            .mul(ethers.constants.WeiPerEther)
            .div(ethers.BigNumber.from(voucherReserve));

        return parseFloat(ethers.utils.formatEther(price)).toFixed(6);
    };

    const formatLiquidity = () => {
        if (!ethReserve) return 'NO LIQUIDITY';

        const eth = parseFloat(ethers.utils.formatEther(ethReserve));
        if (eth < 0.01) return 'LOW LIQUIDITY';
        if (eth < 1) return `${eth.toFixed(3)} ETH`;
        return `${eth.toFixed(2)} ETH`;
    };

    const price = calculatePrice();
    const liquidity = formatLiquidity();

    return (
        <Link to={`/voucher/${tokenId}`} className="voucher-card glass-card">
            <div className="voucher-image-container">
                {imageUrl ? (
                    <img src={imageUrl} alt={store} className="voucher-image" />
                ) : (
                    <div className="voucher-image-placeholder">
                        <span className="placeholder-text">{store.charAt(0)}</span>
                    </div>
                )}
                <div className="voucher-badge">
                    <span className="badge badge-success">ACTIVE</span>
                </div>
            </div>

            <div className="voucher-content">
                <h3 className="voucher-store">{store.toUpperCase()}</h3>
                <p className="voucher-value">
                    {faceValue.toLocaleString()} {currency}
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
