import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AnimatedText from '../components/AnimatedText';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { signup } from '../api/auth';

const SignupPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must include an uppercase letter';
    }
    if (!/[!@#$%^&*()-_=+]/.test(password)) {
      return 'Password must include a special character';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await signup(formData);
      
      alert('Signup successful! Please verify your email.');
      navigate('/confirm', { state: { email: formData.email } });
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatedText delay={100}>
        <h1 className="auth-title">Create your account</h1>
      </AnimatedText>

      <AnimatedText delay={200}>
        <p className="auth-subtitle">Let's get started with your journey</p>
      </AnimatedText>

      <div className="auth-form">
        <AnimatedText delay={300}>
          <label className="input-label">Name*</label>
          <InputField
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
        </AnimatedText>

        <AnimatedText delay={400}>
          <label className="input-label">Email*</label>
          <InputField
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
        </AnimatedText>

        <AnimatedText delay={500}>
          <label className="input-label">Password*</label>
          <InputField
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
          <p className="password-hint">
            Password must be at least 8 characters with uppercase and special character
          </p>
        </AnimatedText>

        {error && <div className="error-message">{error}</div>}

        <AnimatedText delay={600}>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </AnimatedText>

        <AnimatedText delay={700}>
          <p className="auth-link">
            Already have an account?{' '}
            <Link to="/login" style={{ cursor: 'pointer' }}>
              Log in
            </Link>
          </p>
        </AnimatedText>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
