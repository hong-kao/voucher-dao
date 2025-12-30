import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VoucherDetail from './pages/VoucherDetail';
import Swap from './pages/Swap';
import Liquidity from './pages/Liquidity';
import './styles/index.css';

function App() {
    return (
        <Router>
            <div className="app">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/voucher/:tokenId" element={<VoucherDetail />} />
                        <Route path="/swap" element={<Swap />} />
                        <Route path="/liquidity" element={<Liquidity />} />
                    </Routes>
                </main>

                <footer className="footer">
                    <div className="container">
                        <p className="text-muted text-sm text-center">
                            © 2024 VoucherTrade. Built with React + ethers.js + Ethereum
                        </p>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

export default App;
