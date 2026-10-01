import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../auth/permissions';
export default function AdminOnly({children}) {
  const {user}=useAuth();
  if(!isAdmin(user)) return <section className="panel state access-denied"><ShieldX size={38}/><h1>관리자만 접근할 수 있습니다</h1><p className="muted">현재 계정에는 운영 관리 권한이 없습니다.</p><Link className="button primary" to="/">홈으로 돌아가기</Link></section>;
  return children;
}
