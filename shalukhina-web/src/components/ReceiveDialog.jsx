import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  FormControl,
  Button,
} from '@mui/material';

export function ReceiveDialog({ open, onClose, onSubmit, items, actor }) {
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [document, setDocument] = useState('');
  const [comment, setComment] = useState('');

  const handleClose = () => {
    setItemId(items[0]?.id || '');
    setQuantity(1);
    setDocument('');
    setComment('');
    onClose();
  };

  const submit = () => {
    onSubmit({
      itemId,
      quantity: Number(quantity),
      actorId: actor?.id,
      document,
      comment,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Пополнение склада</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Товар
                </Typography>
                <Select value={itemId} onChange={(event) => setItemId(Number(event.target.value))}>
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Количество" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Накладная / документ" value={document} onChange={(event) => setDocument(event.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Примечание" value={comment} onChange={(event) => setComment(event.target.value)} />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          Сохранить поступление
        </Button>
      </DialogActions>
    </Dialog>
  );
}
