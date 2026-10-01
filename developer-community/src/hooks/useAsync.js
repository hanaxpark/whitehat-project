import { useEffect, useState } from 'react';
export function useAsync(loader, deps=[]) {
  const [state,setState]=useState({data:null,loading:true,error:null}),[revision,setRevision]=useState(0);
  useEffect(()=>{let active=true;setState({data:null,loading:true,error:null});Promise.resolve().then(loader).then(data=>{if(active)setState({data,loading:false,error:null});}).catch(error=>{if(active)setState({data:null,loading:false,error});});return()=>{active=false;};},[...deps,revision]);
  return {...state,reload:()=>setRevision(r=>r+1)};
}
