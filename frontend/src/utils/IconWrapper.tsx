import React from 'react';
import type { AntdIconProps } from '@ant-design/icons/es/components/AntdIcon';

// Use a type assertion to handle the icon component
export const IconWrapper = (Icon: any) => {
  return function WrappedIcon(props: Partial<AntdIconProps>) {
    return <Icon {...props} />;
  };
}; 