import React from 'react';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';

// This wrapper ensures all required props are provided to Ant Design icons
export const IconWrapper = (Icon: React.ComponentType<any>) => {
  return React.forwardRef<HTMLSpanElement, Partial<AntdIconProps>>((props, ref) => {
    const iconProps = {
      onPointerMoveCapture: () => {},
      onPointerOutCapture: () => {},
      ...props
    };
    return <Icon {...iconProps} ref={ref} />;
  });
}; 