import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 280;

export function AppShell({
  activeSection,
  activeUser,
  canManage,
  children,
  onCreateRequest,
  onLogout,
  onReceiveItem,
  onSectionChange,
  sectionTitles,
  visibleNavItems,
}) {
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (section) => {
    onSectionChange(section);
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', p: 2 }}>
      <PaperCard activeUser={activeUser} />

      <List disablePadding>
        {visibleNavItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={activeSection === item.key}
            onClick={() => handleNavigate(item.key)}
            sx={{ borderRadius: 1.5, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} secondary={sectionTitles[item.key]} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1.5}>
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={onCreateRequest}>
          Создать заявку
        </Button>
        {canManage ? (
          <Button fullWidth variant="outlined" onClick={onReceiveItem}>
            Пополнить склад
          </Button>
        ) : null}
      </Stack>
    </Box>
  );

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
          {!isDesktop ? (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          ) : null}
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
                {activeUser?.fullName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {activeUser?.role}
              </Typography>
            </Box>
            <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
              Выйти
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
            },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

function PaperCard({ activeUser }) {
  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe', mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Кто вошел в систему
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
        <Avatar sx={{ width: 40, height: 40 }}>{activeUser?.fullName?.[0] || 'U'}</Avatar>
        <Box>
          <Typography variant="h6">{activeUser?.position || activeUser?.role}</Typography>
          <Typography variant="body2" color="text.secondary">
            {activeUser?.fullName}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
