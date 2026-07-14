export type ChainInfo={id:number;name:string;symbol:string;rpc:string;explorer:string;color:string};
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
  scroll:{id:534352,name:"Scroll",symbol:"ETH",rpc:"https://rpc.scroll.io",explorer:"https://scrollscan.com",color:"#F5A623"}
};
export function chainById(id:number):ChainInfo|undefined{return Object.values(CHAINS).find(c=>c.id===id)}
