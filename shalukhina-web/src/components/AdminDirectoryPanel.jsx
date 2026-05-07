import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { StatusChip } from './StatusChip';

const emptyUser = {
  fullName: '',
  email: '',
  username: '',
  passwordHash: '',
  role: 'EMPLOYEE',
  departmentId: '',
  position: '',
  active: true,
};

const emptyItem = {
  name: '',
  sku: '',
  categoryId: '',
  unit: 'шт',
  currentQuantity: '0',
  minQuantity: '0',
  storageLocationId: '',
  description: '',
  active: true,
};

function UserDialog({ open, user, departments, onClose, onSave }) {
  const [form, setForm] = useState(emptyUser);
  const isEdit = Boolean(user?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      username: user?.username || '',
      passwordHash: '',
      role: user?.role || 'EMPLOYEE',
      departmentId: user?.department?.id ? String(user.department.id) : '',
      position: user?.position || '',
      active: user?.active ?? true,
    });
  }, [open, user]);

  const submit = async () => {
    const department = departments.find((departmentItem) => String(departmentItem.id) === String(form.departmentId));
    await onSave({
      id: user?.id,
      fullName: form.fullName,
      email: form.email,
      username: form.username,
      passwordHash: form.passwordHash,
      role: form.role,
      department: department || null,
      position: form.position,
      active: form.active,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Редактировать сотрудника' : 'Новый сотрудник'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="ФИО" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} fullWidth required />
          <TextField label="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} fullWidth required />
          <TextField label="Логин" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} fullWidth required />
          <TextField
            label={isEdit ? 'Новый пароль' : 'Пароль'}
            type="password"
            value={form.passwordHash}
            onChange={(event) => setForm((current) => ({ ...current, passwordHash: event.target.value }))}
            helperText={isEdit ? 'Оставьте пустым, если пароль менять не нужно.' : 'Пароль обязателен при создании.'}
            fullWidth
            required={!isEdit}
          />
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Роль
            </Typography>
            <Select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
              <MenuItem value="EMPLOYEE">Сотрудник</MenuItem>
              <MenuItem value="RESPONSIBLE">Ответственный</MenuItem>
              <MenuItem value="ADMIN">Администратор</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Отдел
            </Typography>
            <Select value={form.departmentId} onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value }))}>
              <MenuItem value="">
                <em>Не выбран</em>
              </MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.id} value={String(department.id)}>
                  {department.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Должность" value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />}
            label="Активен"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemDialog({ open, item, categories, warehouses, onClose, onSave }) {
  const [form, setForm] = useState(emptyItem);
  const isEdit = Boolean(item?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      name: item?.name || '',
      sku: item?.sku || '',
      categoryId: item?.category?.id ? String(item.category.id) : '',
      unit: item?.unit || 'шт',
      currentQuantity: item?.currentQuantity != null ? String(item.currentQuantity) : '0',
      minQuantity: item?.minQuantity != null ? String(item.minQuantity) : '0',
      storageLocationId: String(warehouses.find((warehouse) => warehouse.name === item?.storageLocation)?.id || ''),
      description: item?.description || '',
      active: item?.active ?? true,
    });
  }, [item, open, warehouses]);

  const submit = async () => {
    const category = categories.find((categoryItem) => String(categoryItem.id) === String(form.categoryId));
    const warehouse = warehouses.find((warehouseItem) => String(warehouseItem.id) === String(form.storageLocationId));
    await onSave({
      id: item?.id,
      name: form.name,
      sku: form.sku,
      category: category || null,
      unit: form.unit,
      currentQuantity: Number(form.currentQuantity),
      minQuantity: Number(form.minQuantity),
      storageLocation: warehouse?.name || '',
      description: form.description,
      active: form.active,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Название" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} fullWidth required />
          <TextField label="SKU" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} fullWidth />
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Категория
            </Typography>
            <Select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
              <MenuItem value="">
                <em>Не выбрана</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Склад
            </Typography>
            <Select value={form.storageLocationId} onChange={(event) => setForm((current) => ({ ...current, storageLocationId: event.target.value }))}>
              <MenuItem value="">
                <em>Не выбран</em>
              </MenuItem>
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Ед. изм." value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} fullWidth required />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField type="number" label="Остаток" value={form.currentQuantity} onChange={(event) => setForm((current) => ({ ...current, currentQuantity: event.target.value }))} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField type="number" label="Мин. остаток" value={form.minQuantity} onChange={(event) => setForm((current) => ({ ...current, minQuantity: event.target.value }))} fullWidth required />
            </Grid>
          </Grid>
          <TextField label="Описание" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} fullWidth multiline minRows={2} />
          <FormControlLabel
            control={<Checkbox checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />}
            label="Активен"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AdminDirectoryPanel({
  defaultTab = 'users',
  users,
  items,
  categories,
  departments,
  warehouses,
  onSaveUser,
  onDeleteUser,
  onSaveItem,
  onDeleteItem,
}) {
  const [tab, setTab] = useState(defaultTab);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const userCount = users.length;
  const itemCount = items.length;

  const openUserDialog = (user = null) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const openItemDialog = (item = null) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const closeUserDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
  };

  const closeItemDialog = () => {
    setItemDialogOpen(false);
    setEditingItem(null);
  };

  const saveUser = async (payload) => {
    await onSaveUser(payload);
    closeUserDialog();
  };

  const saveItem = async (payload) => {
    await onSaveItem(payload);
    closeItemDialog();
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography variant="h5">Сотрудники и товары</Typography>
            <Typography variant="body2" color="text.secondary">
              Управляйте сотрудниками школы и справочником канцтоваров.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Сотрудников: {userCount}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Товаров: {itemCount}
              </Typography>
            </Paper>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab value="users" label="Сотрудники" />
          <Tab value="items" label="Товары" />
        </Tabs>
      </Paper>

      {tab === 'users' ? (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
              <Box>
                <Typography variant="h6">Сотрудники</Typography>
                <Typography variant="body2" color="text.secondary">
                  Текущие учетные записи, роли и отделы.
                </Typography>
              </Box>
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => openUserDialog()}>
                Добавить сотрудника
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Сотрудник</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell>Отдел</TableCell>
                    <TableCell>Должность</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32 }}>{user.fullName?.[0] || 'U'}</Avatar>
                          <Box>
                            <Typography fontWeight={700}>{user.fullName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.username} · {user.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><StatusChip value={user.role} /></TableCell>
                      <TableCell>{user.department?.name || 'Не указан'}</TableCell>
                      <TableCell>{user.position || 'Не указана'}</TableCell>
                      <TableCell>{user.active ? 'Активен' : 'Отключен'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton onClick={() => openUserDialog(user)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => onDeleteUser(user)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
              <Box>
                <Typography variant="h6">Товары</Typography>
                <Typography variant="body2" color="text.secondary">
                  Справочник канцтоваров с остатками и складом.
                </Typography>
              </Box>
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => openItemDialog()}>
                Добавить товар
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Товар</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Остаток</TableCell>
                    <TableCell>Склад</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const isLow = Number(item.currentQuantity) <= Number(item.minQuantity);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography fontWeight={700}>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.sku || 'SKU не указан'}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.category?.name || 'Без категории'}</TableCell>
                        <TableCell>
                          <Typography color={isLow ? 'warning.main' : 'success.main'} fontWeight={700}>
                            {item.currentQuantity} {item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.storageLocation || 'Не указан'}</TableCell>
                        <TableCell>{isLow ? 'Нужно пополнить' : 'Норма'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton onClick={() => openItemDialog(item)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => onDeleteItem(item)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Paper>
      )}

      <UserDialog
        open={userDialogOpen}
        user={editingUser}
        departments={departments}
        onClose={closeUserDialog}
        onSave={saveUser}
      />

      <ItemDialog
        open={itemDialogOpen}
        item={editingItem}
        categories={categories}
        warehouses={warehouses}
        onClose={closeItemDialog}
        onSave={saveItem}
      />
    </Stack>
  );
}
