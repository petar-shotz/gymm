import { database } from '@/db/raw';
import { fitnessIdentity } from '@/lib/fitness-identity';
export async function GET(r:Request){
 const user=fitnessIdentity(r.headers); if(!user)return Response.json({error:'Please sign in to access your logs.'},{status:401});
 try{const rows=await database().prepare('SELECT key,value FROM fitness_records WHERE user = ?').bind(user).all<{key:string,value:string}>();return Response.json(Object.fromEntries(rows.results.map(x=>[x.key,JSON.parse(x.value)])),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'Your logs could not be loaded. Please retry.'},{status:503});}
}
export async function PUT(r:Request){
 const user=fitnessIdentity(r.headers); if(!user)return Response.json({error:'Please sign in to save your logs.'},{status:401});
 if(r.headers.get('origin') && r.headers.get('origin')!==new URL(r.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 try{const {key,value}=await r.json() as {key:string,value:unknown};if(!/^(profile|\d{4}-\d{2}-\d{2})$/.test(key)||JSON.stringify(value).length>100000)return Response.json({error:'Invalid entry'},{status:400});await database().prepare('INSERT INTO fitness_records (user,key,value) VALUES (?,?,?) ON CONFLICT(user,key) DO UPDATE SET value=excluded.value').bind(user,key,JSON.stringify(value)).run();return Response.json({ok:true});}catch(e){console.error(e);return Response.json({error:'Could not save. Your changes are still here; please retry.'},{status:503});}
}

// POST is also supported for browser and embedded-preview compatibility.
export async function POST(r:Request){ return PUT(r); }
