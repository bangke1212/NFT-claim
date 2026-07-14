import { ethers } from "ethers";

export type WalletType = "metamask" | "walletconnect" | "none";

export interface WalletState {
  address: string;
  chainId: number;
  balance: string;
  provider: ethers.BrowserProvider;
  type: WalletType;
}

// ====== MOBILE DETECTION ======
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ====== WALLETS FOR MOBILE DEEP LINK ======
export interface MobileWalletInfo {
  key: string;
  name: string;
  color: string;
  deepLink: (wcUri: string) => string;
}

export const MOBILE_WALLETS: MobileWalletInfo[] = [
  {
    key: "metamask",
    name: "MetaMask",
    color: "#F5A623",
    deepLink: (uri) => `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`,
  },
  {
    key: "trust",
    name: "Trust Wallet",
    color: "#3375BB",
    deepLink: (uri) => `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`,
  },
  {
    key: "rainbow",
    name: "Rainbow",
    color: "#FF6B6B",
    deepLink: (uri) => `https://rnbwapp.com/wc?uri=${encodeURIComponent(uri)}`,
  },
  {
    key: "safe",
    name: "Safe Wallet",
    color: "#12FF80",
    deepLink: (uri) => `https://app.safe.global/wc?uri=${encodeURIComponent(uri)}`,
  },
];

// ====== WalletConnect core ======
let wcProvider: any = null;
let wcEthersProvider: ethers.BrowserProvider | null = null;

async function initWC(chainId: number = 1): Promise<[any, ethers.BrowserProvider]> {
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

  // Close old session if any
  if (wcProvider) {
    try { await wcProvider.disconnect(); } catch {}
    wcProvider = null;
    wcEthersProvider = null;
  }

  const provider = await EthereumProvider.init({
    projectId: "9b1e8c0e2d3f4a5b6c7d8e9f0a1b2c3d",
    chains: [chainId],
    optionalChains: [1, 42161, 8453, 10, 137, 56, 43114, 324, 59144, 534352],
    // IMPORTANT: showQrModal=false — we handle mobile UI manually
    showQrModal: false,
    metadata: {
      name: "NFT Auto Claim Bot",
      description: "Auto Claim / Auto Mint / Auto Approve EVM",
      url: typeof window !== "undefined" ? window.location.origin : "",
      icons: [],
    },
  });

  wcProvider = provider;
  wcEthersProvider = new ethers.BrowserProvider(provider);

  provider.on("disconnect", () => {
    wcProvider = null;
    wcEthersProvider = null;
  });

  return [provider, wcEthersProvider];
}

// ====== Generate WalletConnect URI ======
export async function generateWCUri(chainId: number = 1): Promise<string> {
  const [provider] = await initWC(chainId);

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout generating WalletConnect link")), 20000);

    const handler = (uri: string) => {
      clearTimeout(timeout);
      resolve(uri);
    };

    provider.on("display_uri", handler);
    provider.connect({ pairingTopic: undefined }).catch((e: any) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}

// ====== Resume WC session (called when user returns from wallet app) ======
export async function resumeWCSession(): Promise<WalletState | null> {
  if (!wcProvider) return null;

  try {
    const accounts: string[] = await wcProvider.enable();
    if (!accounts || accounts.length === 0) return null;

    const address = accounts[0];
    if (!wcEthersProvider) wcEthersProvider = new ethers.BrowserProvider(wcProvider);
    const net = await wcEthersProvider.getNetwork();
    const bal = await wcEthersProvider.getBalance(address);

    return {
      address,
      chainId: Number(net.chainId),
      balance: ethers.formatEther(bal),
      provider: wcEthersProvider,
      type: "walletconnect",
    };
  } catch {
    return null;
  }
}

// ====== CONNECT (desktop) via WalletConnect SDK modal ======
export async function connectWalletConnectDesktop(chainId: number = 1): Promise<WalletState> {
  // For desktop: use SDK's built-in QR modal
  if (wcProvider) {
    try { await wcProvider.disconnect(); } catch {}
    wcProvider = null;
  }

  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

  const provider = await EthereumProvider.init({
    projectId: "9b1e8c0e2d3f4a5b6c7d8e9f0a1b2c3d",
    chains: [chainId],
    optionalChains: [1, 42161, 8453, 10, 137, 56, 43114, 324, 59144, 534352],
    showQrModal: true,  // Desktop: show QR modal
    qrModalOptions: { themeMode: "light" },
    metadata: {
      name: "NFT Auto Claim Bot",
      description: "Auto Claim / Auto Mint / Auto Approve EVM",
      url: typeof window !== "undefined" ? window.location.origin : "",
      icons: [],
    },
  });

  wcProvider = provider;
  wcEthersProvider = new ethers.BrowserProvider(provider);

  provider.on("disconnect", () => {
    wcProvider = null;
    wcEthersProvider = null;
  });

  const accounts: string[] = await provider.enable();
  const address = accounts[0];
  const net = await wcEthersProvider.getNetwork();
  const bal = await wcEthersProvider.getBalance(address);

  return {
    address,
    chainId: Number(net.chainId),
    balance: ethers.formatEther(bal),
    provider: wcEthersProvider,
    type: "walletconnect",
  };
}

// ====== CONNECT MetaMask browser extension ======
export async function connectMetaMask(): Promise<WalletState> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No browser wallet detected. Install MetaMask or Rabby.");
  }
  const p = new ethers.BrowserProvider(window.ethereum);
  const accs: string[] = await p.send("eth_requestAccounts", []);
  const net = await p.getNetwork();
  const bal = await p.getBalance(accs[0]);
  return {
    address: accs[0],
    chainId: Number(net.chainId),
    balance: ethers.formatEther(bal),
    provider: p,
    type: "metamask",
  };
}

// ====== CONNECT generic ======
export async function connectWallet(type: WalletType, chainId: number = 1): Promise<WalletState> {
  if (type === "metamask") return connectMetaMask();
  if (type === "walletconnect") return connectWalletConnectDesktop(chainId);
  throw new Error("Invalid wallet type");
}

// ====== DISCONNECT ======
export async function disconnectWallet(state: WalletState | null): Promise<void> {
  if (!state) return;
  if (state.type === "walletconnect" && wcProvider) {
    try { await wcProvider.disconnect(); } catch {}
    wcProvider = null;
    wcEthersProvider = null;
  }
}

// ====== SWITCH CHAIN ======
export async function doSwitchChain(
  provider: ethers.BrowserProvider,
  targetChainId: number,
  chainName: string,
  rpcUrl: string,
  explorerUrl: string,
  symbol: string
): Promise<void> {
  const hex = "0x" + targetChainId.toString(16);
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: hex }]);
  } catch (e: any) {
    if (e?.code === 4902 || e?.info?.error?.code === 4902) {
      await provider.send("wallet_addEthereumChain", [{
        chainId: hex, chainName,
        nativeCurrency: { name: symbol, symbol, decimals: 18 },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: [explorerUrl],
      }]);
    } else { throw e; }
  }
}

declare global { interface Window { ethereum?: any } }
