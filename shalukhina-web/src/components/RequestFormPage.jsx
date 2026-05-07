import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
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

const emptyLine = { itemId: '', quantity: 1, note: '' };

function buildLinesFromRequest(request) {
  if (!request?.items?.length) {
    return [{ ...emptyLine, itemId: '' }];
  }
  return request.items.map((line) => ({
    itemId: line.item?.id || '',
    quantity: line.quantityRequested || 1,
    note: line.note || '',
  }));
}

export function RequestFormPage({ mode, request, items, requester, departments, onSubmit, onCancel }) {
  const isEdit = mode === 'edit';
  const initialDepartmentId = useMemo(
    () => request?.department?.id || requester?.department?.id || departments[0]?.id || '',
    [departments, request, requester],
  );
  const initialPriority = useMemo(() => request?.priority || 'NORMAL', [request]);
  const initialComment = useMemo(() => request?.comment || '', [request]);
  const initialLines = useMemo(() => buildLinesFromRequest(request), [request]);

  const [priority, setPriority] = useState(initialPriority);
  const [comment, setComment] = useState(initialComment);
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [lines, setLines] = useState(initialLines);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPriority(initialPriority);
    setComment(initialComment);
    setDepartmentId(initialDepartmentId);
    setLines(initialLines);
  }, [initialComment, initialDepartmentId, initialLines, initialPriority]);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    setLines((current) =>
      current.map((line) => {
        if (line.itemId) {
          return line;
        }
        return { ...line, itemId: items[0].id };
      }),
    );
  }, [items]);

  const canSubmit = useMemo(() => {
    return departmentId && lines.length > 0 && lines.every((line) => line.itemId && Number(line.quantity) > 0);
  }, [departmentId, lines]);

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
      await onSubmit({
        departmentId: Number(departmentId),
        priority,
        comment,
        items: lines.map((line) => ({
          itemId: Number(line.itemId),
          quantity: Number(line.quantity),
          note: line.note,
        })),
      });
    } catch (exception) {
      setError(exception?.message || 'Не удалось сохранить заявку.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 880, mx: 'auto', width: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4">{isEdit ? 'Редактирование заявки' : 'Новая заявка'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Заполните форму и отправьте заявку на канцтовары.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onCancel}>
            Назад
          </Button>
          <Button variant="contained" onClick={submit} disabled={!canSubmit || saving}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Отправить заявку'}
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Основные данные</Typography>
            <Typography variant="body2" color="text.secondary">
              Укажите кабинет, срочность и краткое пояснение.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Заявитель" value={requester?.fullName || ''} disabled />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Кабинет / отдел
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Срочность
                </Typography>
                <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <MenuItem value="LOW">Низкий</MenuItem>
                  <MenuItem value="NORMAL">Нормальный</MenuItem>
                  <MenuItem value="HIGH">Высокий</MenuItem>
                  <MenuItem value="URGENT">Срочный</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Краткое пояснение"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2.25}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6">Позиции заявки</Typography>
              <Typography variant="body2" color="text.secondary">
                Добавьте все канцтовары, которые нужны в кабинете.
              </Typography>
            </Box>
            <Button startIcon={<AddIcon />} onClick={addLine}>
              Добавить позицию
            </Button>
          </Stack>

          {lines.map((line, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
              <IconButton
                color="error"
                onClick={() => removeLine(index)}
                disabled={lines.length === 1}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
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
                <Box>
                  <TextField
                    fullWidth
                    label="Примечание"
                    value={line.note}
                    onChange={(event) => updateLine(index, { note: event.target.value })}
                  />
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
