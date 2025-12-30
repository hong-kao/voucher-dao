import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { getAllVouchers } from '../utils/api';
import VoucherCard from '../components/VoucherCard';
import './Home.css';

const Home = () => {
    const { provider } = useWallet();
    const contract = useContract(null, provider);

    const [vouchers, setVouchers] = useState([]);
    const [vouchersWithReserves, setVouchersWithReserves] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadVouchers();
    }, []);

    const loadVouchers = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await getAllVouchers();
            const voucherList = response.items || response || [];
            setVouchers(voucherList);

            const vouchersWithData = await Promise.all(
                voucherList.map(async (voucher) => {
                    try {
                        const reserves = await contract.getReserves(voucher.tokenId);
                        return {
                            voucher,
                            reserves
                        };
                    } catch (err) {
                        console.error(`Failed to get reserves for ${voucher.tokenId}:`, err);
                        return {
                            voucher,
                            reserves: { voucherReserve: '0', ethReserve: '0' }
                        };
                    }
                })
            );

            setVouchersWithReserves(vouchersWithData);
        } catch (err) {
            console.error('Failed to load vouchers:', err);
            setError('Failed to load vouchers. Make sure the backend is running.');

            setVouchersWithReserves([
                {
                    voucher: {
                        tokenId: 1,
                        store: 'Amazon',
                        faceValue: 5000,
                        currency: 'INR',
                        imageUrl: null,
                        description: 'Amazon India e-gift card'
                    },
                    reserves: { voucherReserve: '0', ethReserve: '0' }
                },
                {
                    voucher: {
                        tokenId: 2,
                        store: 'Zara',
                        faceValue: 2000,
                        currency: 'INR',
                        imageUrl: null,
                        description: 'Zara voucher'
                    },
                    reserves: { voucherReserve: '0', ethReserve: '0' }
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredVouchers = vouchersWithReserves.filter(({ voucher }) =>
        voucher.store.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const scrollToVouchers = (e) => {
        e.preventDefault();
        document.getElementById('vouchers')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="home-page">
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title slide-up">
                            TRADE VOUCHERS<br />
                            ON-CHAIN
                        </h1>
                        <p className="hero-description slide-up">
                            DECENTRALIZED MARKETPLACE FOR TRADING GIFT VOUCHERS WITH INSTANT LIQUIDITY
                            <br />
                            POWERED BY ETHEREUM SMART CONTRACTS AND AUTOMATED MARKET MAKING
                        </p>
                        <div className="hero-cta slide-up">
                            <button onClick={scrollToVouchers} className="btn btn-primary btn-lg">
                                EXPLORE VOUCHERS
                            </button>
                            <Link to="/liquidity" className="btn btn-secondary btn-lg">
                                PROVIDE LIQUIDITY
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card glass-card">
                            <div className="stat-value">{vouchers.length}</div>
                            <div className="stat-label">VOUCHER TYPES</div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-value">
                                {vouchersWithReserves.reduce((sum, { reserves }) => {
                                    const eth = parseFloat(reserves.ethReserve || '0') / 1e18;
                                    return sum + eth;
                                }, 0).toFixed(2)}
                            </div>
                            <div className="stat-label">TOTAL LIQUIDITY (ETH)</div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-value">0.3%</div>
                            <div className="stat-label">PLATFORM FEE</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="vouchers" className="vouchers-section">
                <div className="container">
                    <div className="section-header">
                        <h2>AVAILABLE VOUCHERS</h2>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="SEARCH VOUCHERS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>LOADING VOUCHERS...</p>
                        </div>
                    ) : error && filteredVouchers.length === 0 ? (
                        <div className="error-state">
                            <p>{error}</p>
                            <p className="text-muted text-sm mt-md">
                                NOTE: SAMPLE VOUCHERS SHOWN. CONNECT YOUR BACKEND TO SEE REAL DATA.
                            </p>
                        </div>
                    ) : filteredVouchers.length === 0 ? (
                        <div className="empty-state">
                            <p>NO VOUCHERS FOUND</p>
                        </div>
                    ) : (
                        <div className="vouchers-grid grid grid-3">
                            {filteredVouchers.map(({ voucher, reserves }) => (
                                <VoucherCard
                                    key={voucher.tokenId}
                                    voucher={voucher}
                                    reserves={reserves}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
