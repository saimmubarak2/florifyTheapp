import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AnimatedText from '../components/AnimatedText';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { confirm, resend } from '../api/auth';

const EmailConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirm(email, code);
      alert('Email confirmed successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      await resend(email);
      alert('Confirmation code resent!');
    } catch (err) {
      setError(err.message || 'Resend failed');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatedText delay={100}>
        <h1 className="auth-title">Verify your email</h1>
      </AnimatedText>

      <AnimatedText delay={200}>
        <p className="auth-subtitle">
          We've sent a confirmation code to {email || 'your email'}
        </p>
      </AnimatedText>

      <div className="auth-form">
        <AnimatedText delay={300}>
          <label className="input-label">Confirmation Code*</label>
          <InputField
            type="text"
            name="code"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
          />
        </AnimatedText>

        {error && <div className="error-message">{error}</div>}

        <AnimatedText delay={400}>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Verifying...' : 'Confirm Email'}
          </Button>
        </AnimatedText>

        <AnimatedText delay={500}>
          <p className="auth-link">
            Didn't receive the code?{' '}
            <a
              onClick={!resending ? handleResend : undefined}
              className={resending ? 'disabled' : ''}
              style={{ cursor: resending ? 'not-allowed' : 'pointer' }}
            >
              {resending ? 'Resending...' : 'Resend code'}
            </a>
          </p>
        </AnimatedText>

        <AnimatedText delay={600}>
          <p className="auth-link">
            <Link to="/login" style={{ cursor: 'pointer' }}>
              Back to login
            </Link>
          </p>
        </AnimatedText>
      </div>
    </AuthLayout>
  );
};

export default EmailConfirmationPage;
