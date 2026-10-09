// Each attempt sends the identical day snapshot (including the same entry IDs).
// Replaying an uncertain save therefore cannot append a duplicate food entry.
export async function saveFitness(key:string,value:unknown, request:typeof fetch=fetch){
 const body=JSON.stringify({key,value});
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await request('/api/data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body,signal:AbortSignal.timeout(15000)});
   if(response.status===401||response.status===403)throw new Error('Your session needs refreshing. Open the app in a new tab and sign in, then save again.');
   if(!response.headers.get('content-type')?.includes('application/json'))throw new TypeError('Unexpected network response');
   const result=await response.json() as {error?:string};
   if(!response.ok){if(response.status>=500)throw new TypeError('Service temporarily unavailable');throw new Error(result.error||'Could not save this entry.');}
   return;
  }catch(error){
   if(error instanceof Error && !(error instanceof TypeError) && error.name!=='TimeoutError' && error.name!=='AbortError')throw error;
   // The write may have succeeded even when its response was lost.
   try{
    const check=await request('/api/data',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(check.ok&&check.headers.get('content-type')?.includes('application/json')){
     const stored=await check.json() as Record<string,unknown>;
     if(JSON.stringify(stored[key])===JSON.stringify(value))return;
    }
   }catch{/* Keep the draft and replay the same snapshot once. */}
   if(attempt===1)throw new Error('The connection was interrupted and we could not confirm your save. Your entry is still in this form. Check your connection and press Save again.');
  }
 }
}
