// pages/login.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../utils/api'; // 导入 api 实例

const LoginPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginType, setLoginType] = useState<'user' | 'admin'>('user');

    const router = useRouter();

    const handleTabChange = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        setError('');
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // 前端验证
        if (!registerUsername || !registerPassword) {
            setError('用户名和密码不能为空');
            setIsLoading(false);
            return;
        }

        if (registerUsername.length < 4 || registerUsername.length > 16) {
            setError('用户名长度需在4-16位之间');
            setIsLoading(false);
            return;
        }

        if (registerPassword.length < 8) {
            setError('密码长度至少为8位');
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.post('/api/auth/register', {
                username: registerUsername,
                password: registerPassword,
            });

            if (res.status === 201) {
                setShowRegisterSuccess(true);
                setTimeout(() => {
                    setActiveTab('login');
                    setRegisterUsername('');
                    setRegisterPassword('');
                }, 1500);
            } else {
                setError(res.data.message || '注册失败');
            }
        } catch (err: any) {
            console.error('注册失败:', err);
            if (err.message.includes('timeout')) {
                setError('注册请求超时，请检查网络连接');
            } else if (err.message.includes('Network Error')) {
                setError('无法连接到服务器，请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. 服务器地址是否正确');
            } else {
                setError(err.response?.data?.message || err.message || '注册失败');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!loginUsername || !loginPassword) {
            setError('用户名和密码不能为空');
            setIsLoading(false);
            return;
        }

        // 登录类型校验
        if (loginType === 'admin') {
            if (loginUsername !== '00000000' || loginPassword !== '00000000') {
                setError('账号或密码错误');
                setIsLoading(false);
                return;
            }
        } else {
            if (loginUsername === '00000000') {
                setError('该账号名不可用于普通用户登录');
                setIsLoading(false);
                return;
            }
        }

        try {
            const res = await api.post('/api/auth/login', {
                username: loginUsername,
                password: loginPassword,
            });

            if (res.status === 200) {
                // 存储用户信息和 token
                localStorage.setItem('userInfo', JSON.stringify(res.data.user));
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('isAdmin', loginType === 'admin' ? 'true' : 'false');
            

                if (loginType === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } else {
                setError(res.data.message || '登录失败');
            }
        } catch (err: any) {
            console.error('登录失败:', err);
            if (err.message.includes('timeout')) {
                setError('登录请求超时，请检查网络连接');
            } else if (err.message.includes('Network Error')) {
                setError('无法连接到服务器，请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. 服务器地址是否正确');
            } else {
                setError(err.response?.data?.message || err.message || '登录失败');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `url('/login_background.jpg') center center/cover no-repeat #1a225a`,
            fontFamily: 'Poppins, Segoe UI, Helvetica Neue, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        }}>
            <div style={{
                width: '410px',
                background: 'rgba(241,247,254,0.92)',
                borderRadius: '30px',
                boxShadow: '0 0 2em #e6e9f9',
                padding: '2.5em 2.5em 2em 2.5em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2em',
                position: 'relative',
            }}>
                {/* LOGO/医院名 */}
                <div style={{marginTop: '-2.5em', marginBottom: '0.5em', textAlign: 'center'}}>
                    <svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="30" fill="#3e4684" /></svg>
                    <div style={{fontWeight: 700, fontSize: '1.7em', color: '#3e4684', marginTop: '0.5em', letterSpacing: '2px'}}>奔向端午医院</div>
                </div>
                {/* 登录模式下的UI元素 */}
                {activeTab === 'login' && (
                    <>
                        {/* 登录/注册 Tab - 样式与下方普通/管理员按钮一致 */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            gap: '1.5em',
                            marginBottom: '0.5em',
                        }}>
                            {/* "登录" Tab Button */}
                            <button
                                type="button"
                                onClick={() => handleTabChange('login')}
                                style={{
                                    flex: 1,
                                    padding: '0.5em 0.7em', // 略小于下方按钮的 padding: 0.7em 0
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '1em',
                                    background: activeTab === 'login' ? '#3e4684' : '#e6e9f9', // 根据 activeTab 改变颜色
                                    color: activeTab === 'login' ? '#fff' : '#3e4684', // 根据 activeTab 改变文字颜色
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                登录
                            </button>
                            {/* "注册" Tab Button */}
                            <button
                                type="button"
                                onClick={() => handleTabChange('register')}
                                style={{
                                    flex: 1,
                                    padding: '0.5em 0.7em', // 略小于下方按钮的 padding: 0.7em 0
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '1em',
                                    background: activeTab === 'register' ? '#3e4684' : '#e6e9f9', // 根据 activeTab 改变颜色
                                    color: activeTab === 'register' ? '#fff' : '#3e4684', // 根据 activeTab 改变文字颜色
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                注册
                            </button>
                        </div>
                        {/* 登录类型切换 */}
                        <div style={{display: 'flex', justifyContent: 'center', width: '100%', gap: '1.5em', marginBottom: '0.5em'}}>
                            <button
                                type="button"
                                className={loginType === 'user' ? 'login-type-btn active' : 'login-type-btn'}
                                onClick={() => setLoginType('user')}
                                style={{flex: 1, padding: '0.7em 0', borderRadius: '20px', border: 'none', fontWeight: 600, fontSize: '1em', background: loginType === 'user' ? '#3e4684' : '#e6e9f9', color: loginType === 'user' ? '#fff' : '#3e4684', cursor: 'pointer', transition: 'all 0.2s'}}
                            >
                                普通用户登录
                            </button>
                            <button
                                type="button"
                                className={loginType === 'admin' ? 'login-type-btn active' : 'login-type-btn'}
                                onClick={() => setLoginType('admin')}
                                style={{flex: 1, padding: '0.7em 0', borderRadius: '20px', border: 'none', fontWeight: 600, fontSize: '1em', background: loginType === 'admin' ? '#3e4684' : '#e6e9f9', color: loginType === 'admin' ? '#fff' : '#3e4684', cursor: 'pointer', transition: 'all 0.2s'}}
                            >
                                管理员登录
                            </button>
                        </div>
                        {error && (
                            <div style={{color: '#e53935', fontSize: '1em', textAlign: 'center', marginBottom: '-1em'}}>{error}</div>
                        )}
                        {/* 登录表单 */}
                        <form onSubmit={handleLoginSubmit} style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5em'}}>
                            <div style={{background: '#fff', boxShadow: '0 0 2em #e6e9f9', padding: '1em', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.5em', color: '#4d4d4d'}}>
                                <label htmlFor="loginUsername" style={{fontWeight: 500, fontSize: '1em', marginBottom: '0.2em'}}>用户名</label>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.7em'}}>
                                    <span style={{color: '#3e4684', fontSize: '1.2em'}}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                                    <input
                                        type="text"
                                        id="loginUsername"
                                        placeholder={loginType === 'admin' ? '请输入管理员账号' : '请输入用户名'}
                                        value={loginUsername}
                                        onChange={(e) => setLoginUsername(e.target.value)}
                                        disabled={isLoading}
                                        style={{flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '1em', color: '#222'}}
                                    />
                                </div>
                            </div>
                            <div style={{background: '#fff', boxShadow: '0 0 2em #e6e9f9', padding: '1em', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.5em', color: '#4d4d4d'}}>
                                <label htmlFor="loginPassword" style={{fontWeight: 500, fontSize: '1em', marginBottom: '0.2em'}}>密码</label>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.7em'}}>
                                    <span style={{color: '#3e4684', fontSize: '1.2em'}}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                                    <input
                                        type="password"
                                        id="loginPassword"
                                        placeholder="请输入密码"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        disabled={isLoading}
                                        style={{flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '1em', color: '#222'}}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="login"
                                style={{padding: '1em', background: '#3e4684', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 600, fontSize: '1.15em', marginTop: '0.5em', boxShadow: '0 2px 8px #e6e9f9', cursor: 'pointer', letterSpacing: '2px'}}
                                disabled={isLoading}
                            >
                                {isLoading ? '登录中...' : '登录'}
                            </button>
                        </form>
                    </>
                )}
                {/* 注册模式下的UI元素 */}
                {activeTab === 'register' && (
                    <>
                        {error && (
                             <div style={{color: '#e53935', fontSize: '1em', textAlign: 'center', marginBottom: '1em'}}>{error}</div>
                        )}
                        {/* 注册表单 */}
                        <form onSubmit={handleRegisterSubmit} style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5em'}}>
                             {/* Register form fields and button */}
                             <div style={{background: '#fff', boxShadow: '0 0 2em #e6e9f9', padding: '1em', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.5em', color: '#4d4d4d'}}>
                                 <label htmlFor="registerUsername" style={{fontWeight: 500, fontSize: '1em', marginBottom: '0.2em'}}>用户名</label>
                                 <div style={{display: 'flex', alignItems: 'center', gap: '0.7em'}}>
                                     <span style={{color: '#3e4684', fontSize: '1.2em'}}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                                     <input
                                         type="text"
                                         id="registerUsername"
                                         placeholder="请输入用户名"
                                         value={registerUsername}
                                         onChange={(e) => setRegisterUsername(e.target.value)}
                                         disabled={isLoading}
                                         style={{flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '1em', color: '#222'}}
                                     />
                                 </div>
                             </div>
                             <div style={{background: '#fff', boxShadow: '0 0 2em #e6e9f9', padding: '1em', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.5em', color: '#4d4d4d'}}>
                                 <label htmlFor="registerPassword" style={{fontWeight: 500, fontSize: '1em', marginBottom: '0.2em'}}>密码</label>
                                 <div style={{display: 'flex', alignItems: 'center', gap: '0.7em'}}>
                                     <span style={{color: '#3e4684', fontSize: '1.2em'}}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                                     <input
                                         type="password"
                                         id="registerPassword"
                                         placeholder="请输入密码"
                                         value={registerPassword}
                                         onChange={(e) => setRegisterPassword(e.target.value)}
                                         disabled={isLoading}
                                         style={{flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '1em', color: '#222'}}
                                     />
                                 </div>
                             </div>
                             <button
                                 type="submit"
                                 className="login"
                                 style={{padding: '1em', background: '#3e4684', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 600, fontSize: '1.15em', marginTop: '0.5em', boxShadow: '0 2px 8px #e6e9f9', cursor: 'pointer', letterSpacing: '2px'}}
                                 disabled={isLoading}
                             >
                                 {isLoading ? '处理中...' : '注册'}
                             </button>
                        </form>

                        {/* 注册成功消息 */}
                        {showRegisterSuccess && (
                             <div style={{color: '#28a745', fontSize: '1.1em', textAlign: 'center', marginTop: '1em'}}>注册成功！</div>
                        )}

                        {/* 返回登录链接 */}
                        <div style={{marginTop: '1.5em'}}>
                            <span style={{cursor: 'pointer', color: '#5e5e5e', fontSize: '0.95em'}} onClick={() => setActiveTab('login')}>返回登录</span>
                        </div>
                    </>
                )}
            </div>
            {/* 将返回首页链接放在卡片外部 */}
            <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)' }}>
                <Link href="/" style={{fontSize: '1.1rem', color: '#1976d2', textDecoration: 'underline'}}>返回首页</Link>
            </div>
        </div>
    );
};

export default LoginPage;