import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyLine = { itemId: '', quantity: 1 };

export function PurchaseOrderDialog({ open, items, warehouses, initialItems, initialWarehouseId, onClose, onSubmit }) {
  const initialLines = useMemo(() => {
    if (initialItems?.length) {
      return initialItems.map((line) => ({
        itemId: line.itemId || items[0]?.id || '',
        quantity: line.quantity || 1,
      }));
    }
    return [{ ...emptyLine, itemId: items[0]?.id || '' }];
  }, [initialItems, items]);

  const [comment, setComment] = useState('');
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId || String(warehouses[0]?.id || ''));
  const [lines, setLines] = useState(initialLines);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setComment('');
    setWarehouseId(initialWarehouseId || String(warehouses[0]?.id || ''));
    setLines(initialLines);
    setError('');
  }, [initialLines, initialWarehouseId, open, warehouses]);

  useEffect(() => {
    if (!items.length) {
      return;
    }
    setLines((current) =>
      current.map((line) => (line.itemId ? line : { ...line, itemId: items[0].id })),
    );
  }, [items]);

  const canSubmit = Boolean(warehouseId) && lines.length > 0 && lines.every((line) => line.itemId && Number(line.quantity) > 0);
  const hasWarehouses = Array.isArray(warehouses) && warehouses.length > 0;

  const updateLine = (index, patch) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    setLines((current) => [...current, { ...emptyLine, itemId: items[0]?.id || '' }]);
  };

  const removeLine = (index) => {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const selectedWarehouse = warehouses.find((warehouse) => String(warehouse.id) === String(warehouseId));
      await onSubmit({
        deliveryWarehouseId: hasWarehouses ? warehouseId : null,
        deliveryLocation: hasWarehouses ? selectedWarehouse?.name || '' : warehouseId,
        comment,
        items: lines.map((line) => ({
          itemId: Number(line.itemId),
          quantity: Number(line.quantity),
        })),
      });
    } catch (exception) {
      setError(exception?.message || 'Не удалось сохранить закупку.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Новая закупка</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Состав закупки</Typography>
            <Typography variant="body2" color="text.secondary">
              Добавьте товары, которые нужно заказать для пополнения склада.
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {hasWarehouses ? (
            <FormControl fullWidth>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                Склад доставки
              </Typography>
              <Select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              label="Склад доставки"
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
              helperText="Укажите, куда должна поступить закупка."
            />
          )}

          <TextField
            fullWidth
            label="Комментарий"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            multiline
            minRows={2}
          />

          <Stack spacing={1.5}>
            {lines.map((line, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                <IconButton color="error" onClick={() => removeLine(index)} disabled={lines.length === 1} sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <DeleteIcon />
                </IconButton>
                <Stack spacing={2} sx={{ pr: 5 }}>
                  <Box>
                    <FormControl fullWidth>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                        Товар
                      </Typography>
                      <Select value={line.itemId} onChange={(event) => updateLine(index, { itemId: Number(event.target.value) })}>
                        {items.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name} · {item.currentQuantity} {item.unit}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      type="number"
                      label="Количество"
                      value={line.quantity}
                      onChange={(event) => updateLine(index, { quantity: event.target.value })}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Button startIcon={<AddIcon />} onClick={addLine}>
            Добавить позицию
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Отмена
        </Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit || saving}>
          {saving ? 'Сохранение...' : 'Создать закупку'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
