import React, { useState, useEffect } from 'react';
import { Check, Info, Sparkles, Building2, User, Loader2, Wallet } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

const PLAN_GRADIENTS = {
    FREE: 'linear-gradient(135deg, #22d3ee, #60a5fa)',
    PRO: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    TEAM: 'linear-gradient(135deg, #f472b6, #a78bfa)',
};

export default function Settings() {
    const [currentPlan, setCurrentPlan] = useState('free');
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [paymentIntent, setPaymentIntent] = useState(null);

    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch subscription and plans independently so one failure doesn't block the other
            try {
                const subRes = await api.get('/subscription');
                if (subRes && subRes.data) {
                    setSubscription(subRes.data);
                    if (subRes.data.plan_id) setCurrentPlan(subRes.data.plan_id.toLowerCase());
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error);
            }

            try {
                const plansRes = await api.get('/subscription/plans');
                if (plansRes && plansRes.data) {
                    const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
                    setPlans(plansData);
                }
            } catch (error) {
                console.error('Failed to fetch plans:', error);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const handleUpgradeClick = async (planName) => {
        const plan = planName.toLowerCase();
        if (plan === currentPlan) return;
        
        setUpgrading(true);
        try {
            const res = await api.post('/subscription/payment/apply-discount', { plan });
            if (res && res.data) {
                setPaymentIntent({ plan, data: res.data });
            }
        } catch (err) {
            console.error('Failed to calculate discount', err);
            alert('Failed to initiate upgrade process.');
        } finally {
            setUpgrading(false);
        }
    };

    const handleCheckout = async (usePoints) => {
        try {
            setUpgrading(true);
            const { plan } = paymentIntent;
            const res = await api.post('/subscription/payment/create-order', { plan, usePoints });
            
            // res is already response.data due to Axios interceptor
            if (res.skipPayment) {
                alert(res.message || 'Plan upgraded successfully using points!');
                setPaymentIntent(null);
                setCurrentPlan(plan);
                window.location.reload();
                return;
            }

            const order = res.data;
            if (!order || !order.id) {
                throw new Error('Failed to create payment order. Please try again.');
            }

            // Fetch Razorpay key from backend
            const configRes = await api.get('/subscription/payment/config');
            const razorpayKey = configRes.key;
            if (!razorpayKey) {
                throw new Error('Payment gateway configuration error.');
            }

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: 'Global Collab',
                description: `Upgrade to ${plan.toUpperCase()} Plan`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post('/subscription/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan
                        });
                        if (verifyRes.success) {
                            alert('Payment successful! Your plan has been upgraded.');
                            setPaymentIntent(null);
                            setCurrentPlan(plan);
                            window.location.reload();
                        }
                    } catch (e) {
                        console.error('Payment verification error:', e);
                        alert('Payment verification failed. If money was deducted, it will be refunded automatically.');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setUpgrading(false);
                    }
                },
                theme: { color: '#6366f1' }
            };

            // Load Razorpay script only once
            const openCheckout = () => {
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', (response) => {
                    console.error('Payment failed:', response.error);
                    alert(`Payment failed: ${response.error.description || 'Something went wrong.'}`);
                    setUpgrading(false);
                });
                rzp.open();
            };

            if (window.Razorpay) {
                openCheckout();
            } else {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = openCheckout;
                script.onerror = () => {
                    alert('Failed to load payment gateway. Please check your network and try again.');
                    setUpgrading(false);
                };
                document.body.appendChild(script);
            }

        } catch (e) {
            console.error('Checkout error:', e);
            alert(e.message || 'Checkout failed. Please try again.');
        } finally {
            setUpgrading(false);
        }
    };

    const staticPlansMeta = {
        'free': { icon: User, period: 'forever', popular: false },
        'pro': { icon: Sparkles, period: 'per user/month', popular: true },
        'team': { icon: Building2, period: 'per team/month', popular: false }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="animate-spin" size={32} style={{ color: '#6366f1' }} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Settings & Billing</h1>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Managed your account preferences and subscription plans.
                </p>
            </div>

            {/* Plan Cards */}
            <div>
                <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Subscription Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
                    {plans.length > 0 ? plans.map((plan) => {
                        const meta = staticPlansMeta[plan.id] || staticPlansMeta['free'];
                        const Icon = meta.icon;
                        const isActive = plan.id === currentPlan;
                        const accent = PLAN_GRADIENTS[plan.id.toUpperCase()] || PLAN_GRADIENTS['FREE'];
                        
                        let featuresList = [];
                        try {
                            if (plan.features) {
                                featuresList = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                            }
                        } catch(e) {}
                        if (!Array.isArray(featuresList)) featuresList = [];

                        return (
                            <div key={plan.id}
                                className={`glass-card p-6 flex flex-col relative ${meta.popular ? 'ring-2 ring-indigo-400/50' : ''}`}>
                                {meta.popular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="btn-gradient text-xs px-3 py-1 rounded-full shadow-lg">Most Popular</span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="icon-badge h-11 w-11 rounded-2xl" style={{ background: accent, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                                        <Icon className="text-white h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm uppercase" style={{ color: 'var(--text-heading)' }}>{plan.name}</h3>
                                        <div>
                                            <span className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>₹{plan.price_inr}</span>
                                            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{meta.period}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs mb-4 pb-4" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                                    {plan.id === 'free' ? 'Perfect for getting started with personal projects.' : 
                                     plan.id === 'pro' ? 'Ideal for professional developers and freelancers.' : 
                                     'Built for agencies and development teams.'}
                                </p>

                                <ul className="space-y-2.5 mb-6 flex-1">
                                    {featuresList.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <div className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                                                 style={{ background: 'rgba(52,211,153,0.18)' }}>
                                                <Check size={10} style={{ color: '#10b981' }} />
                                            </div>
                                            <span className="text-xs" style={{ color: 'var(--text-body)' }}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleUpgradeClick(plan.id)}
                                    disabled={isActive || upgrading}
                                    className={isActive ? 'btn-glass w-full justify-center opacity-70 cursor-default' : 'btn-gradient w-full justify-center'}
                                    style={!isActive && !meta.popular ? { background: 'transparent', border: '2px solid #1f2937', color: '#1f2937', boxShadow: 'none' } : {}}
                                >
                                    {isActive ? 'Current Plan' : (plan.id === 'team' ? 'Contact Sales' : `Upgrade to ${plan.name}`)}
                                </button>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full p-8 text-center glass-card">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No alternative plans available at the moment.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Usage Card */}
            <div className="glass-card p-5">
                <div className="flex items-start gap-4">
                    <div className="icon-badge h-10 w-10 text-white rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}>
                        <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold mb-0.5" style={{ color: 'var(--text-heading)' }}>Current Usage</h3>
                        <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>
                            You are on the <strong className="uppercase">{currentPlan}</strong> plan.
                        </p>
                        
                        <div className="space-y-4">
                            {[
                                { key: 'projects', label: 'Active Projects', limitKey: 'project_limit' },
                                { key: 'ai', label: 'AI Requests', limitKey: 'ai_limit' },
                                { key: 'storage', label: 'Storage Used (MB)', limitKey: 'storage_limit' }
                            ].map(metric => {
                                const used = subscription?.usage?.[metric.key] || 0;
                                const limit = subscription?.usage?.[metric.limitKey];
                                if (limit === undefined) return null;
                                
                                const isUnlimited = limit === null;
                                const maxVal = isUnlimited ? used || 1 : limit;
                                const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
                                const isNearingLimit = !isUnlimited && percentage > 80;

                                return (
                                    <div key={metric.key}>
                                        <div className="flex justify-between text-xs mb-1 font-medium" style={{ color: 'var(--text-heading)' }}>
                                            <span>{metric.label}</span>
                                            <span>{used} / {isUnlimited ? 'Unlimited' : limit}</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full overflow-hidden border" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.8)' }}>
                                            <div className="h-2 rounded-full transition-all duration-700 relative overflow-hidden"
                                                 style={{ 
                                                     width: `${isUnlimited ? 100 : percentage}%`, 
                                                     background: isUnlimited ? 'var(--grad-primary)' : (isNearingLimit ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'var(--grad-primary)')
                                                 }} 
                                            >
                                                {!isUnlimited && <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: 'skewX(-20deg)' }}></div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentIntent && (
                <Modal title="Complete Upgrade" onClose={() => setPaymentIntent(null)}>
                    <div className="space-y-5">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">
                                Upgrade to {paymentIntent.plan.toUpperCase()}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Base Price: ₹{paymentIntent.data.basePrice}
                            </p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                <Wallet className="text-emerald-500" size={20} />
                                <h4 className="font-semibold text-slate-700">Your Points: {paymentIntent.data.userPoints}</h4>
                            </div>
                            
                            {paymentIntent.data.discountPercent > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <span className="text-emerald-700 font-medium">Eligible Discount</span>
                                        <span className="font-bold text-emerald-600">
                                            {paymentIntent.data.discountPercent}% Off 
                                            (Use {paymentIntent.data.pointsToUse} pts)
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                        <button 
                                            onClick={() => handleCheckout(true)}
                                            disabled={upgrading}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                            Redeem & Pay ₹{paymentIntent.data.finalPrice}
                                        </button>
                                        {paymentIntent.data.finalPrice > 0 && (
                                            <button 
                                                onClick={() => handleCheckout(false)}
                                                disabled={upgrading}
                                                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                                Skip & Pay ₹{paymentIntent.data.basePrice}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500 bg-white p-3 rounded-lg border">
                                        Earn more reputation points to unlock subscription discounts! 
                                        (Next tier: 10% off at 500 points).
                                    </p>
                                    <button 
                                        onClick={() => handleCheckout(false)}
                                        disabled={upgrading}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                                        Pay ₹{paymentIntent.data.basePrice}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
