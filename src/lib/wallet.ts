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

// ====== WalletConnect ======
let wcProvider: any = null;

const WC_PROJECT_ID = "9b1e8c0e2d3f4a5b6c7d8e9f0a1b2c3d";
const WC_METADATA = {
  name: "NFT Auto Claim Bot",
  description: "Auto Claim / Auto Mint / Auto Approve EVM",
  url: typeof window !== "undefined" ? window.location.origin : "https://nft-claim.vercel.app",
  icons: [],
};

async function initWalletConnect(chainId: number): Promise<any> {
  if (wcProvider) {
    try { await wcProvider.disconnect(); } catch {}
    wcProvider = null;
  }

  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

  const provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [chainId],
    optionalChains: [1, 42161, 8453, 10, 137, 56, 43114, 324, 59144, 534352],
    showQrModal: true,
    qrModalOptions: {
      themeMode: "light",
      // On mobile, the modal shows deep link options instead of QR
    },
    metadata: WC_METADATA,
    rpcMap: {
      1: "https://eth.llamarpc.com",
      42161: "https://arb1.arbitrum.io/rpc",
      8453: "https://mainnet.base.org",
      10: "https://mainnet.optimism.io",
      137: "https://polygon-rpc.com",
      56: "https://bsc-dataseed.binance.org",
    },
  });

  wcProvider = provider;

  provider.on("disconnect", () => { wcProvider = null; });

  return provider;
}

// ====== CONNECT WalletConnect ======
export async function connectWalletConnect(chainId: number = 1): Promise<WalletState> {
  const provider = await initWalletConnect(chainId);

  // enable() opens the SDK modal:
  // - Desktop: shows QR code
  // - Mobile: shows deep link options / opens wallet app
  const accounts: string[] = await provider.enable();
  const address = accounts[0];

  const ep = new ethers.BrowserProvider(provider);
  const net = await ep.getNetwork();
  const bal = await ep.getBalance(address);

  return {
    address,
    chainId: Number(net.chainId),
    balance: ethers.formatEther(bal),
    provider: ep,
    type: "walletconnect",
  };
}

// ====== CONNECT MetaMask Extension ======
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

// ====== DISCONNECT ======
export async function disconnectWallet(state: WalletState | null): Promise<void> {
  if (!state) return;
  if (state.type === "walletconnect" && wcProvider) {
    try { await wcProvider.disconnect(); } catch {}
    wcProvider = null;
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
