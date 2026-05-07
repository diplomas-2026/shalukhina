import React, { useMemo } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
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

  const stockLines = useMemo(
    () =>
      request.items.map((line) => {
        const available = Number(line.item?.currentQuantity || 0);
        const requested = Number(line.quantityRequested || 0);
        const shortage = Math.max(requested - available, 0);
        return {
          ...line,
          available,
          requested,
          shortage,
        };
      }),
    [request.items],
  );

  const hasShortage = stockLines.some((line) => line.shortage > 0);

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
            Просмотр деталей, складской проверки и переписки по заявке.
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
              <Typography variant="h6">Складской сценарий</Typography>
              <Typography variant="body2" color="text.secondary">
                Если на складе хватает товара, можно выдать сразу. Если нет, отправьте заявку на закупку и вернитесь к ней позже.
              </Typography>
            </Box>

            <Stack spacing={1.25}>
              {stockLines.map((line) => (
                <Paper key={line.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                      <Box>
                        <Typography fontWeight={700}>{line.item?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Нужно: {line.requested} {line.item?.unit}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        color={line.shortage > 0 ? 'warning' : 'success'}
                        label={line.shortage > 0 ? `Не хватает ${line.shortage} ${line.item?.unit}` : 'На складе хватает'}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      На складе: {line.available} {line.item?.unit} · Выдано: {line.quantityIssued}
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

            {hasShortage ? (
              <Alert severity="warning">
                По заявке есть дефицит на складе. Сначала отправьте ее на закупку, а после поступления товара вернитесь к выдаче.
              </Alert>
            ) : (
              <Alert severity="success">
                По заявке хватает товара на складе. Можно выдавать сразу.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => changeStatus('APPROVED')} disabled={isStatusChanging}>
                Принять в работу
              </Button>
              <Button variant="outlined" onClick={() => changeStatus('PURCHASE_WAIT')} disabled={isStatusChanging}>
                Отправить на закупку
              </Button>
              <Button variant="outlined" color="error" onClick={() => changeStatus('REJECTED')} disabled={isStatusChanging}>
                Отклонить
              </Button>
              <Button variant="contained" onClick={() => changeStatus('ISSUED')} disabled={isStatusChanging || hasShortage}>
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
          {(request.statusHistory || [])
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((entry) => (
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
  );
}
