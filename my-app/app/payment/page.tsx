//payment/page.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import '../style.css';

type PaymentInfo = {
    orderId: string;
    amount: number;
    department: string;
    paymentMethod?: 'wechat' | 'alipay';
    paymentStatus: 'pending' | 'processing' | 'success' | 'failed';
};

const PaymentPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<'wechat' | 'alipay' | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // 控制弹窗的显示

       // 从环境变量中获取 API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';


    // 从URL参数获取订单信息
    useEffect(() => {
        const orderId =searchParams.get('orderId');
        const amount =  Number(searchParams.get('amount'));
        const department = searchParams.get('department')|| '';
        if (!orderId || isNaN(amount)) {
            setError('无效的订单信息');
            setLoading(false);
            return;
        }

        setPaymentInfo({
            orderId,
            amount,
            department,
            paymentStatus: 'pending'
        });
        setLoading(false);
    }, [searchParams]);

        const handleBack = async() => {
            setError('支付已取消');
            await new Promise(resolve => setTimeout(resolve, 1000));
        // 跳转到挂号页面并传递参数显示弹窗
            // 返回到来源科室页面
            router.push(`/department?department=${encodeURIComponent(paymentInfo?.department || '')}`);
    };
    const handlePayment = async () => {
        // 如果没有选择支付方式
        if (!selectedPayment) {
            setError('支付失败，请选择支付方式');
            setPaymentStatus('failed');
            return;
        }

        setPaymentStatus('processing');
        setError(null);

    try {
      // 调用 /payment API  
      
      const response = await fetch(`${apiUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentInfo?.orderId,
          paymentResult: {
          paymentMethod: selectedPayment,
          amount: paymentInfo?.amount
            }  
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 支付成功
        setPaymentStatus('success');
        setShowSuccessPopup(true);

        // 显示支付成功，5秒后跳转到主页
        setTimeout(() => {
          router.push('/');
        }, 5000);
      } else {
        // 支付失败
        setError(data.message || '支付失败');
        setPaymentStatus('failed');
      }
    } catch (err) {
      console.error('支付失败:', err);
      setPaymentStatus('failed');
      setError('支付处理失败，请重试');
    }
  };

   

    const renderPaymentContent = () => {
        if (loading) {
            return <div className="loading">加载订单信息中...</div>;
        }

        if (error && !paymentInfo) {
            return (
                <div className="error-container">
                    <div className="error">{error}</div>
                    <button className="return-btn" onClick={() => router.push('/department')}>
                        返回挂号页面
                    </button>
                </div>
            );
        }

        switch (paymentStatus) {
            case 'success':
                return (
                    <div className="payment-result success">
                        <h2>支付成功</h2>
                        <p>订单号: {paymentInfo?.orderId}</p>
                        <p>支付金额: ¥{paymentInfo?.amount.toFixed(2)}</p>
                        <p>科室:{paymentInfo?.department }</p>
                        <p>支付方式: {paymentInfo?.paymentMethod === 'wechat' ? '微信支付' : '支付宝'}</p>
                        <button
                            className="return-btn"
                            onClick={() => router.push('/')}
                        >
                            返回首页
                        </button>
                    </div>
                );

            case 'processing':
                return (
                    <div className="payment-result processing">
                        <h2>支付处理中...</h2>
                        <p>请稍候，正在处理您的支付请求</p>
                        <div className="spinner"></div>
                    </div>
                );

            case 'failed':
                return (
                    <div className="payment-result failed">
                        <h2>支付失败</h2>
                        <p>{error}</p>
                        <button
                            className="retry-btn"
                            onClick={() => setPaymentStatus('pending')}
                        >
                            重试支付
                        </button>
                    </div>
                );

            default:
                return (
                    <>
                        <div className="order-info">
                            <h2>订单信息</h2>
                            <p>订单号: {paymentInfo?.orderId}</p>
                            <p className="price">金额: ¥{paymentInfo?.amount.toFixed(2) || '0.00'}</p>
                            <p>科室:{ paymentInfo?.department}</p>
                        </div>

                        <h2>选择支付方式</h2>

                        <div
                            className={`payment-method ${selectedPayment === 'wechat' ? 'selected' : ''}`}
                            onClick={() => setSelectedPayment('wechat')}
                        >
                            <img
                                src="/wechat-pay.jpg"
                                alt="微信支付"
                                className="payment-icon"
                            />
                            <div>
                                <h3>微信支付</h3>
                                <p>推荐微信用户使用</p>
                            </div>
                        </div>

                        <div
                            className={`payment-method ${selectedPayment === 'alipay' ? 'selected' : ''}`}
                            onClick={() => setSelectedPayment('alipay')}
                        >
                            <img
                                src="/alipay.jpg"
                                alt="支付宝"
                                className="payment-icon"
                            />
                            <div>
                                <h3>支付宝</h3>
                                <p>推荐支付宝用户使用</p>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            className="pay-btn"
                            onClick={handlePayment}
                        >
                            立即支付
                        </button>
                    </>
                );
        }
    };

    return (
        <div className="payment-container">
            <header>
                <h1>支付挂号费</h1>
                {paymentStatus === 'pending' && (
                    <button className="return-btn" onClick={handleBack}>返回</button>
                )}
            </header>

            {renderPaymentContent()}

            {showSuccessPopup && (
                <div className="success-popup">
                    <h3>支付成功！</h3>
                    <p>支付已成功完成，我们将返回到首页。</p>
                </div>
            )}

            <style>{`
                .payment-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Microsoft YaHei', sans-serif;
                }
                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .return-btn, .retry-btn {
                    background: none;
                    border: 1px solid #ddd;
                    padding: 5px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 15px;
                }
                .retry-btn {
                    background-color: #ff4d4f;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                }
                .order-info {
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .payment-method {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.3s;
                }
                .payment-method:hover {
                    background-color: #f5f5f5;
                }
                .payment-method.selected {
                    border-color: #1890ff;
                    background-color: #e6f7ff;
                }
                .payment-icon {
                    width: 40px;
                    height: 40px;
                    margin-right: 15px;
                }
                .price {
                    color: #f5222d;
                    font-weight: bold;
                    font-size: 18px;
                }
                .pay-btn {
                    width: 100%;
                    background-color: #1890ff;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: background-color 0.3s;
                }
                .pay-btn:hover {
                    background-color: #40a9ff;
                }
                .pay-btn:disabled {
                    background-color: #8c8c8c;
                    cursor: not-allowed;
                }
                .loading, .error-container {
                    text-align: center;
                    padding: 20px;
                }
                .error {
                    color: #f5222d;
                }
                .error-message {
                    color: #f5222d;
                    margin: 10px 0;
                    text-align: center;
                }
                .payment-result {
                    text-align: center;
                    padding: 20px;
                }
                .payment-result.success {
                    color: #52c41a;
                }
                .payment-result.failed {
                    color: #f5222d;
                }
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top: 4px solid #1890ff;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                .success-popup {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    z-index: 9999;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PaymentPage;
