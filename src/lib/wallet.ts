import { ethers } from "ethers";

export type WalletType = "metamask" | "none";

export interface WalletState {
  address: string;
  chainId: number;
  balance: string;
  provider: ethers.BrowserProvider;
  type: WalletType;
}

// ====== DETECTION ======

/** True jika MetaMask tersedia (extension desktop ATAU MetaMask Mobile browser) */
export function hasMetaMask(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

/** True jika device mobile (Android/iOS) */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Deep link untuk buka dApp ini di MetaMask Mobile browser */
export function getMetaMaskDeepLink(): string {
  const host = window.location.host;   // e.g. nft-claim.vercel.app
  const path = window.location.pathname; // e.g. /
  const url = `https://metamask.app.link/dapp/${host}${path}?mm_connect=1`;
  return url;
}

/** Deep link ke Play Store MetaMask (fallback kalau belum install) */
export function getMetaMaskPlayStoreLink(): string {
  return "https://play.google.com/store/apps/details?id=io.metamask";
}

// ====== CONNECT METAMASK ======
export async function connectMetaMask(): Promise<WalletState> {
  if (!hasMetaMask()) {
    throw new Error("MetaMask tidak tersedia. Buka di MetaMask Mobile browser atau install extension.");
  }
  const p = new ethers.BrowserProvider(window.ethereum);
  const accs: string[] = await p.send("eth_requestAccounts", []);
  if (!accs.length) throw new Error("No accounts found");
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

// ====== AUTO-CONNECT METAMASK (silent) ======
export async function autoConnectMetaMask(): Promise<WalletState | null> {
  if (!hasMetaMask()) return null;
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
export async function disconnectWallet(): Promise<void> {
  // MetaMask tidak punya disconnect programmatic via ethers.
  // User disconnect dari settings MetaMask. Kita clear state di React.
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
