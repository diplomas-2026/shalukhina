import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyLine = { itemId: '', quantity: 1, note: '' };

export function RequestDialog({ open, onClose, onSubmit, items, requester, departments }) {
  const initialDepartmentId = requester?.department?.id || departments[0]?.id || '';
  const [priority, setPriority] = useState('NORMAL');
  const [comment, setComment] = useState('');
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [lines, setLines] = useState([{ ...emptyLine, itemId: items[0]?.id || '' }]);

  const canSubmit = useMemo(() => {
    return departmentId && lines.length > 0 && lines.every((line) => line.itemId && Number(line.quantity) > 0);
  }, [departmentId, lines]);

  const reset = () => {
    setPriority('NORMAL');
    setComment('');
    setDepartmentId(initialDepartmentId);
    setLines([{ ...emptyLine, itemId: items[0]?.id || '' }]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateLine = (index, patch) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    setLines((current) => [...current, { ...emptyLine, itemId: items[0]?.id || '' }]);
  };

  const removeLine = (index) => {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const submit = () => {
    onSubmit({
      requesterId: requester.id,
      departmentId: Number(departmentId),
      priority,
      comment,
      items: lines.map((line) => ({
        itemId: Number(line.itemId),
        quantity: Number(line.quantity),
        note: line.note,
      })),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Создание заявки</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Заявитель" value={requester?.fullName || ''} disabled />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Подразделение
                </Typography>
                <Select value={departmentId} onChange={(event) => setDepartmentId(Number(event.target.value))}>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Приоритет
                </Typography>
                <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <MenuItem value="LOW">Низкий</MenuItem>
                  <MenuItem value="NORMAL">Нормальный</MenuItem>
                  <MenuItem value="HIGH">Высокий</MenuItem>
                  <MenuItem value="URGENT">Срочный</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Комментарий"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </Grid>
          </Grid>

          <Divider />

          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                Строки заявки
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addLine}>
                Добавить строку
              </Button>
            </Stack>
            {lines.map((line, index) => (
              <Grid container spacing={2} key={index} alignItems="center">
                <Grid item xs={12} md={5}>
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
                </Grid>
                <Grid item xs={12} md={2.5}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Количество"
                    value={line.quantity}
                    onChange={(event) => updateLine(index, { quantity: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={3.5}>
                  <TextField
                    fullWidth
                    label="Комментарий"
                    value={line.note}
                    onChange={(event) => updateLine(index, { note: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton color="error" onClick={() => removeLine(index)} disabled={lines.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit}>
          Создать заявку
        </Button>
      </DialogActions>
    </Dialog>
  );
}
