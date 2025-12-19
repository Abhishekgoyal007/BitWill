import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import type { Beneficiary } from '../types';
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    Trash2,
    Check,
    Shield,
    Users,
    Clock,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import './CreateVault.css';

const INACTIVITY_OPTIONS = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '180 Days' },
    { value: 365, label: '1 Year' },
];

const CreateVault: React.FC = () => {
    const { wallet, createVault, isLoading } = useWallet();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [vaultName, setVaultName] = useState('');
    const [amount, setAmount] = useState('');
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
        { id: '1', name: '', address: '', percentage: 100 },
    ]);
    const [inactivityPeriod, setInactivityPeriod] = useState(90);
    const [error, setError] = useState('');

    const totalSteps = 4;

    // Generate unique ID
    const generateId = () => Math.random().toString(36).substring(2, 15);

    // Calculate total percentage
    const totalPercentage = beneficiaries.reduce((sum, b) => sum + (b.percentage || 0), 0);

    // Validation for each step
    const validateStep = (stepNum: number): boolean => {
        setError('');

        switch (stepNum) {
            case 1:
                if (!vaultName.trim()) {
                    setError('Please enter a vault name');
                    return false;
                }
                if (!amount || parseFloat(amount) <= 0) {
                    setError('Please enter a valid amount');
                    return false;
                }
                if (parseFloat(amount) > wallet.balance) {
                    setError('Insufficient balance');
                    return false;
                }
                return true;

            case 2:
                if (beneficiaries.some(b => !b.name.trim())) {
                    setError('All beneficiaries must have a name');
                    return false;
                }
                if (beneficiaries.some(b => !b.address.trim())) {
                    setError('All beneficiaries must have an address');
                    return false;
                }
                if (totalPercentage !== 100) {
                    setError('Total percentage must equal 100%');
                    return false;
                }
                return true;

            case 3:
                return true;

            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const handleAddBeneficiary = () => {
        setBeneficiaries([
            ...beneficiaries,
            { id: generateId(), name: '', address: '', percentage: 0 },
        ]);
    };

    const handleRemoveBeneficiary = (id: string) => {
        if (beneficiaries.length > 1) {
            setBeneficiaries(beneficiaries.filter(b => b.id !== id));
        }
    };

    const handleBeneficiaryChange = (
        id: string,
        field: keyof Beneficiary,
        value: string | number
    ) => {
        setBeneficiaries(
            beneficiaries.map(b =>
                b.id === id ? { ...b, [field]: value } : b
            )
        );
    };

    const handleSubmit = async () => {
        if (!validateStep(step)) return;

        try {
            await createVault(
                vaultName,
                parseFloat(amount),
                beneficiaries,
                inactivityPeriod
            );
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create vault. Please try again.');
        }
    };

    if (!wallet.isConnected) {
        navigate('/');
        return null;
    }

    return (
        <div className="create-vault-page">
            <div className="container container-sm">
                {/* Progress Bar */}
                <div className="progress-indicator">
                    {[1, 2, 3, 4].map((stepNum) => (
                        <div
                            key={stepNum}
                            className={`progress-step ${step >= stepNum ? 'active' : ''} ${step > stepNum ? 'completed' : ''
                                }`}
                        >
                            <div className="step-circle">
                                {step > stepNum ? <Check size={16} /> : stepNum}
                            </div>
                            <span className="step-label">
                                {stepNum === 1 && 'Details'}
                                {stepNum === 2 && 'Heirs'}
                                {stepNum === 3 && 'Trigger'}
                                {stepNum === 4 && 'Review'}
                            </span>
                        </div>
                    ))}
                    <div className="progress-line">
                        <div
                            className="progress-fill"
                            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="step-content">
                    {/* Step 1: Vault Details */}
                    {step === 1 && (
                        <div className="step-card animate-fade-in">
                            <div className="step-header">
                                <div className="step-icon">
                                    <Shield size={28} />
                                </div>
                                <h2>Create Your Vault</h2>
                                <p>Set up your inheritance vault details</p>
                            </div>

                            <div className="form-group">
                                <label className="label">Vault Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Family Inheritance"
                                    value={vaultName}
                                    onChange={(e) => setVaultName(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Amount to Lock (BTC)</label>
                                <div className="input-with-suffix">
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="0.00"
                                        step="0.0001"
                                        min="0"
                                        max={wallet.balance}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                    <span className="input-suffix">BTC</span>
                                </div>
                                <span className="input-hint">
                                    Available: {wallet.balance.toFixed(4)} BTC
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Beneficiaries */}
                    {step === 2 && (
                        <div className="step-card animate-fade-in">
                            <div className="step-header">
                                <div className="step-icon">
                                    <Users size={28} />
                                </div>
                                <h2>Add Beneficiaries</h2>
                                <p>Designate who will receive your Bitcoin</p>
                            </div>

                            <div className="beneficiaries-list">
                                {beneficiaries.map((beneficiary, index) => (
                                    <div key={beneficiary.id} className="beneficiary-form">
                                        <div className="beneficiary-header">
                                            <span className="beneficiary-number">
                                                Beneficiary #{index + 1}
                                            </span>
                                            {beneficiaries.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm remove-btn"
                                                    onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="beneficiary-fields">
                                            <div className="form-group">
                                                <label className="label">Name</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g., John Doe"
                                                    value={beneficiary.name}
                                                    onChange={(e) =>
                                                        handleBeneficiaryChange(beneficiary.id, 'name', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="label">Wallet Address</label>
                                                <input
                                                    type="text"
                                                    className="input input-mono"
                                                    placeholder="bc1q..."
                                                    value={beneficiary.address}
                                                    onChange={(e) =>
                                                        handleBeneficiaryChange(beneficiary.id, 'address', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="form-group percentage-group">
                                                <label className="label">Share (%)</label>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    placeholder="0"
                                                    min="0"
                                                    max="100"
                                                    value={beneficiary.percentage || ''}
                                                    onChange={(e) =>
                                                        handleBeneficiaryChange(
                                                            beneficiary.id,
                                                            'percentage',
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="btn btn-secondary add-beneficiary-btn"
                                onClick={handleAddBeneficiary}
                            >
                                <Plus size={18} />
                                Add Another Beneficiary
                            </button>

                            <div className={`percentage-total ${totalPercentage !== 100 ? 'error' : 'valid'}`}>
                                Total: {totalPercentage}%
                                {totalPercentage !== 100 && (
                                    <span className="percentage-hint">Must equal 100%</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Inactivity Period */}
                    {step === 3 && (
                        <div className="step-card animate-fade-in">
                            <div className="step-header">
                                <div className="step-icon">
                                    <Clock size={28} />
                                </div>
                                <h2>Set Trigger Period</h2>
                                <p>Choose how long before automatic transfer</p>
                            </div>

                            <div className="inactivity-options">
                                {INACTIVITY_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`inactivity-option ${inactivityPeriod === option.value ? 'selected' : ''
                                            }`}
                                        onClick={() => setInactivityPeriod(option.value)}
                                    >
                                        <span className="option-value">{option.label}</span>
                                        <span className="option-description">
                                            Transfer if no check-in for {option.label.toLowerCase()}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="inactivity-info">
                                <AlertCircle size={18} />
                                <p>
                                    You'll need to check in at least once every{' '}
                                    <strong>{inactivityPeriod} days</strong> to prevent automatic
                                    transfer to your beneficiaries.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="step-card animate-fade-in">
                            <div className="step-header">
                                <div className="step-icon success">
                                    <Check size={28} />
                                </div>
                                <h2>Review & Confirm</h2>
                                <p>Double-check your vault settings</p>
                            </div>

                            <div className="review-section">
                                <h3 className="review-title">Vault Details</h3>
                                <div className="review-item">
                                    <span className="review-label">Name</span>
                                    <span className="review-value">{vaultName}</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Amount</span>
                                    <span className="review-value gold">{amount} BTC</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Inactivity Period</span>
                                    <span className="review-value">{inactivityPeriod} Days</span>
                                </div>
                            </div>

                            <div className="review-section">
                                <h3 className="review-title">Beneficiaries</h3>
                                {beneficiaries.map((ben) => (
                                    <div key={ben.id} className="review-beneficiary">
                                        <div className="review-ben-name">{ben.name}</div>
                                        <div className="review-ben-address">{ben.address}</div>
                                        <div className="review-ben-share">{ben.percentage}%</div>
                                    </div>
                                ))}
                            </div>

                            <div className="review-warning">
                                <AlertCircle size={18} />
                                <p>
                                    By creating this vault, you are locking <strong>{amount} BTC</strong>.
                                    You can cancel and withdraw at any time before the trigger activates.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="step-actions">
                        {step > 1 && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleBack}
                                disabled={isLoading}
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}

                        {step < totalSteps ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                            >
                                Next
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-gold"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Creating Vault...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={18} />
                                        Create Vault
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateVault;
