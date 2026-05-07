import React from 'react';
import { Chip } from '@mui/material';

const statusMap = {
  DRAFT: { label: 'Черновик', color: 'default' },
  SUBMITTED: { label: 'Новая', color: 'warning' },
  APPROVED: { label: 'Согласована', color: 'info' },
  REJECTED: { label: 'Отклонена', color: 'error' },
  ISSUED: { label: 'Выдана', color: 'success' },
  CANCELLED: { label: 'Отменена', color: 'default' },
  EMPLOYEE: { label: 'Сотрудник', color: 'primary' },
  RESPONSIBLE: { label: 'Ответственный', color: 'secondary' },
  ADMIN: { label: 'Администратор', color: 'info' },
  LOW: { label: 'Низкий', color: 'default' },
  NORMAL: { label: 'Нормальный', color: 'primary' },
  HIGH: { label: 'Высокий', color: 'warning' },
  URGENT: { label: 'Срочный', color: 'error' },
  RECEIPT: { label: 'Поступление', color: 'success' },
  ISSUE: { label: 'Выдача', color: 'warning' },
  ADJUSTMENT: { label: 'Корректировка', color: 'info' },
};

export function StatusChip({ value }) {
  const meta = statusMap[value] || { label: value, color: 'default' };
  return <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />;
}
