import React from 'react';
import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { StatusChip } from './StatusChip';
import { RequestChatPanel } from './RequestChatPanel';

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function RequestDetailsPage({
  request,
  currentUser,
  onBack,
  onEdit,
  onChangeStatus,
  statusChangingRequestId,
}) {
  if (!request) {
    return null;
  }

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'RESPONSIBLE';
  const isStatusChanging = statusChangingRequestId === request.id;

  const changeStatus = (status) => {
    if (onChangeStatus) {
      onChangeStatus(request.id, status);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 1180, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="h4">Заявка {request.requestNumber}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Просмотр деталей и переписка по заявке.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
            Назад
          </Button>
          {onEdit ? (
            <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
              Редактировать
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Stack spacing={2.5}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip value={request.status} />
              <StatusChip value={request.priority} />
            </Stack>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Заявитель
              </Typography>
              <Typography fontWeight={700}>{request.requester?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {request.department?.name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Комментарий
              </Typography>
              <Typography sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>
                {request.comment || 'Комментарий не указан'}
              </Typography>
            </Box>
            {request.rejectionReason ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Причина отклонения
                </Typography>
                <Typography sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>
                  {request.rejectionReason}
                </Typography>
              </Box>
          ) : null}
        </Stack>
      </Paper>

      {canManage ? (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="h6">Изменить статус</Typography>
              <Typography variant="body2" color="text.secondary">
                Можно быстро перевести заявку в нужный статус прямо со страницы заявки.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => changeStatus('SUBMITTED')} disabled={isStatusChanging}>
                Новая
              </Button>
              <Button variant="outlined" onClick={() => changeStatus('APPROVED')} disabled={isStatusChanging}>
                Согласовать
              </Button>
              <Button variant="outlined" color="error" onClick={() => changeStatus('REJECTED')} disabled={isStatusChanging}>
                Отклонить
              </Button>
              <Button variant="contained" onClick={() => changeStatus('ISSUED')} disabled={isStatusChanging}>
                Выдать
              </Button>
              {isStatusChanging ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Обновляем статус...
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Состав заявки
          </Typography>
          <Stack spacing={1.25}>
            {request.items.map((line) => (
              <Paper key={line.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                <Stack spacing={0.5}>
                  <Typography fontWeight={700}>{line.item?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {line.quantityRequested} {line.item?.unit} · выдано {line.quantityIssued}
                  </Typography>
                  {line.note ? (
                    <Typography variant="body2" color="text.secondary">
                      {line.note}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            История изменений статуса
          </Typography>
          <Stack spacing={1.25}>
            {(request.statusHistory || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((entry) => (
              <Paper key={entry.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                    <StatusChip value={entry.status} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(entry.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography fontWeight={700}>{entry.actor?.fullName || 'Система'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.note || 'Статус изменен'}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {!request.statusHistory?.length ? (
              <Typography variant="body2" color="text.secondary">
                История статусов пока пустая.
              </Typography>
            ) : null}
          </Stack>
        </Paper>

        <RequestChatPanel request={request} currentUser={currentUser} />
      </Stack>
    </Stack>
  );
}
