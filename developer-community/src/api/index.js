import { request, setToken, clearToken } from './client.js';
import { createRealApi } from './real.js';
export const isMock = (import.meta.env.VITE_DATA_MODE || 'mock') === 'mock';
// 운영 API 빌드에는 mock 데이터와 데모 비밀번호를 포함하지 않습니다.
export const api = isMock ? (await import('./mock.js')).mockApi : createRealApi({request,setToken,clearToken});
