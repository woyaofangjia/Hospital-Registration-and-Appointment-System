'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './GuidePage.module.css';

const GuidePage = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [patientAge, setPatientAge] = useState<number | null>(null);
    const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [recommendDept, setRecommendDept] = useState<string | null>(null);
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    // 人体部位与症状映射
    type BodyPart = '头部' | '胸部' | '腹部' | '生殖系统' | '四肢' | '全身症状';
    
    const bodyParts: Record<BodyPart, string[]> = {
        '头部': [
            '头痛', '头晕', '外伤', '发热', '失眠', '耳鸣', '视力模糊', 
            '鼻塞', '流涕', '咽喉痛', '口腔溃疡', '牙痛', '面部疼痛', '颈部疼痛', '脱发', '头皮痒'
        ],
        '胸部': [
            '胸痛', '胸闷', '心悸', '乳房肿块', '咳嗽', '呼吸困难', 
            '咯血', '哮喘', '气短', '胸骨后疼痛', '背痛', '肩膀痛'
        ],
        '腹部': [
            '腹痛', '腹泻', '恶心呕吐', '便秘', '腹胀', '黄疸', 
            '食欲不振', '消化不良', '胃痛', '反酸', '黑便', '便血', '腹部肿块', '肝区痛', '胆囊区痛'
        ],
        '生殖系统': [
            '月经不调', '下腹痛', '阴道出血', '早孕检查', '性传播疾病',
            '排尿困难', '尿频尿急', '血尿', '性功能障碍', '不孕不育', '睾丸疼痛', '前列腺问题'
        ],
        '四肢': [
            '关节痛', '肌肉酸痛', '骨折', '扭伤', '麻木', '水肿',
            '皮肤瘙痒', '皮疹', '伤口感染', '静脉曲张', '肢体无力', '肢体畸形', '指甲异常'
        ],
        '全身症状': [
            '发热', '乏力', '体重下降', '过敏', '贫血', '淋巴结肿大',
            '多汗', '皮肤发黄', '浮肿', '精神症状', '不明原因疼痛', '全身抽搐', '异常出血或瘀伤'
        ]
    };

    // 部位坐标和样式 - 调整了高度和间距
    const partCoordinates: Record<BodyPart, { top: string; left: string; width: string; height: string; shape: 'circle' | 'rect' }> = {
        '头部': { top: '5%', left: '50%', width: '20%', height: '10%', shape: 'circle' }, // 调高位置，减小高度
        '胸部': { top: '18%', left: '50%', width: '28%', height: '15%', shape: 'rect' }, // 调低位置，增大高度
        '腹部': { top: '35%', left: '50%', width: '25%', height: '15%', shape: 'rect' }, // 调低位置
        '生殖系统': { top: '52%', left: '50%', width: '20%', height: '5%', shape: 'rect' }, // 调低位置
        '四肢': { top: '58%', left: '50%', width: '35%', height: '35%', shape: 'rect' }, // 调低位置，增大高度
        '全身症状': { top: '0%', left: '0%', width: '100%', height: '100%', shape: 'rect' } // 覆盖整个区域
    };

    // 科室推荐规则
    const departmentRules: Record<string, string> = {
        // 内科相关症状
        '头痛': '神经内科', '头晕': '神经内科', '发热': '感染科', '胸闷': '心内科', 
        '心悸': '心内科', '腹泻': '消化内科', '恶心呕吐': '消化内科', '便秘': '消化内科', 
        '咳嗽': '呼吸内科', '失眠': '神经内科', '呼吸困难': '呼吸内科', '咯血': '呼吸内科',
        '哮喘': '呼吸内科', '气短': '呼吸内科', '胸骨后疼痛': '消化内科', '腹痛': '消化内科',
        '黄疸': '消化内科', '食欲不振': '消化内科', '消化不良': '消化内科', '胃痛': '消化内科',
        '反酸': '消化内科', '黑便': '消化内科', '乏力': '血液科', '贫血': '血液科',
        '淋巴结肿大': '血液科', '多汗': '内分泌科', '皮肤发黄': '肝胆科', '浮肿': '肾内科',
        '精神症状': '精神科', '不明原因疼痛': '全科', '全身抽搐': '神经内科', '异常出血或瘀伤': '血液科',

        // 外科相关症状
        '外伤': '创伤外科', '乳房肿块': '乳腺外科', '腹胀': '普外科', '胸痛': '胸外科',
        '骨折': '骨科', '扭伤': '骨科', '关节痛': '骨科', '肌肉酸痛': '骨科',
        '静脉曲张': '血管外科', '伤口感染': '普外科', '背痛': '骨科', '肩膀痛': '骨科',
        '腹部肿块': '普外科', '肝区痛': '肝胆外科', '胆囊区痛': '肝胆外科', '睾丸疼痛': '泌尿外科', '前列腺问题': '泌尿外科',

        // 妇产科相关症状
        '月经不调': '妇产科', '下腹痛': '妇产科', '阴道出血': '妇产科', '早孕检查': '妇产科',
        '性传播疾病': '妇产科', '不孕不育': '生殖医学科',

        // 泌尿外科相关症状
        '排尿困难': '泌尿外科', '尿频尿急': '泌尿外科', '血尿': '泌尿外科',
        '性功能障碍': '泌尿外科',

        // 皮肤科相关症状
        '皮肤瘙痒': '皮肤科', '皮疹': '皮肤科', '指甲异常': '皮肤科',

        // 五官科相关症状
        '耳鸣': '耳鼻喉科', '视力模糊': '眼科', '鼻塞': '耳鼻喉科', '流涕': '耳鼻喉科',
        '咽喉痛': '耳鼻喉科', '口腔溃疡': '口腔科', '牙痛': '口腔科', '面部疼痛': '口腔科', '颈部疼痛': '骨科', '脱发': '皮肤科', '头皮痒': '皮肤科',

        // 其他症状
        '过敏': '变态反应科', '体重下降': '内分泌科', '麻木': '神经内科', '肢体无力': '神经内科', '肢体畸形': '骨科', '便血': '肛肠科',

        // 全科兜底
        '其他': '全科', // 添加一个通用的全科入口症状
    };

    // 步骤1：输入年龄
    const handleAgeNext = () => {
        const ageInput = document.getElementById('ageInput') as HTMLInputElement;
        const age = parseInt(ageInput.value);

        if (isNaN(age) || age < 0 || age > 120) {
            alert("请输入有效的年龄（0-120岁）");
            return;
        }

        setPatientAge(age);

        // 儿童直接推荐儿科
        if (age < 14) {
            setRecommendDept('儿科');
            setCurrentStep(4);
        } else {
            setCurrentStep(2);
        }
    };

    // 步骤2：选择身体部位
    const handlePartSelect = (part: string) => {
        setSelectedPart(part as BodyPart);

        if (part === '生殖系统') {
            
            setCurrentStep(3);
        } else {
            setCurrentStep(3);
        }
    };

    // 步骤3：选择具体症状
    const handleSymptomSelect = (symptom: string) => {
        const dept = departmentRules[symptom] || '全科';
        setRecommendDept(dept);
        setCurrentStep(4);
    };
    useEffect(() => {
        const checkLoginStatus = () => {
            const token = localStorage.getItem('token');
            const userInfo = localStorage.getItem('userInfo');
            setIsLoggedIn(!!(token && userInfo));
        };
        checkLoginStatus();
    }, []);
    // 处理挂号跳转

    const handleAppointmentRedirect = () => {
        if (isLoggedIn === true) {
            router.push(`/appointment?department=${encodeURIComponent(recommendDept || '全科')}`);
        } else if (isLoggedIn === false) {
             alert('请先登录后再挂号！');
        }
        // isLoggedIn为null时不处理
    };
    // 重新开始
    const restartGuide = () => {
        setCurrentStep(1);
        setPatientAge(null);
        setSelectedPart(null);
        setSelectedSymptoms([]);
        setRecommendDept(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className="text-2xl font-bold">智能症状分诊系统</h1>
                    <Link href="/" className="bg-white/10 hover:bg-white/20 text-sm px-6 py-2 rounded-full transition-all">
                        返回首页
                    </Link>
                </div>
            </header>

            <main className={styles.main}>
                {/* 步骤指示器 */}
                <div className={styles.steps}>
                    {[1, 2, 3, 4].map(step => (
                        <div
                            key={step}
                            className={`${styles.step} ${currentStep >= step ? styles.stepActive : styles.stepInactive
                                }`}
                        >
                            {step}
                        </div>
                    ))}
                </div>

                {/* 步骤1：年龄输入 */}
                {currentStep === 1 && (
                    <div className={styles.card}>
                        <h2 className="text-2xl text-[#0072c6] mb-6 font-semibold">
                            请先输入患者年龄
                        </h2>
                        <input
                            type="number"
                            id="ageInput"
                            className={styles.input}
                            min="0"
                            max="120"
                            placeholder="请输入周岁年龄"
                        />
                        <p className="mt-4 text-gray-500 text-sm">（14岁以下儿童将直接推荐儿科）</p>
                        <button
                            className={`${styles.button} ${styles.buttonPrimary} mt-8`}
                            onClick={handleAgeNext}
                        >
                            下一步
                        </button>
                    </div>
                )}

                {/* 步骤2：人体图选择（仅成人显示） */}
                {currentStep === 2 && patientAge && patientAge >= 14 && (
                    <div className={styles.card}>
                        <h2 className="text-2xl text-[#0072c6] mb-8 text-center font-semibold">
                            请点击不适部位
                        </h2>

                        <div className={styles.bodyContainer}>
                            {/* 人体示意图 */}
                            <img
                                src="/human-body.jpg"
                                alt="人体示意图"
                                className={styles.bodyImage}
                                useMap="#bodyMap"
                            />

                            {/* 可点击热区 */}
                            <div className="absolute inset-0">
                                {Object.entries(partCoordinates).map(([part, coord]) => (
                                    <div
                                        key={part}
                                        className={`${styles.hotspot} ${coord.shape === 'circle' ? styles.hotspotCircle : ''
                                            }`}
                                        style={{
                                            top: coord.top,
                                            left: coord.left,
                                            width: coord.width,
                                            height: coord.height,
                                            transform: 'translate(-50%, 0)'
                                        }}
                                        onClick={() => handlePartSelect(part)}
                                        onMouseEnter={() => setHoveredPart(part)}
                                        onMouseLeave={() => setHoveredPart(null)}
                                    >
                                        {hoveredPart === part && (
                                            <div className={styles.hotspotLabel}>
                                                {part}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 步骤3：症状选择 */}
                {currentStep === 3 && selectedPart && (
                    <div className={styles.card}>
                        <h2 className="text-2xl text-[#0072c6] mb-8 text-center font-semibold">
                            请选择{selectedPart}的具体症状
                        </h2>
                        <div className={styles.symptomsGrid}>
                            {bodyParts[selectedPart].map((symptom: string) => (
                                <button
                                    key={symptom}
                                    onClick={() => handleSymptomSelect(symptom)}
                                    className={styles.symptomItem}
                                >
                                    <span className={styles.symptomDot}></span>
                                    {symptom}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 步骤4：推荐结果 */}
                {currentStep === 4 && recommendDept && (
                    <div className={styles.card}>
                        <h2 className={styles.resultTitle}>
                            推荐就诊科室
                        </h2>

                        {patientAge && patientAge < 14 && (
                            <div className={styles.childrenNotice}>
                                <p>根据儿童年龄（{patientAge}岁）直接推荐儿科就诊</p>
                            </div>
                        )}

                        <div className={styles.resultContent}>
                            {recommendDept}
                        </div>

                        <div className={styles.buttonGroup}>
                            <button
                                onClick={restartGuide}
                                className={`${styles.button} ${styles.buttonSecondary}`}
                            >
                                重新分诊
                            </button>
                            <button
                                onClick={handleAppointmentRedirect}
                                className={`${styles.button} ${styles.buttonTertiary}`}
                                disabled={isLoggedIn === null}
                            >
                                {isLoggedIn === null ? '检查登录中...' : '立即挂号'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GuidePage; 
