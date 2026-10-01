import { ApiError } from './errors.js';
// ?ㅼ젣 諛깆뿏??users/contents-service) ?묐떟???붾㈃???곕뒗 紐⑥뼇?쇰줈 諛붽씀???대뙌?? 諛깆뿏?쒖뿉 ?녿뒗 ?꾨뱶???꾨옒 湲곕낯媛믪쑝濡?梨꾩슫??
// type='blog', tags=[], bio='' (DB??而щ읆 ?놁쓬, 湲 ?좏삎/?쒓렇/?먭린?뚭컻????λ릺吏 ?딅뒗??.
const s = v => (v == null ? v : String(v));
const enc = encodeURIComponent;
const qs = (params={}) => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
const toUser = u => ({ id: s(u.id), email: u.email, username: u.username, nickname: u.nickname, bio: '', joinedAt: u.created_at, role: String(u.role || '').toLowerCase() === 'admin' ? 'admin' : 'user' });
const toPost = p => ({ id: s(p.id), title: p.title, content: p.content ?? '', category: p.category, type: 'blog', tags: [],
  authorId: s(p.user_id), author: { nickname: p.nickname }, createdAt: p.created_at, updatedAt: p.updated_at ?? p.created_at,
  views: p.view_count, likeCount: p.like_count ?? 0, commentCount: p.comment_count ?? 0, liked: !!p.liked });
const toComment = c => ({ id: s(c.id), postId: s(c.post_id), authorId: s(c.user_id), author: { nickname: c.nickname }, content: c.content, createdAt: c.created_at });
export function createRealApi({request, setToken, clearToken}) {
const real = {
  // 諛깆뿏??濡쒓렇?몄? username 湲곗??대씪 媛????username???대찓?쇱쓣 ?ｊ퀬, 濡쒓렇???낅젰(?대찓????username?쇰줈 蹂대궦??
  async login({ email, password, remember }) {
    const { token } = await request('/api/auth/login', { method: 'POST', body: { username: email, password } });
    setToken(token, remember);
    try { return await real.me(); } catch(error) { clearToken(); throw error; }
  },
  // 媛???묐떟? {id}肉먯씠???댁뼱??濡쒓렇?명빐 ?먮룞 濡쒓렇?명븳?? username 而щ읆??50?먮씪 ?대찓?쇱씠 50?먮? ?섏쑝硫?媛?낆씠 ?ㅽ뙣?쒕떎.
  async register({ email, password, nickname, remember }) {
    await request('/api/auth/register', { method: 'POST', body: { username: email, email, password, nickname } });
    return real.login({ email, password, remember });
  },
  async logout() { clearToken(); return null; }, // ?쒕쾭 ?몄뀡???녿뒗 JWT 諛⑹떇?대씪 ?좏겙留?踰꾨┛??  async me() { return toUser(await request('/api/users/me')); },
  async updateProfile({ nickname }) {
    await request('/api/users/me', { method: 'PATCH', body: { nickname } });
    return real.me();
  },
  // 紐⑸줉? 理쒕? 100媛?諛곗뿴?대씪 type/?뺣젹(?볤???/?섏씠吏???ш린??泥섎━?쒕떎. 湲 ?좏삎???놁뼱 type=question? ??긽 鍮꾩뼱 ?덈떎.
  async listPosts({ category = '', q = '', sort = 'latest', type = '', authorId = '', page = 1, pageSize = 5 } = {}) {
    let items = (await request(`/api/posts?${qs({ category, q, sort: sort === 'popular' ? 'popular' : 'latest' })}`)).map(toPost);
    if (type === 'question') items = [];
    if (authorId) items = items.filter(p => p.authorId === authorId);
    if (sort === 'comments') items.sort((a, b) => b.commentCount - a.commentCount);
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
  },
  async getPost(id) { return toPost(await request(`/api/posts/${enc(id)}`)); },
  async createPost({ title, content, category }) {
    const { id } = await request('/api/posts', { method: 'POST', body: { title, content, category } });
    return { id: s(id) };
  },
  async updatePost(id, { title, content, category }) {
    await request(`/api/posts/${enc(id)}`, { method: 'PATCH', body: { title, content, category } });
    return { id };
  },
  deletePost: id => request(`/api/posts/${enc(id)}`, { method: 'DELETE' }),
  likePost: (id, liked) => request(`/api/posts/${enc(id)}/like`, { method: liked ? 'POST' : 'DELETE' }),
  async listComments(postId) { return (await request(`/api/posts/${enc(postId)}/comments`)).map(toComment); },
  async createComment({ postId, content }) {
    const { id } = await request(`/api/posts/${enc(postId)}/comments`, { method: 'POST', body: { content } });
    return { id: s(id) };
  },
  deleteComment: id => request(`/api/comments/${enc(id)}`, { method: 'DELETE' }),
  // ???볤?/醫뗭븘?뷀븳 湲 議고쉶 API媛 ?놁뼱 寃뚯떆湲 ??쭔 ?숈옉?쒕떎(理쒓렐 100媛?湲 以???湲). ?볤? ?섎뒗 ?????놁뼱 '-'濡??쒖떆?쒕떎.
  async profileActivity(kind) {
    const [me, rows] = await Promise.all([real.me(), request('/api/posts')]);
    const mine = rows.map(toPost).filter(p => p.authorId === me.id);
    return { stats: { posts: mine.length, comments: '-', likes: mine.reduce((n, p) => n + p.likeCount, 0) }, items: kind === 'posts' ? mine : [] };
  },
};
// ?꾨옒 愿由ъ옄 寃쎈줈???좉퇋 怨꾩빟?낅땲?? docs/ADMIN_API.md 李멸퀬.
const adminRequest = async (path, options) => {
  try { return await request(path, options); }
  catch (error) {
    if ((error.status === 404 && options?.method !== 'DELETE') || error.code === 'INVALID_RESPONSE') throw new ApiError('愿由ъ옄 API媛 ?꾩쭅 ?곌껐?섏? ?딆븯嫄곕굹 ?묐떟 ?뺤떇???ㅻ쫭?덈떎. 諛깆뿏???怨?ADMIN_API.md瑜??뺤씤?댁＜?몄슂.',error.status,'ADMIN_API_UNAVAILABLE');
    throw error;
  }
};
const adminList = async (path, params, map) => {
  const result = await adminRequest(`${path}?${qs(params)}`);
  if (!Array.isArray(result?.items) || !Number.isInteger(result.total) || result.total < 0) throw new ApiError('愿由ъ옄 紐⑸줉? {items,total,page,pageSize} ?뺤떇?댁뼱???⑸땲??',502,'ADMIN_INVALID_RESPONSE');
  return {...result,items:result.items.map(map)};
};
return {...real,
  adminListUsers: params => adminList('/api/users/admin/users',params,toUser),
  adminListPosts: params => adminList('/api/posts/admin/posts',params,toPost),
  adminListComments: params => adminList('/api/comments/admin/comments',params,c=>({...toComment(c),postTitle:c.post_title})),
  adminDeletePost: (id,reason) => adminRequest(`/api/posts/admin/posts/${enc(id)}`,{method:'DELETE',body:{reason}}),
  adminDeleteComment: (id,reason) => adminRequest(`/api/comments/admin/comments/${enc(id)}`,{method:'DELETE',body:{reason}}),
};
}

