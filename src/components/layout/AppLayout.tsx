import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined'
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore.ts'
import { useUiStore } from '../../stores/uiStore.ts'
import type { NavModule } from '../../types/dashboard.ts'

const drawerWidth = 260

const navItems: Array<{
  module: NavModule
  label: string
  path: string
  icon: ReactNode
}> = [
  {
    module: 'stats',
    label: 'Stats',
    path: '/stats',
    icon: <QueryStatsOutlinedIcon />,
  },
  {
    module: 'bets',
    label: 'Bets',
    path: '/bets',
    icon: <ReceiptLongOutlinedIcon />,
  },
  {
    module: 'payout-queue',
    label: 'Payout Queue',
    path: '/bets/payout-queue',
    icon: <PaidOutlinedIcon />,
  },
  {
    module: 'results-2d',
    label: '2D Results',
    path: '/results/2d',
    icon: <HistoryOutlinedIcon />,
  },
  {
    module: 'results-3d',
    label: '3D Results',
    path: '/results/3d',
    icon: <HistoryOutlinedIcon />,
  },
  {
    module: 'odds-settings',
    label: 'Odds Settings',
    path: '/settings/odds',
    icon: <TuneOutlinedIcon />,
  },
  {
    module: 'users',
    label: 'Users',
    path: '/users',
    icon: <PeopleOutlineOutlinedIcon />,
  },
]

const getHeaderTitle = (pathname: string) =>
  navItems.find((item) => pathname.startsWith(item.path))?.label ??
  'Bet Operations'

export function AppLayout() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const themeMode = useUiStore((state) => state.themeMode)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const closeSidebar = useUiStore((state) => state.closeSidebar)
  const signOut = useAuthStore((state) => state.signOut)

  const handleSignOut = () => {
    void signOut().finally(() => {
      navigate('/login', { replace: true })
    })
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Lotto Admin</Typography>
        <Typography variant="body2" color="text.secondary">
          Bet Operations
        </Typography>
      </Box>
      <List sx={{ px: 1.25, py: 1.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <ListItemButton
              key={item.module}
              component={NavLink}
              to={item.path}
              selected={isActive}
              onClick={isMobile ? closeSidebar : undefined}
              sx={{
                mb: 0.5,
                borderRadius: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open navigation"
            onClick={toggleSidebar}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {getHeaderTitle(location.pathname)}
          </Typography>
          <IconButton
            color="inherit"
            aria-label="toggle color mode"
            onClick={toggleTheme}
          >
            {themeMode === 'dark' ? (
              <LightModeOutlinedIcon />
            ) : (
              <DarkModeOutlinedIcon />
            )}
          </IconButton>
          <Tooltip title="Sign out">
            <IconButton color="inherit" aria-label="sign out" onClick={handleSignOut}>
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? isSidebarOpen : true}
          onClose={closeSidebar}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, sm: 3 },
          pt: { xs: 11, sm: 12 },
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
