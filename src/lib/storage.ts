export type Target={
  id:string;name:string;url:string;contract:string;chain:string;method:string;
  amount:number;maxPerWallet:number;autoApprove:boolean;
  status:"waiting"|"monitoring"|"live"|"claimed"|"sold_out"|"failed";notes?:string;createdAt:string
};
const KEY="nft-claim.targets";
export function loadTargets():Target[]{if(typeof window==="undefined")return[];try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):DEFAULT}catch{return[]}}
export function saveTargets(t:Target[]){if(typeof window!=="undefined")localStorage.setItem(KEY,JSON.stringify(t))}
const DEFAULT:Target[]=[{id:"1",name:"Example Target",url:"",contract:"",chain:"ethereum",method:"claim",amount:1,maxPerWallet:5,autoApprove:true,status:"waiting",notes:"Replace with your project",createdAt:new Date().toISOString().slice(0,10)}];
