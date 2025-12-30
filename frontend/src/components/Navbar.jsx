import { Link } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        <span className="brand-text">VOUCHER EXCHANGE</span>
                    </Link>

                    <div className="navbar-links">
                        <Link to="/" className="nav-link">EXPLORE</Link>
                        <Link to="/swap" className="nav-link">SWAP</Link>
                        <Link to="/liquidity" className="nav-link">LIQUIDITY</Link>
                    </div>

                    <WalletConnect />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
