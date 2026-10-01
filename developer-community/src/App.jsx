import { Component, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Footer, Header, Protected } from './components/common';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import PostEditor from './pages/PostEditor';
import Profile from './pages/Profile';
import { isMock } from './api';
class ErrorBoundary extends Component {state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="panel state"><h1>화면을 표시할 수 없습니다</h1><button onClick={()=>window.location.reload()}>새로고침</button></div>:this.props.children;}}
function ScrollTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);},[pathname]);return null;}
export default function App(){const {pathname}=useLocation();const auth=pathname==='/auth';return <ErrorBoundary><ScrollTop/><a className="skip-link" href="#main">본문 바로가기</a>{!auth&&<Header/>}<main id="main" className={auth?'':'container'}>{isMock&&!auth&&<div className="mode-note">DEMO · 브라우저에 저장되는 mock 모드</div>}<Routes><Route path="/" element={<Home/>}/><Route path="/auth" element={<Auth/>}/><Route path="/posts" element={<Posts/>}/><Route path="/posts/new" element={<Protected><PostEditor key="new"/></Protected>}/><Route path="/posts/:id" element={<PostDetail/>}/><Route path="/posts/:id/edit" element={<Protected><PostEditor key={pathname}/></Protected>}/><Route path="/profile" element={<Protected><Profile/></Protected>}/><Route path="*" element={<div className="panel state"><h1>페이지를 찾을 수 없습니다</h1><Link to="/">홈으로 돌아가기</Link></div>}/></Routes></main>{!auth&&<Footer/>}</ErrorBoundary>;}
