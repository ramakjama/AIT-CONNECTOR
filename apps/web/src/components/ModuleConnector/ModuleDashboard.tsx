/**
 * Module Dashboard - Dashboard visual para gestión de módulos
 *
 * @module @ait-core/web/module-connector
 * @description Dashboard interactivo con KPIs, gráficos y configurador visual
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  PowerSettingsNew as PowerIcon,
  CloudDownload as DownloadIcon,
  Settings as SettingsIcon,
  Assessment as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ViewModule as ModulesIcon,
  Dashboard as DashboardIcon,
  AccountTree as DependencyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { ModuleDefinition, ModuleStatus, ModuleCategory, DashboardStats } from '@ait-core/module-connector/types';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// ============================================================================
// TYPES
// ============================================================================

interface ModuleDashboardProps {
  modules: ModuleDefinition[];
  stats: DashboardStats;
  onModuleToggle: (moduleId: string, enable: boolean) => Promise<void>;
  onModuleSettings: (moduleId: string) => void;
  onModuleInstall: (moduleId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function getStatusColor(status: ModuleStatus): string {
  switch (status) {
    case ModuleStatus.ACTIVE:
      return '#4caf50';
    case ModuleStatus.INACTIVE:
      return '#9e9e9e';
    case ModuleStatus.LOADING:
      return '#2196f3';
    case ModuleStatus.ERROR:
      return '#f44336';
    case ModuleStatus.DISABLED:
      return '#757575';
    case ModuleStatus.PENDING:
      return '#ff9800';
    default:
      return '#9e9e9e';
  }
}

function getStatusIcon(status: ModuleStatus): React.ReactNode {
  switch (status) {
    case ModuleStatus.ACTIVE:
      return <SuccessIcon sx={{ color: getStatusColor(status) }} />;
    case ModuleStatus.ERROR:
      return <ErrorIcon sx={{ color: getStatusColor(status) }} />;
    case ModuleStatus.LOADING:
    case ModuleStatus.PENDING:
      return <InfoIcon sx={{ color: getStatusColor(status) }} />;
    default:
      return <InfoIcon sx={{ color: getStatusColor(status) }} />;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ModuleDashboard: React.FC<ModuleDashboardProps> = ({
  modules,
  stats,
  onModuleToggle,
  onModuleSettings,
  onModuleInstall,
  onRefresh
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedModule, setSelectedModule] = useState<ModuleDefinition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleModuleClick = (module: ModuleDefinition) => {
    setSelectedModule(module);
    setDialogOpen(true);
  };

  const handleModuleToggle = async (module: ModuleDefinition) => {
    setLoading(true);
    setError(null);

    try {
      const enable = module.status !== ModuleStatus.ACTIVE;
      await onModuleToggle(module.id, enable);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del módulo');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al refrescar datos');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  // Módulos por categoría
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<ModuleCategory, ModuleDefinition[]>);

  // Datos para gráfico de estado
  const statusChartData = {
    labels: Object.values(ModuleStatus),
    datasets: [{
      label: 'Módulos por Estado',
      data: Object.values(ModuleStatus).map(status =>
        modules.filter(m => m.status === status).length
      ),
      backgroundColor: Object.values(ModuleStatus).map(getStatusColor),
    }]
  };

  // Datos para gráfico de categoría
  const categoryChartData = {
    labels: Object.keys(modulesByCategory),
    datasets: [{
      label: 'Módulos por Categoría',
      data: Object.values(modulesByCategory).map(mods => mods.length),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ]
    }]
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56 }}>
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              🔌 MODULE CONNECTOR
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema de Gestión de Módulos AIT-CORE ERP
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refrescar
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" component="div" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {stats.activeModules}/{stats.totalModules}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Módulos Activos
                </Typography>
              </Box>
              <ModulesIcon sx={{ fontSize: 48, color: '#1976d2', opacity: 0.3 }} />
            </Box>
            <LinearProgress
              variant="determinate"
              value={(stats.activeModules / stats.totalModules) * 100}
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" component="div" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                  {stats.totalModules}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Módulos
                </Typography>
              </Box>
              <DashboardIcon sx={{ fontSize: 48, color: '#7b1fa2', opacity: 0.3 }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" component="div" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  {stats.activeUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuarios Activos
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#4caf50', width: 48, height: 48 }}>
                👥
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" component="div" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  {stats.uptime}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
              </Box>
              <TimelineIcon sx={{ fontSize: 48, color: '#f57c00', opacity: 0.3 }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} aria-label="module dashboard tabs">
          <Tab label="Vista General" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Módulos" icon={<ModulesIcon />} iconPosition="start" />
          <Tab label="Dependencias" icon={<DependencyIcon />} iconPosition="start" />
          <Tab label="Analíticas" icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          {/* Gráfico de Estado */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Módulos por Estado
              </Typography>
              <Bar data={statusChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Card>
          </Grid>

          {/* Gráfico de Categoría */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Módulos por Categoría
              </Typography>
              <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Card>
          </Grid>

          {/* Alertas Recientes */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ Alertas Recientes
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="High Memory Usage"
                    secondary="Módulo Marketing - 85% memoria"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Slow Response Time"
                    secondary="Módulo Inventory - 2.5s respuesta"
                  />
                </ListItem>
              </List>
            </Card>
          </Grid>

          {/* Top Módulos */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                📊 Módulos Más Utilizados
              </Typography>
              <List>
                {modules
                  .filter(m => m.status === ModuleStatus.ACTIVE)
                  .slice(0, 5)
                  .map((module) => (
                    <ListItem key={module.id}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: module.color || '#1976d2', width: 32, height: 32 }}>
                          {module.icon || '📦'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={module.displayName}
                        secondary={`${module.downloads} descargas`}
                      />
                      <Chip
                        label={`${module.rating}⭐`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {/* Modules Tab */}
        <Grid container spacing={2}>
          {modules.map((module) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={module.id}>
              <Card
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: `4px solid ${getStatusColor(module.status)}`,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleModuleClick(module)}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: module.color || '#1976d2', width: 48, height: 48 }}>
                    {module.icon || '📦'}
                  </Avatar>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={module.status}>
                      <IconButton size="small">
                        {getStatusIcon(module.status)}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Content */}
                <Typography variant="h6" noWrap gutterBottom>
                  {module.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {module.description}
                </Typography>

                {/* Footer */}
                <Box sx={{ mt: 'auto' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={module.category} size="small" />
                    <Chip label={module.license} size="small" variant="outlined" />
                    <Chip label={`v${module.version}`} size="small" variant="outlined" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PowerIcon />}
                      fullWidth
                      color={module.status === ModuleStatus.ACTIVE ? 'error' : 'success'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleToggle(module);
                      }}
                      disabled={loading}
                    >
                      {module.status === ModuleStatus.ACTIVE ? 'Desconectar' : 'Conectar'}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onModuleSettings(module.id);
                      }}
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        {/* Dependencies Tab */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔗 Mapa de Dependencias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vista visual del árbol de dependencias entre módulos (en desarrollo)
          </Typography>
          {/* Aquí iría el componente de visualización de dependencias */}
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={3}>
        {/* Analytics Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                📈 KPIs de Rendimiento
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary">⚡ 245ms</Typography>
                    <Typography variant="body2">Response Time</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="secondary">💾 68%</Typography>
                    <Typography variant="body2">Memory Usage</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="success.main">🖥️ 42%</Typography>
                    <Typography variant="body2">CPU Usage</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="info.main">✅ 99.9%</Typography>
                    <Typography variant="body2">Uptime</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Module Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedModule && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: selectedModule.color || '#1976d2' }}>
                  {selectedModule.icon || '📦'}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedModule.displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    v{selectedModule.version} • {selected Module.category}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" paragraph>
                {selectedModule.description}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Estado:
              </Typography>
              <Chip
                label={selectedModule.status}
                icon={getStatusIcon(selectedModule.status)}
                sx={{ bgcolor: getStatusColor(selectedModule.status), color: 'white', mb: 2 }}
              />

              <Typography variant="subtitle2" gutterBottom>
                Dependencias:
              </Typography>
              <List dense>
                {selectedModule.dependencies.map((dep) => (
                  <ListItem key={dep.moduleId}>
                    <ListItemText
                      primary={dep.moduleId}
                      secondary={`v${dep.version} - ${dep.type}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" gutterBottom>
                Submódulos: {selectedModule.submodules.length}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Herramientas: {selectedModule.tools.length}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
              <Button
                variant="contained"
                startIcon={<PowerIcon />}
                color={selectedModule.status === ModuleStatus.ACTIVE ? 'error' : 'success'}
                onClick={() => {
                  handleModuleToggle(selectedModule);
                  setDialogOpen(false);
                }}
              >
                {selectedModule.status === ModuleStatus.ACTIVE ? 'Desconectar' : 'Conectar'}
              </Button>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => {
                  onModuleSettings(selectedModule.id);
                  setDialogOpen(false);
                }}
              >
                Configurar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ModuleDashboard;
