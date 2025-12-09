import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AnimatedText from '../components/AnimatedText';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { login } from '../api/auth';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      
      // Store token and user info
      localStorage.setItem('token', response.token);
      localStorage.setItem('userEmail', formData.email);
      
      alert('✅ Login successful!');
      onLogin(formData.email);
      navigate('/');

    } catch (err) {
      console.error('Network error:', err);
      setError(err.message || 'Unable to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatedText delay={100}>
        <h1 className="auth-title">Welcome Back</h1>
      </AnimatedText>

      <AnimatedText delay={200}>
        <p className="auth-subtitle">Please login to your account</p>
      </AnimatedText>

      <div className="auth-form">
        <AnimatedText delay={300}>
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

        <AnimatedText delay={400}>
          <label className="input-label">Password*</label>
          <InputField
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
        </AnimatedText>

        {error && <div className="error-message">{error}</div>}

        <AnimatedText delay={500}>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </AnimatedText>

        <AnimatedText delay={600}>
          <p className="auth-link">
            Don't have an account?{' '}
            <Link to="/signup" style={{ cursor: 'pointer' }}>
              Sign up
            </Link>
          </p>
        </AnimatedText>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
