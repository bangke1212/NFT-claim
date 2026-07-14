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

const WC_PROJECT_ID = "9b1e8c0e2d3f4a5b6c7d8e9f0a1b2c3d";
const WC_METADATA = {
  name: "NFT Auto Claim Bot",
  description: "Auto Claim / Auto Mint / Auto Approve EVM",
  url: typeof window !== "undefined" ? window.location.origin : "https://nft-claim.vercel.app",
  icons: [],
};

// ====== MOBILE: SignClient-based deep link ======
let signClient: any = null;
let mobileApproval: (() => Promise<any>) | null = null;
let mobileUri: string = "";

async function getSignClient(): Promise<any> {
  if (signClient) return signClient;
  const { SignClient } = await import("@walletconnect/sign-client");
  signClient = await SignClient.init({
    projectId: WC_PROJECT_ID,
    metadata: WC_METADATA,
  });
  return signClient;
}

// Step 1: Generate URI for mobile deep linking
export async function startMobilePairing(chainId: number = 1): Promise<{ uri: string; wallets: MobileWalletInfo[] }> {
  const client = await getSignClient();

  // Clear any stale state
  mobileApproval = null;
  mobileUri = "";

  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      eip155: {
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",
          "eth_signTypedData_v4",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain",
        ],
        chains: [`eip155:${chainId}`],
        events: ["chainChanged", "accountsChanged"],
      },
    },
  });

  mobileUri = uri;
  mobileApproval = approval;

  return {
    uri,
    wallets: MOBILE_WALLETS,
  };
}

// Step 2: After user opens wallet and approves, complete the connection
export async function finishMobilePairing(): Promise<WalletState> {
  if (!mobileApproval) throw new Error("No pending pairing. Click 'Connect' first.");

  const session = await mobileApproval();
  mobileApproval = null;

  // Get account from session
  const eipAccounts = session.namespaces?.eip155?.accounts || [];
  if (!eipAccounts.length) throw new Error("No accounts returned from wallet");

  const [, chainIdStr, address] = eipAccounts[0].split(":");
  const chainId = parseInt(chainIdStr, 10);

  // Create EthereumProvider from the session topic
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [chainId],
    showQrModal: false,
    metadata: WC_METADATA,
  });

  await provider.connect({ pairingTopic: session.topic });
  const accounts: string[] = await provider.enable();

  if (!accounts.length) throw new Error("Failed to enable provider");

  const ep = new ethers.BrowserProvider(provider);
  const bal = await ep.getBalance(accounts[0]);

  return {
    address: accounts[0],
    chainId,
    balance: ethers.formatEther(bal),
    provider: ep,
    type: "walletconnect",
  };
}

// ====== DESKTOP: EthereumProvider with QR modal ======
export async function connectWalletConnectDesktop(chainId: number = 1): Promise<WalletState> {
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

  const provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [chainId],
    optionalChains: [1, 42161, 8453, 10, 137, 56, 43114, 324, 59144, 534352],
    showQrModal: true,
    qrModalOptions: { themeMode: "light" },
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

// ====== METAMASK EXTENSION ======
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
  if (state.type === "walletconnect") {
    if (signClient) {
      try {
        const sessions = signClient.session.getAll();
        for (const s of sessions) {
          try { await signClient.disconnect({ topic: s.topic, reason: { code: 6000, message: "User disconnected" } }); } catch {}
        }
      } catch {}
    }
    signClient = null;
    mobileApproval = null;
    mobileUri = "";
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

// ====== WALLET LIST ======
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

declare global { interface Window { ethereum?: any } }
