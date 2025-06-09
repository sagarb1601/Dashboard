import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { ConfigProvider } from 'antd';

// Configure Ant Design to use Day.js
ConfigProvider.config({
  theme: {
    // Your theme configuration if any
  },
});

// Export the Day.js type for use in components
export type { Dayjs };
export { dayjs }; 