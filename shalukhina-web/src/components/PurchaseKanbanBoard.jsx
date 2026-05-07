import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { StatusChip } from './StatusChip';

const columns = [
  { status: 'DRAFT', title: 'Черновики' },
  { status: 'ORDERED', title: 'Заказаны' },
  { status: 'IN_TRANSIT', title: 'В пути' },
  { status: 'COMPLETED', title: 'Завершены' },
  { status: 'CANCELLED', title: 'Отменены' },
];

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function PurchaseKanbanBoard({ purchases, onMovePurchase, onOpenPurchase, statusChangingPurchaseId }) {
  const [draggedPurchase, setDraggedPurchase] = useState(null);
  const [overStatus, setOverStatus] = useState(null);

  const grouped = useMemo(() => {
    const result = Object.fromEntries(columns.map((column) => [column.status, []]));
    purchases.forEach((purchase) => {
      if (result[purchase.status]) {
        result[purchase.status].push(purchase);
      }
    });
    columns.forEach((column) => {
      result[column.status].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return result;
  }, [purchases]);

  const handleDragStart = (purchaseId) => {
    setDraggedPurchase(purchases.find((purchase) => purchase.id === purchaseId) || null);
  };

  const handleDragEnd = () => {
    setDraggedPurchase(null);
    setOverStatus(null);
  };

  const handleDrop = async (status) => {
    if (!draggedPurchase || draggedPurchase.status === status) {
      handleDragEnd();
      return;
    }
    await onMovePurchase(draggedPurchase.id, status);
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
        const canDrop = Boolean(draggedPurchase);
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
              minHeight: 480,
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
                    {grouped[column.status].length} закупок
                  </Typography>
                </Box>
                <StatusChip value={column.status} />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Перетащите карточку сюда, чтобы изменить статус.
              </Typography>

              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {grouped[column.status].map((purchase) => {
                  const isDragging = draggedPurchase?.id === purchase.id;
                  const isLoading = statusChangingPurchaseId === purchase.id;
                  return (
                    <Paper
                      key={purchase.id}
                      variant="outlined"
                      draggable
                      onDragStart={() => {
                        if (isLoading) {
                          return;
                        }
                        handleDragStart(purchase.id);
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (!isLoading) {
                          onOpenPurchase(purchase.id);
                        }
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: isLoading ? 'wait' : 'grab',
                        opacity: isDragging || isLoading ? 0.5 : 1,
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
                            <Typography fontWeight={700}>{purchase.orderNumber}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {purchase.createdBy?.fullName}
                            </Typography>
                          </Box>
                          <StatusChip value={purchase.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {purchase.items.length} позиций
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(purchase.createdAt)}
                        </Typography>
                        {isLoading ? (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
                            <CircularProgress size={16} />
                            <Typography variant="caption" color="text.secondary">
                              Обновляем статус...
                            </Typography>
                          </Stack>
                        ) : null}
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
