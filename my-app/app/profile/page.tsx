'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatAppointmentTime, getPaymentMethod,getStatusText} from '../utils/format';

const API_BASE = 'http://121.40.80.144:3001/api';

interface Registration {
    id: number;
    order_id: string;
    department?: string; // 科室信息，初始值为 undefined
    doctor_name: string;
    doctor_title: string;
    status: '已预约' | '已取消' | '已完成' | 'paid';
    appointment_time: string;
    appointment_price: string;
    clinicLocation?: string;
    payment_method?: string;
    doctor_id: number; // 医生ID
}



export default function ProfilePage() {
    const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('请先登录');
            router.push('/login');
            return;
        }

        const fetchRegistrations = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('正在请求用户挂号记录...');
                const res = await fetch(`${API_BASE}/appointments`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(10000)
                });

                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userInfo');
                    localStorage.removeItem('isAdmin');
                    alert('登录已过期，请重新登录');
                    router.push('/login');
                    return;
                }

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('服务器错误响应:', errorText);
                    throw new Error(`获取挂号记录失败: ${res.status} ${res.statusText}\n${errorText}`);
                }

                const data = await res.json();
                console.log('获取到的挂号记录:', data);

                if (Array.isArray(data)) {
                    // 并行获取科室信息
                    const registrationsWithDepartment = await Promise.all(
                        data.map(async (item): Promise<Registration> => {
                            try {
                                // 根据 doctor_id 获取科室信息
                                const department = await fetchDepartmentByDoctorId(item.doctor_id, token);
                                return { ...item, department };
                            } catch (err) {
                                console.error(`获取医生 ${item.doctor_id} 的科室信息失败:`, err);
                                return { ...item, department: '未知科室' }; // 获取失败时，设置默认值
                            }
                        })
                    );
                    setUserRegistrations(registrationsWithDepartment);
                } else {
                    console.warn('后端返回的挂号记录不是一个数组:', data);
                    setError('后端返回的挂号记录格式不正确');
                    setUserRegistrations([]); // 设置为空数组，避免渲染错误
                }
            } catch (err: any) {
                console.error('获取挂号记录失败:', err);
                if (err.name === 'AbortError') {
                    setError('请求超时，请检查网络连接');
                } else if (err.message.includes('Failed to fetch')) {
                    setError('无法连接到服务器，请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. 服务器地址是否正确');
                } else {
                    setError(err.message || '获取挂号记录失败');
                }
            } finally {
                setLoading(false);
            }
        };

        // 封装一个函数，根据 doctor_id 获取科室信息
     const fetchDepartmentByDoctorId = async (doctorId: number, token: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/doctors/department?doctorId=${doctorId}`, { // 替换为你的 API 接口
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`获取医生 ${doctorId} 的科室信息失败:`, errorText);
        throw new Error(`获取科室信息失败: ${res.status} ${res.statusText}\n${errorText}`);
    }

    const data = await res.json();
    return data.department; // 假设后端返回的数据格式为 { department: '科室名称' }
         };

        fetchRegistrations();
    }, [router]);

    const handleLogout = async () => {
        try {
            // 调用后端登出接口
            const res = await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('登出失败:', errorText);
                // 可以选择显示错误信息给用户，例如使用 Toast
            }
        } catch (error) {
            console.error('登出请求失败:', error);
            // 可以选择显示错误信息给用户，例如使用 Toast
        } finally {
            // 无论后端请求是否成功，都清除前端状态
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('isAdmin');
            // 返回首页 - 使用硬跳转确保生效
            window.location.href = '/';
        }
    };

    if (loading) {
        return <div className="loading">加载中...</div>; // 添加加载提示
    }

    if (error) {
        return <div className="error-message">错误：{error}</div>; // 添加错误提示
    }


    return (
        <div className="profile-container">
            <header>
                <h1>个人中心</h1>
                <Link href="/" className="return-btn">返回首页</Link>
            </header>
            <div className="user-registrations">
                <h3 className="section-title">我的挂号记录</h3>
                {userRegistrations.length > 0 ? (
                    <ul>
                        {userRegistrations.map((reg) => (
                            <li key={reg.id}>
                                <div>订单号：{reg.order_id ?? 'N/A'}</div>
                                <div>科室：{reg.department ?? 'N/A'}</div>
                                <div>医生：{reg.doctor_name ?? 'N/A'} ({reg.doctor_title ?? 'N/A'})</div>
                                <div>状态：{getStatusText(reg.status) ?? '未知'}</div>
                                <div>时间：{formatAppointmentTime(reg.appointment_time) ?? 'N/A'}</div>
                                <div>费用：{reg.appointment_price ?? 'N/A'} 元</div>
                                {reg.clinicLocation && <div>诊室：{reg.clinicLocation ?? 'N/A'}</div>}
                                {reg.payment_method && <div>支付方式：{getPaymentMethod(reg.payment_method) ?? 'N/A'}</div>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    !loading && <p>暂无挂号记录</p>
                )}
            </div>
            {/* 添加登出按钮 */}
            <div className="logout-section mt-8">
                <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full"
                    onClick={handleLogout}
                >
                    退出登录
                </button>
            </div>
        </div>
    );
}