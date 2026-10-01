import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  async function refresh() {setLoading(true);setError('');try{setUser(await api.me());}catch(e){setUser(null);if(e.status!==401)setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{refresh();},[]);
  useEffect(()=>{const clear=()=>setUser(null);window.addEventListener('auth-expired',clear);return()=>window.removeEventListener('auth-expired',clear);},[]);
  const login=async values=>{setUser(await api.login(values));setError('');};
  const register=async values=>{setUser(await api.register(values));setError('');};
  const logout=async()=>{await api.logout();setUser(null);};
  return <AuthContext.Provider value={{user,loading,error,refresh,login,register,logout,setUser}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
