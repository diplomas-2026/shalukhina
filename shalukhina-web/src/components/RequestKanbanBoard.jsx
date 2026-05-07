import React, { useMemo, useState } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { StatusChip } from './StatusChip';

const columns = [
  { status: 'SUBMITTED', title: 'Новые' },
  { status: 'APPROVED', title: 'Согласованные' },
  { status: 'REJECTED', title: 'Отклоненные' },
  { status: 'ISSUED', title: 'Выданные' },
];

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function RequestKanbanBoard({ requests, onMoveRequest, onOpenRequest, allowedTargets }) {
  const [draggedRequest, setDraggedRequest] = useState(null);
  const [overStatus, setOverStatus] = useState(null);

  const grouped = useMemo(() => {
    const result = Object.fromEntries(columns.map((column) => [column.status, []]));
    requests.forEach((request) => {
      if (result[request.status]) {
        result[request.status].push(request);
      }
    });
    columns.forEach((column) => {
      result[column.status].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return result;
  }, [requests]);

  const handleDragStart = (requestId) => {
    setDraggedRequest(requests.find((request) => request.id === requestId) || null);
  };

  const handleDragEnd = () => {
    setDraggedRequest(null);
    setOverStatus(null);
  };

  const handleDrop = async (status) => {
    if (!draggedRequest || draggedRequest.status === status) {
      handleDragEnd();
      return;
    }
    await onMoveRequest(draggedRequest.id, status);
    handleDragEnd();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: 1,
        pr: 1,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {columns.map((column) => {
        const canDrop = draggedRequest && (allowedTargets?.[draggedRequest.status] || []).includes(column.status);
        return (
          <Paper
            key={column.status}
            variant="outlined"
            onDragOver={(event) => {
              if (!canDrop) {
                return;
              }
              event.preventDefault();
              setOverStatus(column.status);
            }}
            onDragLeave={() => {
              setOverStatus((current) => (current === column.status ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!canDrop) {
                return;
              }
              handleDrop(column.status);
            }}
            sx={{
              flex: '0 0 320px',
              width: 320,
              p: 2,
              borderRadius: 2,
              minHeight: 540,
              background:
                overStatus === column.status
                  ? 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #fbfefe 100%)',
              borderColor: overStatus === column.status ? 'primary.main' : 'rgba(15, 23, 42, 0.08)',
            }}
          >
            <Stack spacing={1.5} sx={{ height: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box>
                  <Typography variant="h6">{column.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {grouped[column.status].length} заявок
                  </Typography>
                </Box>
                <StatusChip value={column.status} />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Перетащите карточку сюда, чтобы изменить статус.
              </Typography>

              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {grouped[column.status].map((request) => {
                  const isDragging = draggedRequest?.id === request.id;
                  return (
                    <Paper
                      key={request.id}
                      variant="outlined"
                      draggable
                      onDragStart={() => handleDragStart(request.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onOpenRequest(request.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'grab',
                        opacity: isDragging ? 0.5 : 1,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                          <Box>
                            <Typography fontWeight={700}>{request.requestNumber}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.requester?.fullName}
                            </Typography>
                          </Box>
                          <StatusChip value={request.priority} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {request.department?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.items.length} позиций · {formatDateTime(request.createdAt)}
                        </Typography>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
