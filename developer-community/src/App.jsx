import { Component, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Footer, Header, Protected } from './components/common';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import PostEditor from './pages/PostEditor';
import Profile from './pages/Profile';
import AdminOnly from './components/AdminOnly';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminList from './pages/admin/AdminList';
class ErrorBoundary extends Component {state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="panel state"><h1>화면을 표시할 수 없습니다</h1><button onClick={()=>window.location.reload()}>새로고침</button></div>:this.props.children;}}
function ScrollTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);},[pathname]);return null;}
export default function App(){
  const {pathname}=useLocation();const auth=pathname==='/auth';
  return <ErrorBoundary><ScrollTop/><a className="skip-link" href="#main">본문 바로가기</a>{!auth&&<Header/>}<main id="main" className={auth?'':'w-full min-h-[calc(100vh-140px)] bg-surface px-4 sm:px-6 pt-24 sm:pt-28 pb-8 sm:pb-12'}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/auth" element={<Auth/>}/><Route path="/posts" element={<Posts/>}/><Route path="/posts/new" element={<Protected><PostEditor key="new"/></Protected>}/><Route path="/posts/:id" element={<PostDetail/>}/><Route path="/posts/:id/edit" element={<Protected><PostEditor key={pathname}/></Protected>}/><Route path="/profile" element={<Protected><Profile/></Protected>}/>
    <Route path="/admin" element={<Protected><AdminOnly><AdminLayout/></AdminOnly></Protected>}>
      <Route index element={<AdminDashboard/>}/>
      <Route path="posts" element={<AdminList kind="posts" key="posts"/>}/>
      <Route path="comments" element={<AdminList kind="comments" key="comments"/>}/>
      <Route path="users" element={<AdminList kind="users" key="users"/>}/>
    </Route>
    <Route path="*" element={<div className="panel state"><h1>페이지를 찾을 수 없습니다</h1><Link to="/">홈으로 돌아가기</Link></div>}/>
  </Routes></main>{!auth&&<Footer/>}</ErrorBoundary>;
}
