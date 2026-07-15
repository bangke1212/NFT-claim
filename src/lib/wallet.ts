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

// ⚠️ GANTI dengan Project ID asli dari https://cloud.walletconnect.com/
const WC_PROJECT_ID = "9b1e8c0e2d3f4a5b6c7d8e9f0a1b2c3d";

const WC_METADATA = {
  name: "NFT Auto Claim Bot",
  description: "Auto Claim / Auto Mint / Auto Approve EVM",
  url: typeof window !== "undefined" ? window.location.origin : "https://nft-claim.vercel.app",
  icons: [],
};

// ====== WALLETCONNECT — UNIFIED (Desktop QR + Mobile Deep Link) ======
let wcProvider: any = null; // simpan raw provider untuk disconnect

export async function connectWalletConnect(chainId: number = 1): Promise<WalletState> {
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const mobile = isMobile();

  const provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [chainId],
    optionalChains: [1, 42161, 8453, 10, 137, 56, 43114, 324, 59144, 534352],
    // Desktop: QR modal — Mobile: WalletConnect modal tampilkan list wallet app
    showQrModal: true,
    qrModalOptions: {
      themeMode: "light",
      // Mobile: tampilkan daftar wallet untuk deep-link
      ...(mobile ? {
        mobileWallets: [
          {
            id: "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
            name: "MetaMask",
            links: {
              native: "metamask://",
              universal: "https://metamask.app.link",
            },
          },
          {
            id: "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust
            name: "Trust Wallet",
            links: {
              native: "trust://",
              universal: "https://link.trustwallet.com",
            },
          },
        ],
      } : {}),
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

  // enable() → desktop: buka QR modal, mobile: deep-link ke wallet app
  const accounts: string[] = await provider.enable();
  if (!accounts.length) throw new Error("No accounts returned from wallet");

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

// ====== AUTO-CONNECT WALLETCONNECT (restore session tanpa popup) ======
export async function autoConnectWalletConnect(): Promise<WalletState | null> {
  try {
    const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

    const provider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID,
      chains: [1],
      optionalChains: [1, 42161, 8453, 10, 137, 56, 43114, 324, 59144, 534352],
      showQrModal: false, // silent — hanya restore session yg sudah ada
      metadata: WC_METADATA,
    });

    const accounts: string[] = await provider.enable();
    if (!accounts.length) return null;

    wcProvider = provider;
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
  } catch {
    return null;
  }
}

// ====== METAMASK EXTENSION (Desktop) ======
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

// ====== AUTO-CONNECT METAMASK (silent, no popup) ======
export async function autoConnectMetaMask(): Promise<WalletState | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  try {
    const p = new ethers.BrowserProvider(window.ethereum);
    const accs: string[] = await p.send("eth_accounts", []);
    if (!accs.length) return null;
    const net = await p.getNetwork();
    const bal = await p.getBalance(accs[0]);
    return {
      address: accs[0],
      chainId: Number(net.chainId),
      balance: ethers.formatEther(bal),
      provider: p,
      type: "metamask",
    };
  } catch {
    return null;
  }
}

// ====== DISCONNECT ======
export async function disconnectWallet(state: WalletState | null): Promise<void> {
  if (!state) return;
  if (state.type === "walletconnect" && wcProvider) {
    try {
      await wcProvider.disconnect();
    } catch {
      // fallback: coba putuskan semua session
      try {
        const sessions = wcProvider?.signer?.session?.getAll?.() || [];
        for (const s of sessions) {
          try {
            await wcProvider.disconnect({ topic: s.topic, reason: { code: 6000, message: "User disconnected" } });
          } catch {}
        }
      } catch {}
    }
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
