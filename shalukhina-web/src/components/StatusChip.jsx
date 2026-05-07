import React from 'react';
import { Chip } from '@mui/material';

const statusMap = {
  DRAFT: { label: 'Черновик', color: 'default' },
  SUBMITTED: { label: 'Новая', color: 'warning' },
  APPROVED: { label: 'Согласована', color: 'info' },
  PURCHASE_WAIT: { label: 'На закупке', color: 'secondary' },
  REJECTED: { label: 'Отклонена', color: 'error' },
  ISSUED: { label: 'Выдана', color: 'success' },
  CANCELLED: { label: 'Отменена', color: 'default' },
  EMPLOYEE: { label: 'Сотрудник школы', color: 'primary' },
  RESPONSIBLE: { label: 'Ответственный', color: 'secondary' },
  ADMIN: { label: 'Администратор', color: 'info' },
  LOW: { label: 'Низкий', color: 'default' },
  NORMAL: { label: 'Нормальный', color: 'primary' },
  HIGH: { label: 'Высокий', color: 'warning' },
  URGENT: { label: 'Срочный', color: 'error' },
  ORDERED: { label: 'Заказана', color: 'info' },
  IN_TRANSIT: { label: 'В пути', color: 'secondary' },
  COMPLETED: { label: 'Завершена', color: 'success' },
  RECEIPT: { label: 'Поступление', color: 'success' },
  ISSUE: { label: 'Выдача', color: 'warning' },
  ADJUSTMENT: { label: 'Корректировка', color: 'info' },
};

export function StatusChip({ value }) {
  const meta = statusMap[value] || { label: value, color: 'default' };
  return <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />;
}
