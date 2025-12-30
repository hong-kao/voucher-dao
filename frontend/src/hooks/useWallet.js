import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '1337';

export const useWallet = () => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Check if MetaMask is installed
    const isMetaMaskInstalled = useCallback(() => {
        return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    }, []);

    // Connect wallet
    const connect = useCallback(async () => {
        if (!isMetaMaskInstalled()) {
            setError('Please install MetaMask to use this app');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Request account access
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            const network = await provider.getNetwork();

            setProvider(provider);
            setSigner(signer);
            setAccount(accounts[0]);
            setChainId(network.chainId.toString());
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    }, [isMetaMaskInstalled]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setError(null);
    }, []);

    // Check if on correct network
    const isCorrectNetwork = useCallback(() => {
        return chainId === EXPECTED_CHAIN_ID;
    }, [chainId]);

    // Switch network (if needed)
    const switchNetwork = useCallback(async () => {
        if (!isMetaMaskInstalled()) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${parseInt(EXPECTED_CHAIN_ID).toString(16)}` }],
            });
        } catch (err) {
            console.error('Failed to switch network:', err);
            setError('Failed to switch network');
        }
    }, [isMetaMaskInstalled]);

    // Listen for account changes
    useEffect(() => {
        if (!isMetaMaskInstalled()) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnect();
            } else if (accounts[0] !== account) {
                setAccount(accounts[0]);
            }
        };

        const handleChainChanged = (chainId) => {
            // Convert hex to decimal string
            const decimalChainId = parseInt(chainId, 16).toString();
            setChainId(decimalChainId);
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [account, disconnect, isMetaMaskInstalled]);

    // Auto-connect on mount if previously connected
    useEffect(() => {
        const autoConnect = async () => {
            if (!isMetaMaskInstalled()) return;

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const accounts = await provider.listAccounts();

                if (accounts.length > 0) {
                    const signer = provider.getSigner();
                    const network = await provider.getNetwork();

                    setProvider(provider);
                    setSigner(signer);
                    setAccount(accounts[0]);
                    setChainId(network.chainId.toString());
                }
            } catch (err) {
                console.error('Auto-connect failed:', err);
            }
        };

        autoConnect();
    }, [isMetaMaskInstalled]);

    return {
        account,
        provider,
        signer,
        chainId,
        isConnecting,
        isConnected: !!account,
        error,
        connect,
        disconnect,
        isCorrectNetwork: isCorrectNetwork(),
        switchNetwork,
        isMetaMaskInstalled: isMetaMaskInstalled(),
    };
};
