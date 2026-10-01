import { ApiError } from './errors.js';
const KEY = 'nangiryu-demo-v1';
const SESSION = 'nangiryu-demo-session';
const iso = hours => new Date(Date.now() - hours * 3600000).toISOString();
const seed = () => ({ users: [
  { id: 'u1', email: 'demo@example.com', password: 'Demo1234!', nickname: 'cloud_dev', bio: '클라우드와 보안을 공부하는 개발자입니다.', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', email: 'backend@example.com', password: 'Demo1234!', nickname: 'back_end', bio: '안정적인 API를 만듭니다.', joinedAt: iso(200) },
], posts: [
  { id:'p1', authorId:'u1', title:'AWS로 3-Tier 아키텍처 구축해본 후기', category:'cloud', type:'blog', tags:['AWS','인프라','3Tier'], content:'이번 프로젝트에서 AWS로 3-Tier 아키텍처를 구성해봤습니다. 간단하게 구조와 느낀 점을 정리해보려고 합니다.\n\n## 주요 구성 요소\n\n- **웹 서버**: EC2 + Nginx에서 React 정적 파일 서비스\n- **애플리케이션**: ECS / Fargate의 Users와 Contents 서비스\n- **데이터베이스**: Amazon RDS + MySQL\n- **보안**: WAF, 최소 권한 Security Group, IAM 역할\n\n```text\n사용자 → Cloudflare → ALB\n  /api/auth, /api/users → Users Service\n  /api/posts, /api/comments → Contents Service\n  그 외 → EC2 Nginx → React\n```\n\n## 배운 점\n\n브라우저는 같은 도메인의 상대경로만 호출하고, ALB가 각 서비스로 라우팅합니다. 서비스 경계와 보안 그룹을 명확하게 정리하는 것이 중요했습니다.', likes:['u2'], views:128, createdAt:iso(2), updatedAt:iso(2) },
  { id:'p2', authorId:'u2', title:'PHP에서 세션 관리는 어떻게 하나요?', category:'backend', type:'question', tags:['PHP','보안'], content:'로그인 세션의 만료와 갱신을 어떻게 설계하면 좋을까요?\n\n서버에서 세션을 검증하는 방법을 함께 이야기하고 싶습니다.', likes:[], views:42, createdAt:iso(5), updatedAt:iso(5) },
  { id:'p3', authorId:'u2', title:'처음하는 리눅스 서버 보안 설정 정리', category:'security', type:'blog', tags:['리눅스','보안'], content:'## 서버 보안 체크\n\n- 접근 권한 최소화\n- 운영 계정 분리\n- 로그 수집과 패치 관리\n\n여러분의 운영 경험도 댓글로 공유해주세요.', likes:['u1'], views:95, createdAt:iso(24), updatedAt:iso(24) },
  { id:'p4', authorId:'u1', title:'개발자 포트폴리오 어떻게 만드나요?', category:'general', type:'question', tags:['취업','포트폴리오'], content:'프로젝트에서 맡았던 역할과 문제를 해결한 과정을 정리하고 있습니다. 여러분은 어떤 내용을 강조하시나요?', likes:[], views:36, createdAt:iso(28), updatedAt:iso(28) },
  { id:'p5', authorId:'u2', title:'좋은 코드 리뷰 문화에 대해', category:'free', type:'blog', tags:['협업','문화'], content:'코드 리뷰에서 배운 점을 공유합니다.\n\n명확한 근거와 구체적인 제안이 좋은 대화의 시작이라고 생각합니다.', likes:['u1'], views:62, createdAt:iso(48), updatedAt:iso(48) },
  { id:'p6', authorId:'u1', title:'React에서 API 상태를 다루는 방법', category:'frontend', type:'blog', tags:['React','API'], content:'로딩, 오류, 빈 결과를 각각 명확하게 보여주면 사용자가 현재 상태를 이해하기 쉽습니다.', likes:[], views:29, createdAt:iso(72), updatedAt:iso(72) },
  { id:'p7', authorId:'u2', title:'AWS 자격증 스터디 함께해요', category:'study', type:'question', tags:['AWS','스터디'], content:'매주 학습 내용을 정리하고 질문을 나누는 스터디를 시작하려고 합니다.', likes:[], views:14, createdAt:iso(96), updatedAt:iso(96) },
], comments: [ { id:'c1',postId:'p1',authorId:'u2',content:'정말 잘 정리되어 있네요! 보안 그룹 설정도 공유해주세요.',createdAt:iso(1) }, {id:'c2',postId:'p1',authorId:'u1',content:'다음 글에서 서비스별 보안 그룹 설정도 정리해볼게요.',createdAt:iso(.5)} ] });
export function createMockApi(storage = localStorage, session = sessionStorage) {
  let db; try { db = JSON.parse(storage.getItem(KEY)); } catch { /* 손상된 데모 데이터는 초기화 */ }
  if (!db?.users || !db?.posts || !db?.comments) db = seed();
  const save = () => storage.setItem(KEY, JSON.stringify(db));
  const publicUser = user => { const { password, ...safe } = user; return safe; };
  const current = () => db.users.find(u => u.id === (session.getItem(SESSION) || storage.getItem(SESSION)));
  const requireUser = () => { const u = current(); if (!u) throw new ApiError('로그인이 필요합니다.',401,'UNAUTHORIZED'); return u; };
  const post = id => { const p = db.posts.find(p => p.id === id); if(!p) throw new ApiError('게시글을 찾을 수 없습니다.',404,'NOT_FOUND'); return p; };
  const own = p => { if (p.authorId !== requireUser().id) throw new ApiError('작성자만 수정하거나 삭제할 수 있습니다.',403,'FORBIDDEN'); };
  const decorate = p => ({ ...p, author:publicUser(db.users.find(u => u.id === p.authorId)), likeCount:p.likes.length, liked:p.likes.includes(current()?.id), commentCount:db.comments.filter(c=>c.postId===p.id).length, likes:undefined });
  const comment = c => ({ ...c, author:publicUser(db.users.find(u=>u.id===c.authorId)) });
  const validate = body => { if (!body.title?.trim() || !body.content?.trim() || !['general','frontend','backend','cloud','security','study','free'].includes(body.category)) throw new ApiError('제목, 내용, 카테고리를 확인해주세요.',422,'VALIDATION'); return {title:body.title.trim(),content:body.content.trim(),category:body.category,type:body.type==='question'?'question':'blog',tags:(body.tags||[]).slice(0,5)}; };
  return {
    async login({email,password,remember=false}) { const u=db.users.find(u=>u.email===email&&u.password===password); if(!u) throw new ApiError('이메일 또는 비밀번호가 올바르지 않습니다.',401,'INVALID_CREDENTIALS'); storage.removeItem(SESSION);session.removeItem(SESSION);(remember?storage:session).setItem(SESSION,u.id);return publicUser(u); },
    async register({email,password,nickname}) { if(db.users.some(u=>u.email===email)) throw new ApiError('이미 사용 중인 이메일입니다.',409,'EMAIL_EXISTS');if(password.length<8||!nickname.trim()) throw new ApiError('닉네임과 8자 이상 비밀번호가 필요합니다.',422,'VALIDATION');const u={id:crypto.randomUUID(),email,password,nickname:nickname.trim(),bio:'',joinedAt:new Date().toISOString()};db.users.push(u);save();session.setItem(SESSION,u.id);storage.removeItem(SESSION);return publicUser(u); },
    async logout() { session.removeItem(SESSION);storage.removeItem(SESSION); },
    async me() { return publicUser(requireUser()); },
    async updateProfile({nickname,bio}) { const u=requireUser();if(!nickname?.trim()) throw new ApiError('닉네임을 입력해주세요.',422,'VALIDATION');u.nickname=nickname.trim();u.bio=bio||'';save();return publicUser(u); },
    async listPosts({category='',q='',sort='latest',page=1,pageSize=5,type='',authorId=''}={}) { let items=db.posts.filter(p=>(!category||p.category===category)&&(!type||p.type===type)&&(!authorId||p.authorId===authorId)&&(!q||[p.title,p.content,...p.tags,db.users.find(u=>u.id===p.authorId)?.nickname].join(' ').toLowerCase().includes(q.toLowerCase())));items.sort((a,b)=>sort==='popular'?b.likes.length-a.likes.length:sort==='comments'?db.comments.filter(c=>c.postId===b.id).length-db.comments.filter(c=>c.postId===a.id).length:new Date(b.createdAt)-new Date(a.createdAt));return {items:items.slice((page-1)*pageSize,page*pageSize).map(decorate),total:items.length,page:Number(page),pageSize:Number(pageSize)}; },
    async getPost(id) { return decorate(post(id)); },
    async createPost(body) { const u=requireUser();const p={...validate(body),id:crypto.randomUUID(),authorId:u.id,likes:[],views:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};db.posts.push(p);save();return decorate(p); },
    async updatePost(id,body) {const p=post(id);own(p);Object.assign(p,validate(body),{updatedAt:new Date().toISOString()});save();return decorate(p);},
    async deletePost(id) {own(post(id));db.posts=db.posts.filter(p=>p.id!==id);db.comments=db.comments.filter(c=>c.postId!==id);save();},
    async likePost(id,liked) {const u=requireUser();const p=post(id);p.likes=p.likes.filter(id=>id!==u.id);if(liked)p.likes.push(u.id);save();return {liked,likeCount:p.likes.length};},
    async listComments(postId) {post(postId);return db.comments.filter(c=>c.postId===postId).map(comment);},
    async createComment({postId,content}) {const u=requireUser();post(postId);if(!content?.trim())throw new ApiError('댓글을 입력해주세요.',422,'VALIDATION');const c={id:crypto.randomUUID(),postId,authorId:u.id,content:content.trim(),createdAt:new Date().toISOString()};db.comments.push(c);save();return comment(c);},
    async deleteComment(id) {const c=db.comments.find(c=>c.id===id);if(!c)throw new ApiError('댓글을 찾을 수 없습니다.',404);own(c);db.comments=db.comments.filter(c=>c.id!==id);save();},
    async profileActivity(kind) {const u=requireUser();const mine=db.posts.filter(p=>p.authorId===u.id);return {stats:{posts:mine.length,comments:db.comments.filter(c=>c.authorId===u.id).length,likes:mine.reduce((sum,p)=>sum+p.likes.length,0)},items:kind==='comments'?db.comments.filter(c=>c.authorId===u.id).map(comment):db.posts.filter(p=>kind==='liked'?p.likes.includes(u.id):p.authorId===u.id).map(decorate)};},
  };
}
export const mockApi = typeof localStorage === 'undefined' ? null : createMockApi();
