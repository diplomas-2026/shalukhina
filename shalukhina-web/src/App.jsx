import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
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
import * as XLSX from 'xlsx';
import { api, setToken } from './lib/http';
import { StatCard } from './components/StatCard';
import { StatusChip } from './components/StatusChip';
import { PurchaseOrderDialog } from './components/PurchaseOrderDialog';
import { PurchaseKanbanBoard } from './components/PurchaseKanbanBoard';
import { RequestFormPage } from './components/RequestFormPage';
import { RequestDetailsPage } from './components/RequestDetailsPage';
import { AppShell } from './components/AppShell';
import { RequestKanbanBoard } from './components/RequestKanbanBoard';
import { AdminDirectoryPanel } from './components/AdminDirectoryPanel';

const sectionTitles = {
  dashboard: 'Главная',
  requests: 'Заявки',
  inventory: 'Склад',
  items: 'Товары',
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

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatNumber = (value) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(Number(value));

const requestStatusLabels = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Новая',
  APPROVED: 'Согласована',
  PURCHASE_WAIT: 'На закупке',
  REJECTED: 'Отклонена',
  ISSUED: 'Выдана',
  CANCELLED: 'Отменена',
};

const priorityLabels = {
  LOW: 'Низкий',
  NORMAL: 'Нормальный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

const purchaseStatusLabels = {
  DRAFT: 'Черновик',
  ORDERED: 'Заказана',
  IN_TRANSIT: 'В пути',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

const movementTypeLabels = {
  RECEIPT: 'Поступление',
  ISSUE: 'Выдача',
  ADJUSTMENT: 'Корректировка',
};

function downloadWorkbook(fileName, sheets) {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([sheetName, rows]) => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  });
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function buildDashboard(state) {
  const stockByItemId = (state.stocks || []).reduce((acc, stock) => {
    const next = Number(stock.quantity || 0);
    acc[stock.itemId] = (acc[stock.itemId] || 0) + next;
    return acc;
  }, {});
  const approvedRequests = state.requests.filter((request) => request.status === 'APPROVED').length;
  const purchaseWaitRequests = state.requests.filter((request) => request.status === 'PURCHASE_WAIT').length;
  const issuedRequests = state.requests.filter((request) => request.status === 'ISSUED').length;
  const submittedRequests = state.requests.filter((request) => request.status === 'SUBMITTED').length;
  const rejectedRequests = state.requests.filter((request) => request.status === 'REJECTED').length;
  const stockTotals = state.items.map((item) => (state.stocks || [])
    .filter((stock) => stock.itemId === item.id)
    .reduce((sum, stock) => sum + Number(stock.quantity || 0), 0));

  return {
    totalRequests: state.requests.length,
    submittedRequests,
    approvedRequests,
    purchaseWaitRequests,
    issuedRequests,
    rejectedRequests,
    lowStockItems: stockTotals.filter((quantity) => quantity <= 0).length,
    recentRequests: state.requests.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    criticalItems: state.items.slice().sort((a, b) => (stockByItemId[a.id] || 0) - (stockByItemId[b.id] || 0)).slice(0, 5),
  };
}

function createEmptyState() {
  const empty = {
    departments: [],
    users: [],
    categories: [],
    warehouses: [],
    items: [],
    stocks: [],
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
    stocks: payload.stocks || [],
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
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseInitialItems, setPurchaseInitialItems] = useState([]);
  const [purchaseInitialWarehouseId, setPurchaseInitialWarehouseId] = useState('');
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
  const useKanbanRequests = activeUser?.role === 'RESPONSIBLE' || activeUser?.role === 'ADMIN';
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => {
      if (isEmployee) {
        return item.key === 'dashboard' || item.key === 'requests';
      }
      if (isAdmin) {
        return true;
      }
      return item.key !== 'users' && item.key !== 'items';
    }),
    [isAdmin, isEmployee],
  );
  const purchases = state.purchases || [];
  const categories = state.categories || [];
  const warehouses = state.warehouses || [];
  const stockBalances = state.stocks || [];
  const stockQuantityByItemId = useMemo(
    () => stockBalances.reduce((acc, stock) => {
      acc[stock.itemId] = (acc[stock.itemId] || 0) + Number(stock.quantity || 0);
      return acc;
    }, {}),
    [stockBalances],
  );
  const employeeRequests = useMemo(
    () => state.requests.filter((request) => request.requester?.id === activeUser?.id),
    [state.requests, activeUser?.id],
  );
  const visibleRequests = isEmployee ? employeeRequests : state.requests;
  const emptyStockItems = useMemo(
    () => state.items.filter((item) => (stockQuantityByItemId[item.id] || 0) <= 0),
    [state.items, stockQuantityByItemId],
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
    const stocks = await api.getStockBalances();
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
      stocks,
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

  const issueRequest = async (requestId, warehouseId = null) => {
    const body = { actorId: activeUser.id, document: `REQ-${requestId}`, warehouseId: warehouseId ? Number(warehouseId) : null };
    await runApiAction(() => api.issueRequest(requestId, body), 'Товары выданы');
  };

  const moveRequestStatus = async (requestId, nextStatus, options = {}) => {
    setStatusChangingRequestId(requestId);
    const noteByStatus = {
      APPROVED: 'Согласовано через канбан',
      REJECTED: 'Отклонено через канбан',
      ISSUED: 'Выдано через канбан',
    };
    const warehouseId = options.warehouseId || null;
    try {
      await runApiAction(
        () => api.changeRequestStatus(requestId, {
          status: nextStatus,
          note: noteByStatus[nextStatus] || 'Изменено через канбан',
          warehouseId: warehouseId ? Number(warehouseId) : null,
        }),
        'Статус заявки изменен',
      );
    } finally {
      setStatusChangingRequestId((current) => (current === requestId ? null : current));
    }
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
      setPurchaseInitialWarehouseId(String(itemOrOptions.deliveryWarehouse?.id || defaultWarehouse?.id || ''));
    } else if (itemOrOptions?.itemId) {
      setPurchaseInitialItems([{ itemId: itemOrOptions.itemId, quantity: 1 }]);
      setPurchaseInitialWarehouseId(String(itemOrOptions.warehouseId || defaultWarehouse?.id || ''));
    } else if (itemOrOptions?.id) {
      setPurchaseInitialItems([{ itemId: itemOrOptions.id, quantity: 1 }]);
      setPurchaseInitialWarehouseId(String(defaultWarehouse?.id || ''));
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

  const exportRequestsReport = () => {
    downloadWorkbook('otchet-zayavki.xlsx', {
      'Заявки': state.requests.map((request) => ({
        'Номер': request.requestNumber,
        'Кто подал': request.requester?.fullName || '',
        'Кабинет / отдел': request.department?.name || '',
        'Статус': requestStatusLabels[request.status] || request.status,
        'Приоритет': priorityLabels[request.priority] || request.priority,
        'Позиций': request.items?.length || 0,
        'Дата создания': formatDateTime(request.createdAt),
        'Кто согласовал': request.approvedBy?.fullName || '',
        'Дата согласования': request.approvedAt ? formatDateTime(request.approvedAt) : '',
        'Комментарий': request.comment || '',
        'Причина отклонения': request.rejectionReason || '',
      })),
    });
  };

  const exportInventoryReport = () => {
    downloadWorkbook('otchet-sklad.xlsx', {
      'Склад': stockBalances.map((stock) => ({
        'Склад': stock.warehouseName || '',
        'Товар': stock.itemName || '',
        'SKU': stock.itemSku || '',
        'Категория': stock.categoryName || '',
        'Остаток': Number(stock.quantity || 0),
        'Ед. изм.': stock.itemUnit || '',
      })),
    });
  };

  const exportPurchasesReport = () => {
    downloadWorkbook('otchet-zakupki.xlsx', {
      'Закупки': state.purchases.map((purchase) => ({
        'Номер': purchase.orderNumber,
        'Склад доставки': purchase.deliveryWarehouse?.name || purchase.deliveryLocation || '',
        'Статус': purchaseStatusLabels[purchase.status] || purchase.status,
        'Создано': formatDateTime(purchase.createdAt),
        'Создал': purchase.createdBy?.fullName || '',
        'Комментарий': purchase.comment || '',
        'Позиции': purchase.items?.length || 0,
      })),
    });
  };

  const exportMovementsReport = () => {
    downloadWorkbook('otchet-dvizhenie-sklada.xlsx', {
      'Движение склада': state.movements.map((movement) => ({
        'Дата': formatDateTime(movement.happenedAt),
        'Тип': movementTypeLabels[movement.type] || movement.type,
        'Товар': movement.item?.name || '',
        'Количество': Number(movement.quantity || 0),
        'Пользователь': movement.actor?.fullName || '',
        'Документ': movement.sourceDocument || '',
        'Комментарий': movement.comment || '',
      })),
    });
  };

  const exportFullReport = () => {
    downloadWorkbook('otchet-polnyj.xlsx', {
      'Заявки': state.requests.map((request) => ({
        'Номер': request.requestNumber,
        'Статус': requestStatusLabels[request.status] || request.status,
        'Кто подал': request.requester?.fullName || '',
        'Кабинет / отдел': request.department?.name || '',
        'Приоритет': priorityLabels[request.priority] || request.priority,
        'Позиций': request.items?.length || 0,
        'Дата создания': formatDateTime(request.createdAt),
      })),
      'Склад': stockBalances.map((stock) => ({
        'Склад': stock.warehouseName || '',
        'Товар': stock.itemName || '',
        'SKU': stock.itemSku || '',
        'Категория': stock.categoryName || '',
        'Остаток': Number(stock.quantity || 0),
        'Ед. изм.': stock.itemUnit || '',
      })),
      'Закупки': state.purchases.map((purchase) => ({
        'Номер': purchase.orderNumber,
        'Статус': purchaseStatusLabels[purchase.status] || purchase.status,
        'Склад доставки': purchase.deliveryWarehouse?.name || purchase.deliveryLocation || '',
        'Позиции': purchase.items?.length || 0,
      })),
      'Движение': state.movements.map((movement) => ({
        'Дата': formatDateTime(movement.happenedAt),
        'Тип': movementTypeLabels[movement.type] || movement.type,
        'Товар': movement.item?.name || '',
        'Количество': Number(movement.quantity || 0),
      })),
    });
  };

  const saveUser = async (payload) => {
    const body = {
      fullName: payload.fullName,
      email: payload.email,
      username: payload.username,
      passwordHash: payload.passwordHash,
      role: payload.role,
      department: payload.department,
      position: payload.position,
      active: payload.active,
    };
    await runApiAction(
      () => (payload.id ? api.updateUser(payload.id, body) : api.createUser(body)),
      payload.id ? 'Сотрудник обновлен' : 'Сотрудник создан',
    );
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Удалить сотрудника "${user.fullName}"?`)) {
      return;
    }
    if (user.id === activeUser.id) {
      setError('Нельзя удалить текущего пользователя.');
      return;
    }
    await runApiAction(() => api.deleteUser(user.id), 'Сотрудник удален');
  };

  const saveItem = async (payload) => {
    const body = {
      name: payload.name,
      sku: payload.sku,
      category: payload.category,
      unit: payload.unit,
      description: payload.description,
      active: payload.active,
    };
    await runApiAction(
      () => (payload.id ? api.updateItem(payload.id, body) : api.createItem(body)),
      payload.id ? 'Товар обновлен' : 'Товар создан',
    );
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Удалить товар "${item.name}"?`)) {
      return;
    }
    await runApiAction(() => api.deleteItem(item.id), 'Товар удален');
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
          warehouses={warehouses}
          stockBalances={stockBalances}
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
              <StatCard title="Пустые позиции" value={state.dashboard.lowStockItems} hint="На складе нет остатка" />
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
                  onCreatePurchase={openPurchaseDialog}
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
            <StatCard title="Товаров в каталоге" value={state.items.length} hint="Справочник товаров" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Пустые позиции" value={emptyStockItems.length} hint="Товаров нет на складе" />
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
                    Здесь видно остатки по каждому складу. Если товара не хватает, можно сразу оформить закупку.
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
                      <TableCell>Склад</TableCell>
                      <TableCell>Товар</TableCell>
                      <TableCell>Категория</TableCell>
                      <TableCell>Остаток</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockBalances.map((stock) => {
                      return (
                        <TableRow key={stock.id} hover>
                          <TableCell>{stock.warehouseName}</TableCell>
                          <TableCell>
                            <Stack>
                              <Typography fontWeight={700}>{stock.itemName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {stock.itemSku}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{stock.categoryName || 'Без категории'}</TableCell>
                          <TableCell>
                            <Chip label={`${formatNumber(stock.quantity)} ${stock.itemUnit}`} color={Number(stock.quantity) <= 0 ? 'warning' : 'success'} variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => openPurchaseDialog(stock)}>
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
          <Paper elevation={0} sx={panelSx}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6">Отчеты в Excel</Typography>
                <Typography variant="body2" color="text.secondary">
                  Скачивайте готовые отчеты по заявкам, складу, закупкам и движению товаров.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.25}>
                      <Box>
                        <Typography fontWeight={700}>Отчет по заявкам</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Все заявки с ФИО, отделом, статусом и датами.
                        </Typography>
                      </Box>
                      <Button variant="contained" onClick={exportRequestsReport}>
                        Скачать Excel
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.25}>
                      <Box>
                        <Typography fontWeight={700}>Отчет по складу</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Текущие остатки, категории и принадлежность к складу.
                        </Typography>
                      </Box>
                      <Button variant="contained" onClick={exportInventoryReport}>
                        Скачать Excel
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.25}>
                      <Box>
                        <Typography fontWeight={700}>Отчет по закупкам</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Статусы закупок, состав и склад доставки.
                        </Typography>
                      </Box>
                      <Button variant="contained" onClick={exportPurchasesReport}>
                        Скачать Excel
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.25}>
                      <Box>
                        <Typography fontWeight={700}>Отчет по движению</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Поступления, выдачи и корректировки по товарам.
                        </Typography>
                      </Box>
                      <Button variant="contained" onClick={exportMovementsReport}>
                        Скачать Excel
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                      <Box>
                        <Typography fontWeight={700}>Полный сводный отчет</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Один файл со всеми листами: заявки, склад, закупки и движение.
                        </Typography>
                      </Box>
                      <Button variant="contained" color="primary" onClick={exportFullReport}>
                        Скачать полный Excel
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    );
  } else if (isAdmin && section === 'users') {
    content = (
      <AdminDirectoryPanel
        defaultTab="users"
        users={state.users}
        items={state.items}
        categories={categories}
        departments={state.departments}
        onSaveUser={saveUser}
        onDeleteUser={deleteUser}
        onSaveItem={saveItem}
        onDeleteItem={deleteItem}
      />
    );
  } else if (isAdmin && section === 'items') {
    content = (
      <AdminDirectoryPanel
        defaultTab="items"
        users={state.users}
        items={state.items}
        categories={categories}
        departments={state.departments}
        onSaveUser={saveUser}
        onDeleteUser={deleteUser}
        onSaveItem={saveItem}
        onDeleteItem={deleteItem}
      />
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
        onSectionChange={handleSectionChange}
        sectionTitles={sectionTitles}
        visibleNavItems={visibleNavItems}
      >
        <Container maxWidth="xl" disableGutters>
          {content}
        </Container>
      </AppShell>

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
