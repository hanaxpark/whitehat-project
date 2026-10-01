import test from 'node:test';
import assert from 'node:assert/strict';
import { request, setToken, getToken, clearToken } from '../src/api/client.js';
const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
test('상대경로, Bearer 토큰, 백엔드 raw JSON과 오류/204 처리',async()=>{
  const original=globalThis.fetch;
  Object.defineProperty(globalThis,'localStorage',{value:mem(),configurable:true});
  Object.defineProperty(globalThis,'sessionStorage',{value:mem(),configurable:true});
  let observed;globalThis.fetch=async(path,options)=>{observed={path,options};return new Response(JSON.stringify({id:1}),{headers:{'Content-Type':'application/json'}});};
  try{
    assert.deepEqual(await request('/api/posts',{method:'POST',body:{title:'test'}}),{id:1});assert.equal(observed.path,'/api/posts');assert.equal(observed.options.method,'POST');assert.equal(observed.options.headers.Authorization,undefined);
    await assert.rejects(request('https://example.com/api/posts'));
    setToken('abc',false);assert.equal(getToken(),'abc');await request('/api/users/me');assert.equal(observed.options.headers.Authorization,'Bearer abc');
    setToken('xyz',true);assert.equal(sessionStorage.getItem('nangiryu-token'),null);assert.equal(getToken(),'xyz');clearToken();assert.equal(getToken(),null);
    globalThis.fetch=async()=>new Response(null,{status:204});assert.equal(await request('/api/comments/c1',{method:'DELETE'}),null);
    globalThis.fetch=async()=>new Response('<html/>',{headers:{'Content-Type':'text/html'}});await assert.rejects(request('/api/posts'),e=>e.code==='INVALID_RESPONSE');
    globalThis.fetch=async()=>new Response(JSON.stringify({message:'Forbidden'}),{status:403,headers:{'Content-Type':'application/json'}});await assert.rejects(request('/api/posts'),e=>e.status===403&&e.message==='Forbidden');
  }finally{globalThis.fetch=original;}
});
