import React from 'react';
import { Card, Form, Input, Button, Row, Col, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Profile: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIcon = React.createElement(UserOutlined);

  const onFinish = (values: any) => {
    console.log('Success:', values);
    // Implement profile update logic here
  };

  return (
    <>
      <Title level={2}>Profile</Title>
      
      <Row gutter={24}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar size={100} icon={userIcon} />
              <Title level={4} style={{ marginTop: 16 }}>{user.username}</Title>
              <p>{user.role}</p>
            </div>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card title="Profile Information">
            <Form
              name="profile"
              initialValues={{ 
                username: user.username,
                email: user.email,
                role: user.role
              }}
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                label="Username"
                name="username"
              >
                <Input disabled />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Role"
                name="role"
              >
                <Input disabled />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Profile; 