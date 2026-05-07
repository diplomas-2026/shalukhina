import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SchoolIcon from '@mui/icons-material/School';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { api, setToken } from './lib/http';
import { StatCard } from './components/StatCard';
import { StatusChip } from './components/StatusChip';
import { RequestDialog } from './components/RequestDialog';
import { ReceiveDialog } from './components/ReceiveDialog';

const drawerWidth = 280;
const sectionTitles = {
  dashboard: 'Главная',
  requests: 'Заявки',
  inventory: 'Склад',
  reports: 'Отчеты',
  users: 'Сотрудники и справочники',
};

const navItems = [
  { key: 'dashboard', label: 'Главная', icon: <DashboardIcon /> },
  { key: 'requests', label: 'Заявки', icon: <AssignmentIcon /> },
  { key: 'inventory', label: 'Склад', icon: <WarehouseIcon /> },
  { key: 'reports', label: 'Отчеты', icon: <AssessmentIcon /> },
  { key: 'users', label: 'Сотрудники', icon: <PeopleIcon /> },
];

const panelSx = {
  p: 2.5,
  borderRadius: 2,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfefe 100%)',
};

const mutedPanelSx = {
  ...panelSx,
  background: 'linear-gradient(180deg, #f8fcff 0%, #ffffff 100%)',
};

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatNumber = (value) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(Number(value));

function buildDashboard(state) {
  const lowStockItems = state.items.filter((item) => item.currentQuantity <= item.minQuantity);
  const approvedRequests = state.requests.filter((request) => request.status === 'APPROVED').length;
  const issuedRequests = state.requests.filter((request) => request.status === 'ISSUED').length;
  const submittedRequests = state.requests.filter((request) => request.status === 'SUBMITTED').length;
  const rejectedRequests = state.requests.filter((request) => request.status === 'REJECTED').length;

  return {
    totalRequests: state.requests.length,
    submittedRequests,
    approvedRequests,
    issuedRequests,
    rejectedRequests,
    lowStockItems: lowStockItems.length,
    recentRequests: state.requests.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    criticalItems: state.items.slice().sort((a, b) => a.currentQuantity - b.currentQuantity).slice(0, 5),
  };
}

function createEmptyState() {
  const empty = {
    departments: [],
    users: [],
    categories: [],
    items: [],
    requests: [],
    movements: [],
  };
  return {
    ...empty,
    dashboard: buildDashboard(empty),
    source: 'api',
    apiAvailable: false,
  };
}

function normalizeApiState(payload) {
  const state = {
    departments: payload.departments || [],
    users: payload.users || [],
    categories: payload.categories || [],
    items: payload.items || [],
    requests: payload.requests || [],
    movements: payload.movements || [],
    dashboard: payload.dashboard || null,
    source: 'api',
    apiAvailable: true,
  };
  state.dashboard = state.dashboard || buildDashboard(state);
  return state;
}

