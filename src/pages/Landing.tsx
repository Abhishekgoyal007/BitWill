import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import {
    Shield,
    Clock,
    Users,
    Lock,
    ArrowRight,
    Zap,
    Heart,
    Github,
    Twitter
} from 'lucide-react';
import './Landing.css';

const Landing: React.FC = () => {
    const { wallet, connectWallet, isLoading } = useWallet();
    const navigate = useNavigate();

    const handleGetStarted = async () => {
        if (wallet.isConnected) {
            navigate('/dashboard');
        } else {
            await connectWallet();
            navigate('/dashboard');
        }
    };

    const features = [
        {
            icon: Lock,
            title: 'Secure Vaults',
            description: 'Lock your Bitcoin in programmable vaults with customizable inheritance rules.',
        },
        {
            icon: Clock,
            title: 'Time-Based Triggers',
            description: 'Set inactivity periods that automatically transfer funds to beneficiaries.',
        },
        {
            icon: Users,
            title: 'Multiple Beneficiaries',
            description: 'Split your inheritance between family members with custom percentages.',
        },
        {
            icon: Zap,
            title: 'Instant Claims',
            description: 'Beneficiaries can claim their share instantly when conditions are met.',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Create a Vault',
            description: 'Lock your Bitcoin and set up inheritance rules in minutes.',
        },
        {
            number: '02',
            title: 'Add Beneficiaries',
            description: 'Designate family members or friends who will receive your Bitcoin.',
        },
        {
            number: '03',
            title: 'Stay Active',
            description: "Periodically check in to prove you're still around.",
        },
        {
            number: '04',
            title: 'Automatic Transfer',
            description: 'If you stop checking in, funds transfer automatically.',
        },
    ];

    const stats = [
        { value: '$140B+', label: 'Crypto Lost Forever' },
        { value: '4M+', label: 'Dormant Wallets' },
        { value: '23%', label: 'Holders Without Plan' },
    ];

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-gradient" />
                    <div className="hero-grid" />
                </div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Shield size={14} />
                            <span>Built on Bitcoin with Charms Protocol</span>
                        </div>
                        <h1 className="hero-title">
                            Protect Your Bitcoin
                            <span className="text-gradient"> Legacy</span>
                        </h1>
                        <p className="hero-description">
                            BitWill is a decentralized inheritance protocol that ensures your Bitcoin
                            reaches your loved ones—even if you can't give them the keys yourself.
                        </p>
                        <div className="hero-actions">
                            <button
                                className="btn btn-gold btn-lg"
                                onClick={handleGetStarted}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="loading-spinner" />
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                            <a href="#how-it-works" className="btn btn-secondary btn-lg">
                                Learn More
                            </a>
                        </div>
                        <div className="hero-stats">
                            {stats.map((stat, index) => (
                                <div key={index} className="hero-stat">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="vault-illustration">
                            <div className="vault-ring vault-ring-1" />
                            <div className="vault-ring vault-ring-2" />
                            <div className="vault-ring vault-ring-3" />
                            <div className="vault-center">
                                <Shield size={48} />
                            </div>
                            <div className="vault-particle vault-particle-1" />
                            <div className="vault-particle vault-particle-2" />
                            <div className="vault-particle vault-particle-3" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="problem-section">
                <div className="container">
                    <div className="problem-grid">
                        <div className="problem-content">
                            <h2 className="section-title">
                                The Problem with
                                <span className="text-gradient"> Crypto Inheritance</span>
                            </h2>
                            <p className="section-description">
                                Every year, billions in cryptocurrency become permanently inaccessible.
                                Private keys are lost, owners pass away unexpectedly, and families are
                                left with no way to access their loved one's digital assets.
                            </p>
                            <ul className="problem-list">
                                <li>
                                    <Heart size={20} className="list-icon" />
                                    <span>No sharing private keys with family</span>
                                </li>
                                <li>
                                    <Lock size={20} className="list-icon" />
                                    <span>No trusting centralized services</span>
                                </li>
                                <li>
                                    <Shield size={20} className="list-icon" />
                                    <span>No compromising on security</span>
                                </li>
                            </ul>
                        </div>
                        <div className="problem-visual">
                            <div className="stat-card stat-card-large">
                                <span className="stat-card-value">$140B+</span>
                                <span className="stat-card-label">Lost Bitcoin</span>
                                <div className="stat-card-glow" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">
                            Why Choose
                            <span className="text-gradient"> BitWill</span>
                        </h2>
                        <p className="section-subtitle">
                            A trustless, programmable solution for Bitcoin inheritance
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">
                            How It
                            <span className="text-gradient"> Works</span>
                        </h2>
                        <p className="section-subtitle">
                            Simple, secure, and fully automated
                        </p>
                    </div>
                    <div className="steps-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card">
                                <div className="step-number">{step.number}</div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                                {index < steps.length - 1 && (
                                    <div className="step-connector">
                                        <ArrowRight size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2 className="cta-title">Ready to Protect Your Legacy?</h2>
                            <p className="cta-description">
                                Create your first vault in less than 5 minutes. No private keys shared,
                                no trusted parties needed.
                            </p>
                            <button
                                className="btn btn-gold btn-lg"
                                onClick={handleGetStarted}
                            >
                                Create Your First Vault
                                <ArrowRight size={20} />
                            </button>
                        </div>
                        <div className="cta-visual">
                            <div className="cta-shield">
                                <Shield size={80} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <Shield size={24} />
                                <span>BitWill</span>
                            </div>
                            <p className="footer-tagline">
                                Secure Bitcoin inheritance for everyone.
                            </p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4 className="footer-column-title">Product</h4>
                                <Link to="/dashboard">Dashboard</Link>
                                <Link to="/create">Create Vault</Link>
                                <Link to="/claim">Claim Funds</Link>
                            </div>
                            <div className="footer-column">
                                <h4 className="footer-column-title">Resources</h4>
                                <a href="https://docs.charms.dev" target="_blank" rel="noopener noreferrer">
                                    Charms Docs
                                </a>
                                <a href="#how-it-works">How It Works</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p className="footer-copyright">
                            © 2025 BitWill. Built for the BOS Hackathon.
                        </p>
                        <div className="footer-social">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                <Github size={20} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
