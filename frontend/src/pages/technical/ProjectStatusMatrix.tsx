import React from 'react';
import { Table, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';

interface ProjectInfo {
  project_id: number;
  project_name: string;
  pi_name: string;
  funding_agency: string;
  centre: string;
  start_date: string;
  end_date: string;
}

interface StatusCell {
  status: 'GREEN' | 'YELLOW' | 'RED' | null;
  remarks: string | null;
  last_updated_on: string | null;
}

interface ProjectMatrixRow extends ProjectInfo {
  statuses: { [month: string]: StatusCell | null };
}

interface Props {
  months: string[]; // e.g. ['2024-01', '2024-02', ...]
  data: ProjectMatrixRow[];
}

const statusColor = (status: string | null) => {
  if (status === 'GREEN') return 'green';
  if (status === 'YELLOW') return 'orange';
  if (status === 'RED') return 'red';
  return 'default';
};

const ProjectStatusMatrix: React.FC<Props> = ({ months, data }) => {
  const columns = [
    {
      title: '#',
      key: 'serial',
      width: 40,
      align: 'center' as const,
      render: (_: any, __: ProjectMatrixRow, index: number) => index + 1
    },
    {
      title: 'Project',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 250,
      render: (text: string) => <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontWeight: 500 }}>{text}</div>
    },
    {
      title: 'Contact person',
      dataIndex: 'pi_name',
      key: 'pi_name',
      width: 140
    },
    {
      title: 'Sponsor',
      dataIndex: 'funding_agency',
      key: 'funding_agency',
      width: 120
    },
    {
      title: 'Centre',
      dataIndex: 'centre',
      key: 'centre',
      width: 80
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 100,
      align: 'center' as const,
      render: (date: string) => date ? dayjs(date).format('DD-MM-YYYY') : ''
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 100,
      align: 'center' as const,
      render: (date: string) => date ? dayjs(date).format('DD-MM-YYYY') : ''
    },
    ...months.map(month => ({
      title: dayjs(month + '-01').format('MMM YYYY'),
      key: month,
      width: 120,
      align: 'center' as const,
      render: (_: any, record: ProjectMatrixRow) => {
        const cell = record.statuses[month];
        if (!cell || !cell.status) return <Tag color="default">-</Tag>;
        return (
          <Tooltip
            title={
              <div>
                <div><b>Status:</b> <Tag color={statusColor(cell.status)}>{cell.status}</Tag></div>
                {cell.remarks && <div><b>Remarks:</b> {cell.remarks}</div>}
                {cell.last_updated_on && <div><b>Updated:</b> {dayjs(cell.last_updated_on).format('DD-MM-YYYY HH:mm')}</div>}
              </div>
            }
          >
            <Tag color={statusColor(cell.status)} style={{ minWidth: 60, textAlign: 'center' }}>{cell.status}</Tag>
          </Tooltip>
        );
      }
    }))
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="project_id"
      pagination={false}
      scroll={{ x: 1200 + months.length * 120 }}
      bordered
    />
  );
};

export default ProjectStatusMatrix; 