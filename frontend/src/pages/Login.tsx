import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from '@emotion/styled';

interface FormValues {
  username: string;
  password: string;
}

// Modern, soft, abstract background
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(120deg, #1976d2 0%, #63a4ff 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -120px;
    left: -120px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #b2f0e6 0%, #63a4ff 80%);
    opacity: 0.25;
    z-index: 1;
    filter: blur(20px);
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -100px;
    right: -100px;
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, #d1c4e9 0%, #1976d2 80%);
    opacity: 0.18;
    z-index: 1;
    filter: blur(20px);
  }
`;

const LoginCard = styled(Card)`
  width: 420px;
  padding: 36px 32px 32px 32px;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(80, 80, 120, 0.10);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  z-index: 2;
  border: none;

  .ant-card-body {
    padding: 0;
  }
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 28px;

  img {
    height: 70px;
    margin-bottom: 10px;
    filter: drop-shadow(0 2px 8px rgba(44, 62, 80, 0.08));
  }

  h1 {
    color: #2d3748;
    font-size: 22px;
    margin: 0;
    font-weight: 700;
    letter-spacing: 1px;
  }

  p {
    color: #6b7280;
    margin: 8px 0 0;
    font-size: 15px;
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 22px;
  }

  .ant-input-affix-wrapper {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    transition: all 0.3s;
    background: #f8fafc;

    &:hover, &:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.08);
    }
  }

  .ant-btn {
    height: 48px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
    color: #222;
    border: none;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(56, 249, 215, 0.08);

    &:hover {
      background: linear-gradient(90deg, #7c3aed 0%, #38f9d7 100%);
      color: #fff;
      transform: translateY(-1px) scale(1.01);
    }
  }
`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const userIcon = React.createElement(UserOutlined);
  const lockIcon = React.createElement(LockOutlined);
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    const loginData = values as FormValues;
    handleLogin(loginData);
  };

  const handleLogin = async (values: FormValues) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', values);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      message.success('Login successful!');
      navigate('/');
    } catch (error) {
      message.error('Invalid username or password');
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <img src="/assets/cdac-logo.png" alt="CDAC Logo" />
          <h1>EDO Dashboard</h1>
          <p>Sign in to access your account</p>
        </LogoContainer>
        <StyledForm
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input 
              prefix={userIcon}
              placeholder="Username" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={lockIcon}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Sign In
            </Button>
          </Form.Item>
        </StyledForm>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login; 