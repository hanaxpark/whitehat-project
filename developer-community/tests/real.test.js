import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealApi } from '../src/api/real.js';
import { ApiError } from '../src/api/errors.js';
test('팀원 어댑터의 JWT/username/raw JSON 계약을 유지하고 서버 role만 사용한다',async()=>{
  const calls=[];let token;let role;
  const api=createRealApi({setToken:(t,remember)=>{token={t,remember};},clearToken:()=>{token=null;},request:async(path,options)=>{calls.push({path,options});if(path==='/api/auth/login')return {token:'signed-token'};if(path==='/api/users/me')return {id:1,email:'admin@example.com',nickname:'operator',created_at:'2026-01-01',role};if(path==='/api/auth/register')return {id:1};if(path==='/api/posts/2/comments')return [];return null;}});
  assert.equal((await api.login({email:'admin@example.com',password:'pw',remember:true})).role,'user');assert.deepEqual(token,{t:'signed-token',remember:true});assert.deepEqual(calls[0].options.body,{username:'admin@example.com',password:'pw'});
  role='admin';assert.equal((await api.me()).role,'admin');await api.register({email:'new@example.com',password:'pw',nickname:'new',role:'admin'});assert.equal(calls.find(c=>c.path==='/api/auth/register').options.body.role,undefined);
  await api.listComments('2');assert.equal(calls.at(-1).path,'/api/posts/2/comments');
  await api.likePost('2',true);assert.equal(calls.at(-1).options.method,'POST');await api.logout();assert.equal(token,null);
});
test('관리 API는 기존 서비스 prefix, 서버 페이징, snake_case 매핑, DELETE 사유를 사용한다',async()=>{
  let last;const row={id:2,user_id:7,nickname:'author',title:'글',category:'cloud',created_at:'2026-01-01',post_id:2,content:'댓글',post_title:'원문'};
  const api=createRealApi({setToken:()=>{},clearToken:()=>{},request:async(path,options)=>{last={path,options};if(options?.method==='DELETE')return null;return {items:[row],total:55,page:2,pageSize:10};}});
  const list=await api.adminListPosts({q:'AWS',page:2,pageSize:10});assert.equal(list.total,55);assert.equal(list.items[0].authorId,'7');assert.equal(last.path,'/api/posts/admin/posts?q=AWS&page=2&pageSize=10');
  const comments=await api.adminListComments({page:1});assert.equal(comments.items[0].postTitle,'원문');assert.equal(comments.items[0].postId,'2');
  await api.adminDeletePost('a/b','검토 완료');assert.equal(last.path,'/api/posts/admin/posts/a%2Fb');assert.equal(last.options.method,'DELETE');assert.deepEqual(last.options.body,{reason:'검토 완료'});
  await api.adminDeleteComment('1','사유');assert.equal(last.path,'/api/comments/admin/comments/1');
});
test('관리자 API 미구현 또는 잘못된 목록 응답은 오류이며 mock으로 전환하지 않는다',async()=>{
  const missing=createRealApi({request:async()=>{throw new ApiError('Not found',404);}});await assert.rejects(missing.adminListUsers({}),e=>e.code==='ADMIN_API_UNAVAILABLE');
  const invalid=createRealApi({request:async()=>[]});await assert.rejects(invalid.adminListPosts({}),e=>e.code==='ADMIN_INVALID_RESPONSE');
});
