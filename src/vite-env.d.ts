/// <reference types="vite/client" />
declare module "@walletconnect/ethereum-provider" {
  export class EthereumProvider {
    static init(opts: any): Promise<EthereumProvider>;
    on(event: string, cb: (...args: any[]) => void): void;
    enable(): Promise<string[]>;
    disconnect(): Promise<void>;
    connect(opts?: any): Promise<any>;
    request(args: { method: string; params?: any[] }): Promise<any>;
  }
}
