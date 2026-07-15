import { ethers } from "ethers";

export type WalletType = "metamask" | "none";

export interface WalletState {
  address: string;
  chainId: number;
  balance: string;
  provider: ethers.BrowserProvider;
  type: WalletType;
}

// ====== CONNECT METAMASK ======
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
export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't have a programmatic disconnect via ethers.
  // The user disconnects by removing the dapp from MetaMask settings.
  // We just clear state in the React component.
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
