// utils/format.ts
export const formatAppointmentTime = (time: string): string => {
    const appointmentTime = new Date(time);
    const formattedDate = appointmentTime.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    const formattedTime = appointmentTime.toLocaleTimeString('zh-CN', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });
    return `${formattedDate} ${formattedTime}`;
};

export const getPaymentMethod = (method?: string): string => {
    if (!method) return 'N/A';
    const paymentMethodMap: { [key: string]: string } = {
        'wechat': '微信',
        'alipay': '支付宝',
        // 添加其他支付方式的映射关系
    };
    return paymentMethodMap[method] || '未知';
};
// 状态转换函数
export const getStatusText = (status: string): string => {
        if (status === 'paid') {
            return '已支付';
        }
        return status; // 返回原始状态
    };