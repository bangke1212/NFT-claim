export type ChainInfo={id:number;name:string;symbol:string;rpc:string;explorer:string;color:string};

// ====== MAINNETS ======
export const CHAINS:Record<string,ChainInfo>={
  ethereum:{id:1,name:"Ethereum",symbol:"ETH",rpc:"https://eth.llamarpc.com",explorer:"https://etherscan.io",color:"#B8A9E8"},
  arbitrum:{id:42161,name:"Arbitrum",symbol:"ETH",rpc:"https://arb1.arbitrum.io/rpc",explorer:"https://arbiscan.io",color:"#4ECDC4"},
  base:{id:8453,name:"Base",symbol:"ETH",rpc:"https://mainnet.base.org",explorer:"https://basescan.org",color:"#4ECDC4"},
  optimism:{id:10,name:"Optimism",symbol:"ETH",rpc:"https://mainnet.optimism.io",explorer:"https://optimistic.etherscan.io",color:"#FF6B6B"},
  polygon:{id:137,name:"Polygon",symbol:"MATIC",rpc:"https://polygon-rpc.com",explorer:"https://polygonscan.com",color:"#B8A9E8"},
  bsc:{id:56,name:"BNB Chain",symbol:"BNB",rpc:"https://bsc-dataseed.binance.org",explorer:"https://bscscan.com",color:"#F5A623"},
  avalanche:{id:43114,name:"Avalanche",symbol:"AVAX",rpc:"https://api.avax.network/ext/bc/C/rpc",explorer:"https://snowtrace.io",color:"#FF6B6B"},
  zksync:{id:324,name:"zkSync",symbol:"ETH",rpc:"https://mainnet.era.zksync.io",explorer:"https://explorer.zksync.io",color:"#B8A9E8"},
  linea:{id:59144,name:"Linea",symbol:"ETH",rpc:"https://rpc.linea.build",explorer:"https://lineascan.build",color:"#4ECDC4"},
  scroll:{id:534352,name:"Scroll",symbol:"ETH",rpc:"https://rpc.scroll.io",explorer:"https://scrollscan.com",color:"#F5A623"},
  // Robinhood Chain (Arbitrum L2)
  robinhood:{id:4663,name:"Robinhood",symbol:"ETH",rpc:"https://rpc.mainnet.chain.robinhood.com",explorer:"https://robinhoodchain.blockscout.com",color:"#22C55E"},

  // ====== TESTNETS ======
  "sepolia":{id:11155111,name:"Sepolia Testnet",symbol:"ETH",rpc:"https://rpc.sepolia.org",explorer:"https://sepolia.etherscan.io",color:"#8B5CF6"},
  "base-sepolia":{id:84532,name:"Base Sepolia",symbol:"ETH",rpc:"https://sepolia.base.org",explorer:"https://sepolia.basescan.org",color:"#4ECDC4"},
  "polygon-amoy":{id:80002,name:"Polygon Amoy",symbol:"MATIC",rpc:"https://rpc-amoy.polygon.technology",explorer:"https://amoy.polygonscan.com",color:"#B8A9E8"},
  "bsc-testnet":{id:97,name:"BSC Testnet",symbol:"BNB",rpc:"https://bsc-testnet-rpc.publicnode.com",explorer:"https://testnet.bscscan.com",color:"#F5A623"},
  "robinhood-testnet":{id:46630,name:"Robinhood Testnet",symbol:"ETH",rpc:"https://rpc.testnet.chain.robinhood.com",explorer:"https://explorer.testnet.chain.robinhood.com",color:"#86EFAC"},
};
export function chainById(id:number):ChainInfo|undefined{return Object.values(CHAINS).find(c=>c.id===id)}