export default function App() {
  const [section, setSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(createEmptyState);
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(api.getToken()));
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const activeUser = useMemo(
    () => authUser || null,
    [authUser],
  );
  const canManage = activeUser?.role === 'ADMIN' || activeUser?.role === 'RESPONSIBLE';
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => item.key !== 'users' || canManage),
    [canManage],
  );
  const selectedRequest = state.requests.find((request) => request.id === selectedRequestId) || null;
  const selectedItem = state.items.find((item) => item.id === selectedItemId) || null;
  const lowStockItems = useMemo(
    () => state.items.filter((item) => item.currentQuantity <= item.minQuantity),
    [state.items],
  );
  const pendingRequests = useMemo(
    () => state.requests.filter((request) => request.status === 'SUBMITTED'),
    [state.requests],
  );
  const readyToIssueRequests = useMemo(
    () => state.requests.filter((request) => request.status === 'APPROVED'),
    [state.requests],
  );
  const recentMovements = useMemo(
    () => state.movements.slice().sort((a, b) => new Date(b.happenedAt) - new Date(a.happenedAt)).slice(0, 5),
    [state.movements],
  );

  async function loadSnapshot(includeUsers) {
    const requests = await api.getRequests();
    const items = await api.getItems();
    const departments = await api.getDepartments();
    const categories = await api.getCategories();
    const movements = await api.getMovements();
    const dashboard = await api.getDashboard();
    const users = includeUsers ? await api.getUsers() : [];

    return {
      dashboard,
      requests,
      items,
      users,
      departments,
      categories,
      movements,
    };
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!api.getToken()) {
        if (!alive) return;
        setLoading(false);
        setAuthLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (!alive) return;
        setAuthUser(me);
        const snapshot = await loadSnapshot(me.role === 'ADMIN' || me.role === 'RESPONSIBLE');
        if (!alive) return;
        setState(normalizeApiState(snapshot));
        setError('');
      } catch {
        if (!alive) return;
        setToken(null);
        setAuthUser(null);
        setError('Сессия не найдена или недействительна. Войдите снова.');
      } finally {
        if (alive) {
          setLoading(false);
          setAuthLoading(false);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  async function reloadApiSnapshot() {
    try {
      const snapshot = await loadSnapshot(canManage);
      setState(normalizeApiState(snapshot));
      setError('');
      setMessage('Данные обновлены');
    } catch (exception) {
      if (exception?.status === 401) {
        logout();
        setError('Сессия не найдена или недействительна. Войдите снова.');
        return;
      }
      setError('Не удалось обновить данные с API.');
    }
  }

  const login = async (event) => {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoading(true);
    setError('');
    try {
      const response = await api.login(loginForm);
      setToken(response.token);
      setAuthUser(response.user);
      await reloadApiSnapshot();
      setMessage('Вход выполнен');
    } catch {
      setError('Не удалось войти в систему. Проверьте логин и пароль.');
    } finally {
      setLoginSubmitting(false);
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setAuthUser(null);
    setState(createEmptyState());
    setMessage('');
    setError('');
    setSection('dashboard');
    setSelectedRequestId(null);
    setSelectedItemId(null);
    setLoading(false);
  };

  const runApiAction = async (action, successMessage) => {
    try {
      await action();
      await reloadApiSnapshot();
      setMessage(successMessage);
      setError('');
    } catch (exception) {
      if (exception?.status === 401) {
        logout();
        setError('Сессия завершена. Войдите снова.');
        return;
      }
      setError('Не удалось выполнить действие через API.');
    }
  };

  const createRequest = async (payload) => {
    const requestBody = {
      ...payload,
      requesterId: activeUser.id,
    };
    await runApiAction(() => api.createRequest(requestBody), 'Заявка создана');
  };

  const approveRequest = async (requestId) => {
    const body = { actorId: activeUser.id, comment: 'Согласовано' };
    await runApiAction(() => api.approveRequest(requestId, body), 'Заявка согласована');
  };

  const rejectRequest = async (requestId) => {
    const body = { actorId: activeUser.id, reason: 'Отклонено ответственным' };
    await runApiAction(() => api.rejectRequest(requestId, body), 'Заявка отклонена');
  };

  const issueRequest = async (requestId) => {
    const body = { actorId: activeUser.id, document: `REQ-${requestId}` };
    await runApiAction(() => api.issueRequest(requestId, body), 'Товары выданы');
  };

  const receiveItem = async (payload) => {
    await runApiAction(() => api.receiveItem(payload.itemId, payload), 'Поступление сохранено');
  };

  const filteredRequests = useMemo(() => {
    return state.requests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const haystack = `${request.requestNumber} ${request.requester?.fullName} ${request.department?.name} ${request.comment}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [state.requests, statusFilter, search]);

  if (authLoading || loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка...</Typography>
      </Stack>
    );
  }

  if (!activeUser) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)', p: 2 }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 520, p: 4, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)' }}>
          <Stack spacing={2.5} component="form" onSubmit={login}>
            <Stack spacing={0.5} alignItems="center">
              <SchoolIcon color="primary" sx={{ fontSize: 42 }} />
              <Typography variant="h5" textAlign="center">
                Вход для сотрудников школы
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Система заказа и учета канцтоваров для МБУ «Просветское»
              </Typography>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="Логин"
              value={loginForm.username}
              onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
              autoComplete="username"
              required
              fullWidth
            />
            <TextField
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    onClick={() => setShowPassword((current) => !current)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="large" disabled={loginSubmitting}>
              {loginSubmitting ? 'Входим...' : 'Войти'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 24%, #f8fafc 100%)' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'rgba(37, 99, 235, 0.92)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Inventory2Icon />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">МБУ «Просветское»</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Заказы, согласование и складской учет канцтоваров
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={700}>
                {activeUser.fullName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {activeUser.role}
              </Typography>
            </Box>
            <Button variant="outlined" color="inherit" onClick={logout}>
              Выйти
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(15, 23, 42, 0.08)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Кто вошел в систему
            </Typography>
            <Typography variant="h6">{activeUser?.position || activeUser?.role}</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeUser?.fullName}
            </Typography>
          </Paper>

          <List disablePadding>
            {visibleNavItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={section === item.key}
                onClick={() => setSection(item.key)}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} secondary={sectionTitles[item.key]} />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} disabled={!canManage && activeUser?.role !== 'EMPLOYEE'}>
              Создать заявку
            </Button>
            <Button fullWidth variant="outlined" onClick={() => setReceiveOpen(true)} disabled={!canManage}>
              Пополнить склад
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="xl" disableGutters>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Загрузка данных...</Typography>
            </Stack>
          ) : (
            <Stack spacing={3}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {message ? <Alert severity="info">{message}</Alert> : null}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="overline" color="primary.main">
                      {sectionTitles[section]}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5 }}>
                      {section === 'dashboard' && 'Рабочая панель'}
                      {section === 'requests' && 'Заявки от сотрудников'}
                      {section === 'inventory' && 'Остатки и поступления'}
                      {section === 'reports' && 'Сводка по работе'}
                      {section === 'users' && 'Сотрудники и кабинеты'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      Здесь видно, кто подал заявку, что согласовано, что выдано и что нужно пополнить.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="start">
                    <Button startIcon={<RefreshIcon />} variant="outlined" onClick={reloadApiSnapshot}>
                      Обновить
                    </Button>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
                      Создать заявку
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              {section === 'dashboard' && (
                <Stack spacing={3}>
                  <Paper elevation={0} sx={{ ...panelSx, overflow: 'hidden', position: 'relative' }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.10), transparent 38%), radial-gradient(circle at left bottom, rgba(245, 158, 11, 0.10), transparent 30%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <Grid container spacing={2.5} sx={{ position: 'relative' }}>
                      <Grid item xs={12} md={8}>
                        <Stack spacing={1.5}>
                          <Typography variant="overline" color="primary.main">
                            Рабочий день в школе
                          </Typography>
                          <Typography variant="h4">
                            Все заявки и канцтовары в одном понятном окне
                          </Typography>
                          <Typography color="text.secondary">
                            Учитель или сотрудник подает заявку, ответственный согласует, склад выдает товар, а система сама считает остатки.
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip icon={<TaskAltIcon />} label={`${pendingRequests.length} заявок ждут согласования`} variant="outlined" />
                            <Chip icon={<LocalShippingIcon />} label={`${readyToIssueRequests.length} заявок готовы к выдаче`} variant="outlined" />
                            <Chip icon={<HistoryIcon />} label={`${state.movements.length} операций в журнале`} variant="outlined" />
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={mutedPanelSx}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Что сделать сейчас
                          </Typography>
                          <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                              Создать заявку
                            </Button>
                            <Button fullWidth variant="outlined" onClick={() => setSection('requests')}>
                              Проверить заявки
                            </Button>
                            <Button fullWidth variant="outlined" onClick={() => setSection('inventory')}>
                              Посмотреть остатки
                            </Button>
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Всего заявок" value={state.dashboard.totalRequests} hint="Общий поток заявок" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Ждут согласования" value={state.dashboard.submittedRequests} hint="Нужно проверить" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Готовы к выдаче" value={state.dashboard.approvedRequests} hint="Можно выдавать" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Нужно пополнить" value={state.dashboard.lowStockItems} hint="Остаток ниже нормы" />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} lg={7}>
                      <Paper elevation={0} sx={panelSx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Box>
                            <Typography variant="h6">Последние заявки</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Можно быстро открыть заявку и посмотреть состав.
                            </Typography>
                          </Box>
                          <Button size="small" variant="outlined" onClick={() => setSection('requests')}>
                            Все заявки
                          </Button>
                        </Stack>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Номер</TableCell>
                                <TableCell>Кто подал</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Приоритет</TableCell>
                                <TableCell align="right">Дата</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {state.dashboard.recentRequests.map((request) => (
                                <TableRow key={request.id} hover>
                                  <TableCell>
                                    <Button onClick={() => setSelectedRequestId(request.id)}>{request.requestNumber}</Button>
                                  </TableCell>
                                  <TableCell>{request.requester?.fullName}</TableCell>
                                  <TableCell><StatusChip value={request.status} /></TableCell>
                                  <TableCell><StatusChip value={request.priority} /></TableCell>
                                  <TableCell align="right">{formatDateTime(request.createdAt)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} lg={5}>
                      <Paper elevation={0} sx={panelSx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Box>
                            <Typography variant="h6">Что требует внимания</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Сначала проверьте эти позиции.
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack spacing={1.5}>
                          {state.dashboard.criticalItems.map((item) => {
                            const ratio = Math.max(0, Math.min(100, (Number(item.currentQuantity) / Math.max(Number(item.minQuantity), 1)) * 100));
                            return (
                              <Box key={item.id}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography fontWeight={600}>{item.name}</Typography>
                                  <Typography color="text.secondary">
                                    {formatNumber(item.currentQuantity)} / {formatNumber(item.minQuantity)} {item.unit}
                                  </Typography>
                                </Stack>
                                <Box sx={{ height: 10, borderRadius: 1, background: '#e2e8f0', overflow: 'hidden' }}>
                                  <Box sx={{ width: `${ratio}%`, height: '100%', background: ratio < 70 ? '#f59e0b' : '#0f766e' }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {section === 'requests' && (
                <Stack spacing={2.5}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Новые" value={state.dashboard.submittedRequests} hint="Ждут проверки" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Согласованы" value={state.dashboard.approvedRequests} hint="Готовы к выдаче" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Выданы" value={state.dashboard.issuedRequests} hint="Закрытые заявки" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard title="Отклонены" value={state.dashboard.rejectedRequests} hint="Требуют уточнения" />
                    </Grid>
                  </Grid>
                  <Paper elevation={0} sx={panelSx}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                      <TextField fullWidth label="Поиск по заявке, ФИО или кабинету" value={search} onChange={(event) => setSearch(event.target.value)} />
                      <FormControl sx={{ minWidth: 220 }}>
                        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                          <MenuItem value="ALL">Все заявки</MenuItem>
                          <MenuItem value="SUBMITTED">Новые</MenuItem>
                          <MenuItem value="APPROVED">Согласованные</MenuItem>
                          <MenuItem value="REJECTED">Отклоненные</MenuItem>
                          <MenuItem value="ISSUED">Выданные</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Номер</TableCell>
                            <TableCell>Кто подал</TableCell>
                            <TableCell>Кабинет / отдел</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell>Приоритет</TableCell>
                            <TableCell>Позиций</TableCell>
                            <TableCell align="right">Действия</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request.id} hover>
                              <TableCell>
                                <Button onClick={() => setSelectedRequestId(request.id)}>{request.requestNumber}</Button>
                              </TableCell>
                              <TableCell>{request.requester?.fullName}</TableCell>
                              <TableCell>{request.department?.name}</TableCell>
                              <TableCell><StatusChip value={request.status} /></TableCell>
                              <TableCell><StatusChip value={request.priority} /></TableCell>
                              <TableCell>{request.items.length} поз.</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  {canManage && request.status === 'SUBMITTED' && (
                                    <>
                                      <Button size="small" variant="outlined" onClick={() => approveRequest(request.id)}>
                                        Согласовать
                                      </Button>
                                      <Button size="small" color="error" variant="outlined" onClick={() => rejectRequest(request.id)}>
                                        Отклонить
                                      </Button>
                                    </>
                                  )}
                                  {canManage && request.status === 'APPROVED' && (
                                    <Button size="small" variant="contained" onClick={() => issueRequest(request.id)}>
                                      Выдать
                                    </Button>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Stack>
              )}

              {section === 'inventory' && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={4}>
                        <StatCard title="Позиций на складе" value={state.items.length} hint="Все товары в системе" />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StatCard title="Нуждаются в пополнении" value={lowStockItems.length} hint="Ниже минимального остатка" />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StatCard title="Движений за период" value={state.movements.length} hint="Поступления и выдачи" />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={panelSx}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h6">Остатки на складе</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Здесь видно, чего хватает, а что лучше пополнить заранее.
                          </Typography>
                        </Box>
                      </Stack>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Товар</TableCell>
                              <TableCell>Категория</TableCell>
                              <TableCell>Остаток</TableCell>
                              <TableCell>Мин. остаток</TableCell>
                              <TableCell>Склад</TableCell>
                              <TableCell align="right">Действия</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {state.items.map((item) => {
                              const isLow = item.currentQuantity <= item.minQuantity;
                              return (
                                <TableRow key={item.id} hover>
                                  <TableCell>
                                    <Stack>
                                      <Typography fontWeight={700}>{item.name}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {item.sku}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>{item.category?.name}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={`${formatNumber(item.currentQuantity)} ${item.unit}`}
                                      color={isLow ? 'warning' : 'success'}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>{formatNumber(item.minQuantity)} {item.unit}</TableCell>
                                  <TableCell>{item.storageLocation}</TableCell>
                                  <TableCell align="right">
                                    <Button size="small" variant="outlined" onClick={() => setSelectedItemId(item.id)}>
                                      Пополнить
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Paper elevation={0} sx={panelSx}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Последние движения
                      </Typography>
                      <Stack spacing={1.5}>
                        {recentMovements.map((movement) => (
                          <Paper key={movement.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                            <Stack spacing={0.5}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography fontWeight={700}>{movement.item?.name}</Typography>
                                <StatusChip value={movement.type} />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {movement.quantity} {movement.item?.unit} · {formatDateTime(movement.happenedAt)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {movement.sourceDocument || 'Без документа'}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {section === 'reports' && (
                <Stack spacing={2.5}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={4}>
                      <StatCard title="Выдано заявок" value={state.dashboard.issuedRequests} hint="Закрыты выдачей товара" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <StatCard title="Ожидают согласования" value={state.dashboard.submittedRequests} hint="Очередь на проверку" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <StatCard title="Позиций в риске" value={lowStockItems.length} hint="Требуют пополнения" />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} lg={7}>
                      <Paper elevation={0} sx={panelSx}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Товары с низким остатком
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Товар</TableCell>
                                <TableCell>Остаток</TableCell>
                                <TableCell>Минимум</TableCell>
                                <TableCell>Отклонение</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {lowStockItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{formatNumber(item.currentQuantity)} {item.unit}</TableCell>
                                  <TableCell>{formatNumber(item.minQuantity)} {item.unit}</TableCell>
                                  <TableCell>
                                    <Typography color="warning.main" fontWeight={700}>
                                      {formatNumber(item.minQuantity - item.currentQuantity)} {item.unit}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} lg={5}>
                      <Paper elevation={0} sx={panelSx}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Движение по заявкам
                        </Typography>
                        <Stack spacing={1.5}>
                          {state.requests.slice(0, 5).map((request) => (
                            <Box key={request.id}>
                              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography fontWeight={700}>{request.requestNumber}</Typography>
                                <StatusChip value={request.status} />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {request.requester?.fullName} · {request.department?.name}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {canManage && section === 'users' && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} lg={6}>
                    <Paper elevation={0} sx={panelSx}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Сотрудники
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>ФИО</TableCell>
                              <TableCell>Роль</TableCell>
                              <TableCell>Кабинет / отдел</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {state.users.map((user) => (
                              <TableRow key={user.id} hover>
                                <TableCell>
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar sx={{ width: 32, height: 32 }}>{user.fullName[0]}</Avatar>
                                    <Box>
                                      <Typography fontWeight={700}>{user.fullName}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {user.email}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell><StatusChip value={user.role} /></TableCell>
                                <TableCell>{user.department?.name}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} lg={6}>
                    <Paper elevation={0} sx={panelSx}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Кабинеты и категории
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Кабинеты / отделы
                          </Typography>
                          <Stack spacing={1}>
                            {state.departments.map((department) => (
                              <Paper key={department.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                                <Typography fontWeight={700}>{department.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {department.code}
                                </Typography>
                              </Paper>
                            ))}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Категории канцтоваров
                          </Typography>
                          <Stack spacing={1}>
                            {state.categories.map((category) => (
                              <Paper key={category.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                                <Typography fontWeight={700}>{category.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {category.description}
                                </Typography>
                              </Paper>
                            ))}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Stack>
          )}
        </Container>
      </Box>

      <RequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createRequest}
        items={state.items}
        requester={activeUser}
        departments={state.departments}
      />

      <ReceiveDialog
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onSubmit={receiveItem}
        items={state.items}
        actor={activeUser}
      />

      <Drawer anchor="right" open={Boolean(selectedRequest)} onClose={() => setSelectedRequestId(null)}>
        <Box sx={{ width: 420, p: 3 }}>
          {selectedRequest ? (
            <Stack spacing={2}>
              <Typography variant="h5">{selectedRequest.requestNumber}</Typography>
              <Stack direction="row" spacing={1}>
                <StatusChip value={selectedRequest.status} />
                <StatusChip value={selectedRequest.priority} />
              </Stack>
              <Typography color="text.secondary">
                {selectedRequest.requester?.fullName} · {selectedRequest.department?.name}
              </Typography>
              <Typography>{selectedRequest.comment}</Typography>
              <Divider />
              <Typography variant="subtitle1" fontWeight={700}>
                Состав заявки
              </Typography>
              {selectedRequest.items.map((line) => (
                <Paper key={line.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{line.item?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {line.quantityRequested} {line.item?.unit} · выдано {line.quantityIssued}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {line.note}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : null}
        </Box>
      </Drawer>

      <Drawer anchor="right" open={Boolean(selectedItem)} onClose={() => setSelectedItemId(null)}>
        <Box sx={{ width: 420, p: 3 }}>
              {selectedItem ? (
                <Stack spacing={2}>
                  <Typography variant="h5">{selectedItem.name}</Typography>
                  <Typography color="text.secondary">{selectedItem.description}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={selectedItem.category?.name || 'Категория'} variant="outlined" />
                    <Chip label={selectedItem.active ? 'Активный' : 'Неактивный'} color={selectedItem.active ? 'success' : 'default'} />
                    <Chip label={selectedItem.sku} variant="outlined" />
                  </Stack>
                  <Divider />
                  <Typography>Остаток: {formatNumber(selectedItem.currentQuantity)} {selectedItem.unit}</Typography>
                  <Typography>Минимум: {formatNumber(selectedItem.minQuantity)} {selectedItem.unit}</Typography>
                  <Typography>Склад: {selectedItem.storageLocation}</Typography>
            </Stack>
          ) : null}
        </Box>
      </Drawer>
    </Box>
  );
}
