import { request, setToken, clearToken } from './client.js';
export const isMock = (import.meta.env.VITE_DATA_MODE || 'mock') === 'mock';
// 실제 백엔드(users/contents-service) 응답을 화면이 쓰는 모양으로 바꾸는 어댑터. 백엔드에 없는 필드는 아래 기본값으로 채운다:
// type='blog', tags=[], bio='' (DB에 컬럼 없음, 글 유형/태그/자기소개는 저장되지 않는다).
const s = v => (v == null ? v : String(v));
const enc = encodeURIComponent;
const qs = params => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
const toUser = u => ({ id: s(u.id), email: u.email, nickname: u.nickname, bio: '', joinedAt: u.created_at });
const toPost = p => ({ id: s(p.id), title: p.title, content: p.content ?? '', category: p.category, type: 'blog', tags: [],
  authorId: s(p.user_id), author: { nickname: p.nickname }, createdAt: p.created_at, updatedAt: p.updated_at ?? p.created_at,
  views: p.view_count, likeCount: p.like_count ?? 0, commentCount: p.comment_count ?? 0, liked: !!p.liked });
const toComment = c => ({ id: s(c.id), postId: s(c.post_id), authorId: s(c.user_id), author: { nickname: c.nickname }, content: c.content, createdAt: c.created_at });
const real = {
  // 백엔드 로그인은 username 기준이라 가입 때 username에 이메일을 넣고, 로그인 입력(이메일)을 username으로 보낸다.
  async login({ email, password, remember }) {
    const { token } = await request('/api/auth/login', { method: 'POST', body: { username: email, password } });
    setToken(token, remember);
    return real.me();
  },
  // 가입 응답은 {id}뿐이라 이어서 로그인해 자동 로그인한다. username 컬럼이 50자라 이메일이 50자를 넘으면 가입이 실패한다.
  async register({ email, password, nickname, remember }) {
    await request('/api/auth/register', { method: 'POST', body: { username: email, email, password, nickname } });
    return real.login({ email, password, remember });
  },
  async logout() { clearToken(); return null; }, // 서버 세션이 없는 JWT 방식이라 토큰만 버린다
  async me() { return toUser(await request('/api/users/me')); },
  async updateProfile({ nickname }) {
    await request('/api/users/me', { method: 'PATCH', body: { nickname } });
    return real.me();
  },
  // 목록은 최대 100개 배열이라 type/정렬(댓글순)/페이지는 여기서 처리한다. 글 유형이 없어 type=question은 항상 비어 있다.
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
  // 내 댓글/좋아요한 글 조회 API가 없어 게시글 탭만 동작한다(최근 100개 글 중 내 글). 댓글 수는 알 수 없어 '-'로 표시한다.
  async profileActivity(kind) {
    const [me, rows] = await Promise.all([real.me(), request('/api/posts')]);
    const mine = rows.map(toPost).filter(p => p.authorId === me.id);
    return { stats: { posts: mine.length, comments: '-', likes: mine.reduce((n, p) => n + p.likeCount, 0) }, items: kind === 'posts' ? mine : [] };
  },
};
// 운영 API 빌드에는 mock 구현 및 데모 비밀번호를 포함하지 않습니다.
export const api = isMock ? (await import('./mock.js')).mockApi : real;
