import React from 'react';
import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { StatusChip } from './StatusChip';
import { RequestChatPanel } from './RequestChatPanel';

export function RequestDetailsPage({ request, currentUser, onBack, onEdit }) {
  if (!request) {
    return null;
  }

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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="stretch">
        <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
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
            <Divider />
            <Box>
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
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ width: { xs: '100%', md: 500 }, minWidth: { md: 500 } }}>
          <RequestChatPanel request={request} currentUser={currentUser} />
        </Box>
      </Stack>
    </Stack>
  );
}
