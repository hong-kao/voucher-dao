import { useWallet } from '../hooks/useWallet';
import './WalletConnect.css';

const NETWORK_NAMES = {
    '1': 'Mainnet',
    '11155111': 'Sepolia',
    '1337': 'Localhost',
    '31337': 'Hardhat'
};

const WalletConnect = () => {
    const {
        account,
        chainId,
        isConnecting,
        isConnected,
        connect,
        disconnect,
        isCorrectNetwork,
        switchNetwork,
        isMetaMaskInstalled,
        error
    } = useWallet();

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getNetworkName = () => {
        if (!chainId) return '';
        return NETWORK_NAMES[chainId] || `Chain ${chainId}`;
    };

    if (!isMetaMaskInstalled) {
        return (
            <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
            >
                INSTALL METAMASK
            </a>
        );
    }

    if (isConnected && !isCorrectNetwork) {
        return (
            <div className="wallet-connect">
                <button onClick={switchNetwork} className="btn btn-secondary">
                    WRONG NETWORK
                </button>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className="wallet-connect">
                <div className="network-badge">
                    <span className="network-indicator"></span>
                    <span className="network-name">{getNetworkName()}</span>
                </div>
                <div className="wallet-info">
                    <div className="wallet-indicator"></div>
                    <span className="wallet-address">{formatAddress(account)}</span>
                </div>
                <button onClick={disconnect} className="btn btn-secondary btn-sm">
                    DISCONNECT
                </button>
            </div>
        );
    }

    return (
        <div className="wallet-connect">
            <button
                onClick={connect}
                disabled={isConnecting}
                className="btn btn-primary"
            >
                {isConnecting ? (
                    <>
                        <span className="spinner"></span>
                        CONNECTING...
                    </>
                ) : (
                    'CONNECT WALLET'
                )}
            </button>
            {error && <div className="wallet-error">{error}</div>}
        </div>
    );
};

export default WalletConnect;
