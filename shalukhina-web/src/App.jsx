import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
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
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { api, setToken } from './lib/http';
import { StatCard } from './components/StatCard';
import { StatusChip } from './components/StatusChip';
import { ReceiveDialog } from './components/ReceiveDialog';
import { PurchaseOrderDialog } from './components/PurchaseOrderDialog';
import { PurchaseKanbanBoard } from './components/PurchaseKanbanBoard';
import { RequestFormPage } from './components/RequestFormPage';
import { RequestDetailsPage } from './components/RequestDetailsPage';
import { AppShell } from './components/AppShell';
import { RequestKanbanBoard } from './components/RequestKanbanBoard';

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
  const purchaseWaitRequests = state.requests.filter((request) => request.status === 'PURCHASE_WAIT').length;
  const issuedRequests = state.requests.filter((request) => request.status === 'ISSUED').length;
  const submittedRequests = state.requests.filter((request) => request.status === 'SUBMITTED').length;
  const rejectedRequests = state.requests.filter((request) => request.status === 'REJECTED').length;

  return {
    totalRequests: state.requests.length,
    submittedRequests,
    approvedRequests,
    purchaseWaitRequests,
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
    warehouses: [],
    items: [],
    requests: [],
    movements: [],
    purchases: [],
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
    warehouses: payload.warehouses || [],
    items: payload.items || [],
    requests: payload.requests || [],
    movements: payload.movements || [],
    purchases: payload.purchases || [],
    dashboard: payload.dashboard || null,
    source: 'api',
    apiAvailable: true,
  };
  state.dashboard = state.dashboard || buildDashboard(state);
  return state;
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.pathname);
  const [section, setSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(createEmptyState);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseInitialItems, setPurchaseInitialItems] = useState([]);
  const [purchaseInitialWarehouseId, setPurchaseInitialWarehouseId] = useState('');
  const [warehouseForm, setWarehouseForm] = useState({ code: '', name: '', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unit: 'шт',
    currentQuantity: '0',
    minQuantity: '0',
    storageLocation: '',
    description: '',
  });
  const [adminFormSaving, setAdminFormSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [statusChangingRequestId, setStatusChangingRequestId] = useState(null);
  const [statusChangingPurchaseId, setStatusChangingPurchaseId] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(api.getToken()));
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const activeUser = useMemo(
    () => authUser || null,
    [authUser],
  );
  const isAdmin = activeUser?.role === 'ADMIN';
  const isEmployee = activeUser?.role === 'EMPLOYEE';
  const canManage = activeUser?.role === 'ADMIN' || activeUser?.role === 'RESPONSIBLE';
  const useKanbanRequests = activeUser?.role === 'RESPONSIBLE';
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => {
      if (isEmployee) {
        return item.key === 'dashboard' || item.key === 'requests';
      }
      return item.key !== 'users' || isAdmin;
    }),
    [isAdmin, isEmployee],
  );
  const purchases = state.purchases || [];
  const categories = state.categories || [];
  const warehouses = state.warehouses || [];
  const employeeRequests = useMemo(
    () => state.requests.filter((request) => request.requester?.id === activeUser?.id),
    [state.requests, activeUser?.id],
  );
  const visibleRequests = isEmployee ? employeeRequests : state.requests;
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
  const purchaseBoardItems = useMemo(
    () => purchases.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [purchases],
  );
  const openPurchasesCount = useMemo(
    () => purchases.filter((purchase) => purchase.status !== 'COMPLETED' && purchase.status !== 'CANCELLED').length,
    [purchases],
  );
  const completedPurchasesCount = useMemo(
    () => purchases.filter((purchase) => purchase.status === 'COMPLETED').length,
    [purchases],
  );
  useEffect(() => {
    if (warehouses.length && !itemForm.storageLocation) {
      setItemForm((current) => ({
        ...current,
        storageLocation: String(warehouses[0].id),
      }));
    }
  }, [warehouses, itemForm.storageLocation]);
  const defaultWarehouseId = warehouses[0]?.id ? String(warehouses[0].id) : '';
  const visibleRecentRequests = useMemo(
    () => (isEmployee ? employeeRequests : state.dashboard.recentRequests),
    [employeeRequests, isEmployee, state.dashboard.recentRequests],
  );
  const requestRouteMatch = useMemo(() => {
    if (route === '/requests/new') {
      return { mode: 'create', requestId: null };
    }
    const match = route.match(/^\/requests\/(\d+)(\/edit)?$/);
    if (!match) {
      return null;
    }
    return {
      mode: match[2] ? 'edit' : 'detail',
      requestId: Number(match[1]),
    };
  }, [route]);
  const routeRequest = useMemo(() => {
    if (!requestRouteMatch?.requestId) {
      return null;
    }
    return state.requests.find((request) => request.id === requestRouteMatch.requestId) || null;
  }, [requestRouteMatch, state.requests]);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setRoute(path);
    }
  };

  async function loadSnapshot(includeUsers) {
    const requests = await api.getRequests();
    const items = await api.getItems();
    const departments = await api.getDepartments();
    const categories = await api.getCategories();
    const warehouses = await api.getWarehouses();
    const movements = await api.getMovements();
    const purchases = await api.getPurchases();
    const dashboard = await api.getDashboard();
    const users = includeUsers ? await api.getUsers() : [];

    return {
      dashboard,
      requests,
      items,
      users,
      departments,
      categories,
      warehouses,
      movements,
      purchases,
    };
  }

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.key === section)) {
      setSection(visibleNavItems[0]?.key || 'dashboard');
    }
  }, [section, visibleNavItems]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
        const snapshot = await loadSnapshot(me.role === 'ADMIN');
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
      const snapshot = await loadSnapshot(isAdmin);
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
    setPurchaseDialogOpen(false);
    setPurchaseInitialItems([]);
    setPurchaseInitialWarehouseId('');
    window.history.pushState({}, '', '/');
    setRoute('/');
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
      setError(exception?.message || 'Не удалось выполнить действие через API.');
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

  const moveRequestStatus = async (requestId, nextStatus) => {
    setStatusChangingRequestId(requestId);
    const noteByStatus = {
      APPROVED: 'Согласовано через канбан',
      REJECTED: 'Отклонено через канбан',
      ISSUED: 'Выдано через канбан',
    };
    try {
      await runApiAction(
        () => api.changeRequestStatus(requestId, { status: nextStatus, note: noteByStatus[nextStatus] || 'Изменено через канбан' }),
        'Статус заявки изменен',
      );
    } finally {
      setStatusChangingRequestId((current) => (current === requestId ? null : current));
    }
  };

  const receiveItem = async (payload) => {
    await runApiAction(() => api.receiveItem(payload.itemId, payload), 'Поступление сохранено');
  };

  const createPurchase = async (payload) => {
    await runApiAction(
      () => api.createPurchase({
        deliveryWarehouseId: payload.deliveryWarehouseId ? Number(payload.deliveryWarehouseId) : null,
        deliveryLocation: payload.deliveryLocation,
        comment: payload.comment,
        items: payload.items,
      }),
      'Закупка создана',
    );
  };

  const movePurchaseStatus = async (purchaseId, nextStatus) => {
    setStatusChangingPurchaseId(purchaseId);
    const noteByStatus = {
      ORDERED: 'Заказ оформлен',
      IN_TRANSIT: 'Заказ в пути',
      COMPLETED: 'Закупка завершена и товары поступили на склад',
      CANCELLED: 'Закупка отменена',
      DRAFT: 'Переведено в черновик',
    };
    try {
      await runApiAction(
        () => api.changePurchaseStatus(purchaseId, { status: nextStatus, note: noteByStatus[nextStatus] || 'Изменен статус закупки' }),
        'Статус закупки изменен',
      );
    } finally {
      setStatusChangingPurchaseId((current) => (current === purchaseId ? null : current));
    }
  };

  const openRequestCreatePage = () => navigate('/requests/new');
  const openRequestDetailsPage = (requestId) => navigate(`/requests/${requestId}`);
  const openRequestEditPage = (requestId) => navigate(`/requests/${requestId}/edit`);
  const openPurchaseDialog = (itemOrOptions = null) => {
    const defaultWarehouse = warehouses[0] || null;
    if (itemOrOptions?.items) {
      setPurchaseInitialItems(
        itemOrOptions.items.map((line) => ({
          itemId: line.item?.id || line.itemId || line.id,
          quantity: line.quantityRequested || line.quantity || 1,
        })),
      );
      const firstItemWarehouseName = itemOrOptions.items[0]?.item?.storageLocation;
      const requestWarehouseName = itemOrOptions.deliveryWarehouse?.name || itemOrOptions.deliveryLocation || firstItemWarehouseName;
      const matchedWarehouse = warehouses.find((warehouse) => warehouse.name === requestWarehouseName);
      setPurchaseInitialWarehouseId(String(matchedWarehouse?.id || defaultWarehouse?.id || ''));
    } else if (itemOrOptions) {
      const deficit = Math.max(Number(itemOrOptions.minQuantity || 0) - Number(itemOrOptions.currentQuantity || 0), 1);
      setPurchaseInitialItems([{ itemId: itemOrOptions.id, quantity: deficit }]);
      const matchedWarehouse = warehouses.find((warehouse) => warehouse.name === itemOrOptions.storageLocation);
      setPurchaseInitialWarehouseId(String(matchedWarehouse?.id || defaultWarehouse?.id || ''));
    } else {
      setPurchaseInitialItems([]);
      setPurchaseInitialWarehouseId(String(defaultWarehouse?.id || ''));
    }
    setPurchaseDialogOpen(true);
  };

  const submitPurchaseOrder = async (payload) => {
    await createPurchase(payload);
    setPurchaseDialogOpen(false);
    setPurchaseInitialItems([]);
    setPurchaseInitialWarehouseId(defaultWarehouseId);
  };

  const submitWarehouse = async (event) => {
    event.preventDefault();
    setAdminFormSaving(true);
    try {
      await runApiAction(
        () => api.createWarehouse({
          code: warehouseForm.code,
          name: warehouseForm.name,
          description: warehouseForm.description,
          active: true,
        }),
        'Склад создан',
      );
      setWarehouseForm({ code: '', name: '', description: '' });
    } finally {
      setAdminFormSaving(false);
    }
  };

  const submitItem = async (event) => {
    event.preventDefault();
    setAdminFormSaving(true);
    try {
      const selectedCategory = categories.find((category) => String(category.id) === String(itemForm.categoryId));
      const selectedWarehouse = warehouses.find((warehouse) => String(warehouse.id) === String(itemForm.storageLocation));
      await runApiAction(
        () => api.createItem({
          name: itemForm.name,
          sku: itemForm.sku,
          category: selectedCategory || null,
          unit: itemForm.unit,
          currentQuantity: Number(itemForm.currentQuantity),
          minQuantity: Number(itemForm.minQuantity),
          storageLocation: selectedWarehouse?.name || itemForm.storageLocation,
          description: itemForm.description,
          active: true,
        }),
        'Товар создан',
      );
      setItemForm({
        name: '',
        sku: '',
        categoryId: '',
        unit: 'шт',
        currentQuantity: '0',
        minQuantity: '0',
        storageLocation: '',
        description: '',
      });
    } finally {
      setAdminFormSaving(false);
    }
  };

  const saveNewRequest = async (payload) => {
    const requestBody = {
      ...payload,
      requesterId: activeUser.id,
    };
    const created = await api.createRequest(requestBody);
    await reloadApiSnapshot();
    navigate(`/requests/${created.id}`);
  };

  const saveEditedRequest = async (requestId, payload) => {
    const updated = await api.updateRequest(requestId, payload);
    await reloadApiSnapshot();
    navigate(`/requests/${updated.id}`);
  };

  const filteredRequests = useMemo(() => {
    return visibleRequests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const haystack = `${request.requestNumber} ${request.requester?.fullName} ${request.department?.name} ${request.comment}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [visibleRequests, statusFilter, search]);

  const kanbanRequests = useMemo(() => {
    const needle = search.toLowerCase();
    return visibleRequests.filter((request) => {
      const haystack = `${request.requestNumber} ${request.requester?.fullName} ${request.department?.name} ${request.comment}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [visibleRequests, search]);

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

  const activeSection = requestRouteMatch ? 'requests' : section;
  const handleSectionChange = (nextSection) => {
    setSection(nextSection);
    if (requestRouteMatch) {
      navigate('/');
    }
  };

  let content = null;

  if (requestRouteMatch) {
    if (requestRouteMatch.mode === 'create') {
      content = (
        <RequestFormPage
          mode="create"
          request={null}
          items={state.items}
          requester={activeUser}
          departments={state.departments}
          onSubmit={saveNewRequest}
          onCancel={() => navigate('/')}
        />
      );
    } else if (!routeRequest) {
      content = (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', maxWidth: 560, mx: 'auto' }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5">Заявка не найдена</Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
              На главную
            </Button>
          </Stack>
        </Paper>
      );
    } else if (requestRouteMatch.mode === 'edit') {
      content = (
        <RequestFormPage
          mode="edit"
          request={routeRequest}
          items={state.items}
          requester={routeRequest.requester}
          departments={state.departments}
          onSubmit={(payload) => saveEditedRequest(routeRequest.id, payload)}
          onCancel={() => navigate(`/requests/${routeRequest.id}`)}
        />
      );
    } else {
      const canEditRequest = routeRequest.status === 'SUBMITTED' && (canManage || routeRequest.requester?.id === activeUser.id);
      content = (
        <RequestDetailsPage
          request={routeRequest}
          currentUser={activeUser}
          onBack={() => navigate('/')}
          onEdit={canEditRequest ? () => navigate(`/requests/${routeRequest.id}/edit`) : null}
          onCreatePurchase={openPurchaseDialog}
          onChangeStatus={moveRequestStatus}
          statusChangingRequestId={statusChangingRequestId}
        />
      );
    }
  } else if (section === 'dashboard') {
    content = (
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
                {isEmployee ? 'Мои заявки' : 'Рабочая панель'}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {isEmployee
                  ? 'Создавайте заявку, если в кабинете закончились канцтовары, и отслеживайте ее статус.'
                  : 'Здесь видно, кто подал заявку, что согласовано, что выдано и что нужно пополнить.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="start">
              <Button startIcon={<AddIcon />} variant="contained" onClick={openRequestCreatePage}>
                Создать заявку
              </Button>
            </Stack>
          </Stack>
        </Paper>

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
            <Grid item xs={12}>
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
                      {visibleRecentRequests.map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell>
                            <Button onClick={() => openRequestDetailsPage(request.id)}>{request.requestNumber}</Button>
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
          </Grid>
        </Stack>
      </Stack>
    );
  } else if (section === 'requests') {
    content = (
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}
        <Stack spacing={2.5}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Новые" value={state.dashboard.submittedRequests} hint="Ждут проверки" />
            </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Согласованы" value={state.dashboard.approvedRequests} hint="Готовы к выдаче" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="На закупке" value={state.dashboard.purchaseWaitRequests} hint="Ждут поставки" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Выданы" value={state.dashboard.issuedRequests} hint="Закрытые заявки" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Отклонены" value={state.dashboard.rejectedRequests} hint="Требуют уточнения" />
          </Grid>
        </Grid>
          <Paper elevation={0} sx={panelSx}>
            <Stack spacing={2}>
              <TextField fullWidth label="Поиск по заявке, ФИО или кабинету" value={search} onChange={(event) => setSearch(event.target.value)} />
              {useKanbanRequests ? (
                <RequestKanbanBoard
                  requests={kanbanRequests}
                  onMoveRequest={moveRequestStatus}
                  onOpenRequest={openRequestDetailsPage}
                  statusChangingRequestId={statusChangingRequestId}
                />
              ) : (
                <>
                  <FormControl sx={{ minWidth: 220 }}>
                    <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <MenuItem value="ALL">Все заявки</MenuItem>
                      <MenuItem value="SUBMITTED">Новые</MenuItem>
                      <MenuItem value="APPROVED">Согласованные</MenuItem>
                      <MenuItem value="PURCHASE_WAIT">На закупке</MenuItem>
                      <MenuItem value="REJECTED">Отклоненные</MenuItem>
                      <MenuItem value="ISSUED">Выданные</MenuItem>
                    </Select>
                  </FormControl>
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
                              <Button onClick={() => openRequestDetailsPage(request.id)}>{request.requestNumber}</Button>
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
                                {canManage && (request.status === 'APPROVED' || request.status === 'PURCHASE_WAIT' || request.status === 'SUBMITTED') && (
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
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    );
  } else if (!isEmployee && section === 'inventory') {
    content = (
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Позиций на складе" value={state.items.length} hint="Все товары в системе" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Нуждаются в пополнении" value={lowStockItems.length} hint="Ниже нормы" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Закупок в работе" value={openPurchasesCount} hint="Драфты, заказы, в пути" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Завершено закупок" value={completedPurchasesCount} hint="Уже пополнили склад" />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={panelSx}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Остатки на складе</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Здесь видно текущий остаток по каждому товару. Если чего-то не хватает, можно сразу оформить закупку.
                  </Typography>
                </Box>
                <Button variant="contained" onClick={() => openPurchaseDialog()}>
                  Сформировать закупку
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
                          <TableCell>{item.storageLocation}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => openPurchaseDialog(item)}>
                              Заказать
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
          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={panelSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Закупки</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Создавайте закупку, переносите ее между статусами и завершайте, когда товар пришел на склад.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={() => openPurchaseDialog()}>
                  Новая закупка
                </Button>
              </Stack>
              <PurchaseKanbanBoard
                purchases={purchaseBoardItems}
                onMovePurchase={movePurchaseStatus}
                onOpenPurchase={() => setMessage('Откройте карточку закупки через канбан.')}
                statusChangingPurchaseId={statusChangingPurchaseId}
              />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    );
  } else if (!isEmployee && section === 'reports') {
    content = (
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}
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
      </Stack>
    );
  } else if (isAdmin && section === 'users') {
    content = (
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}
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
                Кабинеты и справочники
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Категории канцтоваров
                  </Typography>
                  <Stack spacing={1}>
                    {categories.map((category) => (
                      <Paper key={category.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                        <Typography fontWeight={700}>{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Склады
                  </Typography>
                  <Stack spacing={1}>
                    {warehouses.map((warehouse) => (
                      <Paper key={warehouse.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                        <Typography fontWeight={700}>{warehouse.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {warehouse.code}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={panelSx} component="form" onSubmit={submitWarehouse}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Создать склад</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Добавьте новый склад, чтобы использовать его в закупках и карточках товаров.
                  </Typography>
                </Box>
                <TextField
                  label="Код склада"
                  value={warehouseForm.code}
                  onChange={(event) => setWarehouseForm((current) => ({ ...current, code: event.target.value }))}
                  required
                />
                <TextField
                  label="Название склада"
                  value={warehouseForm.name}
                  onChange={(event) => setWarehouseForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
                <TextField
                  label="Описание"
                  value={warehouseForm.description}
                  onChange={(event) => setWarehouseForm((current) => ({ ...current, description: event.target.value }))}
                  multiline
                  minRows={2}
                />
                <Button type="submit" variant="contained" disabled={adminFormSaving}>
                  {adminFormSaving ? 'Сохранение...' : 'Создать склад'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={panelSx} component="form" onSubmit={submitItem}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Создать товар</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Новый товар появится в складе и его можно будет использовать в заявках и закупках.
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Название"
                      value={itemForm.name}
                      onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={itemForm.sku}
                      onChange={(event) => setItemForm((current) => ({ ...current, sku: event.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                        Категория
                      </Typography>
                      <Select
                        value={itemForm.categoryId}
                        onChange={(event) => setItemForm((current) => ({ ...current, categoryId: event.target.value }))}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Выберите категорию</em>
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                        Склад
                      </Typography>
                        <Select
                          value={itemForm.storageLocation}
                          onChange={(event) => setItemForm((current) => ({ ...current, storageLocation: event.target.value }))}
                          displayEmpty
                        >
                        <MenuItem value="">
                          <em>Выберите склад</em>
                        </MenuItem>
                        {warehouses.map((warehouse) => (
                          <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                            {warehouse.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Ед. изм."
                      value={itemForm.unit}
                      onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Остаток"
                      value={itemForm.currentQuantity}
                      onChange={(event) => setItemForm((current) => ({ ...current, currentQuantity: event.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Мин. остаток"
                      value={itemForm.minQuantity}
                      onChange={(event) => setItemForm((current) => ({ ...current, minQuantity: event.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Описание"
                      value={itemForm.description}
                      onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))}
                      multiline
                      minRows={2}
                    />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" disabled={adminFormSaving}>
                  {adminFormSaving ? 'Сохранение...' : 'Создать товар'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    );
  } else {
    content = (
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', maxWidth: 560, mx: 'auto' }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5">Раздел недоступен</Typography>
            <Typography color="text.secondary" textAlign="center">
              Этот раздел скрыт для вашей роли.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  return (
    <>
      <AppShell
        activeSection={activeSection}
        activeUser={activeUser}
        canManage={canManage}
        onCreateRequest={openRequestCreatePage}
        onLogout={logout}
        onReceiveItem={() => setReceiveOpen(true)}
        onSectionChange={handleSectionChange}
        sectionTitles={sectionTitles}
        visibleNavItems={visibleNavItems}
      >
        <Container maxWidth="xl" disableGutters>
          {content}
        </Container>
      </AppShell>

      <ReceiveDialog
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onSubmit={receiveItem}
        items={state.items}
        actor={activeUser}
      />

      <PurchaseOrderDialog
        open={purchaseDialogOpen}
        items={state.items}
        initialItems={purchaseInitialItems}
        initialWarehouseId={purchaseInitialWarehouseId}
        warehouses={warehouses}
        onClose={() => {
          setPurchaseDialogOpen(false);
          setPurchaseInitialItems([]);
          setPurchaseInitialWarehouseId(defaultWarehouseId);
        }}
        onSubmit={submitPurchaseOrder}
      />
    </>
  );
}
