import { ApiError } from './errors.js';
const TOKEN = 'nangiryu-token';
// 백엔드가 JWT를 응답 본문으로 주고 Authorization: Bearer로만 검증한다. remember면 localStorage, 아니면 탭이 닫히면 사라지는 sessionStorage.
export const getToken = () => { try { return localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN); } catch { return null; } };
export const clearToken = () => { try { localStorage.removeItem(TOKEN); sessionStorage.removeItem(TOKEN); } catch { /* 저장소 사용 불가 */ } };
export const setToken = (token, remember = false) => { clearToken(); try { (remember ? localStorage : sessionStorage).setItem(TOKEN, token); } catch { /* 저장소 사용 불가 */ } };
export async function request(path, { method = 'GET', body, signal } = {}) {
  if (!/^\/api\/(auth|users|posts|comments)(\/|\?|$)/.test(path)) throw new Error('허용된 상대경로 API만 사용할 수 있습니다.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const token = getToken();
  try {
    const response = await fetch(path, { method, signal: controller.signal,
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    if (response.status === 204) return null;
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;
    if (!response.ok) {
      if (response.status === 401) { clearToken(); window.dispatchEvent(new Event('auth-expired')); }
      throw new ApiError(payload?.message || `요청 실패 (${response.status})`, response.status, payload?.code);
    }
    if (!isJson) throw new ApiError('API 응답 형식을 확인해주세요.', 502, 'INVALID_RESPONSE');
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('요청이 취소되었거나 응답 시간이 초과되었습니다.', 408, 'TIMEOUT');
    if (error instanceof ApiError) throw error;
    throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', 0, 'NETWORK');
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
