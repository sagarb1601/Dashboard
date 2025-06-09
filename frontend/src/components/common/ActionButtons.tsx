import React from 'react';
import { Button, Tooltip, Popconfirm, Space } from 'antd';

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteTooltip?: string;
  deleteConfirmTitle?: string | React.ReactNode;
  recordName?: string;
  hideDelete?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  deleteDisabled,
  deleteTooltip,
  deleteConfirmTitle,
  recordName,
  hideDelete = false
}) => {
  const defaultDeleteTitle = (
    <div>
      <div>Delete {recordName || 'Record'}?</div>
      <div style={{ color: '#666666', fontSize: '13px', marginTop: 8 }}>
        This action cannot be undone.
      </div>
    </div>
  );

  return (
    <Space size="small">
      <Button
        type="link"
        onClick={onEdit}
        style={{ padding: '4px 8px' }}
      >
        Edit
      </Button>
      
      {!hideDelete && (
        deleteDisabled ? (
          <Tooltip title={deleteTooltip || "This record cannot be deleted"}>
            <Button
              type="link"
              danger
              disabled
              style={{ padding: '4px 8px' }}
            >
              Delete
            </Button>
          </Tooltip>
        ) : (
          <Popconfirm
            title={deleteConfirmTitle || defaultDeleteTitle}
            onConfirm={onDelete}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              style={{ padding: '4px 8px' }}
            >
              Delete
            </Button>
          </Popconfirm>
        )
      )}
    </Space>
  );
};

export default ActionButtons; 