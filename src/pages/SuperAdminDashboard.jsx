import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Chip, Avatar, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, InputAdornment, CircularProgress,
  Card, CardContent, Grid, Snackbar, Alert, Divider, alpha,
  Badge, Stack, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  SchoolOutlined as SchoolIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteIcon,
  PowerSettingsNew as PowerIcon,
  ContentCopy as CopyIcon,
  Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon,
  CheckCircleOutline as CheckCircleIcon,
  HighlightOff as CancelIcon,
  PeopleAlt as GroupsIcon,
  AutorenewOutlined as AutoIcon,
  DashboardOutlined as DashIcon,
  FilterList as FilterIcon,
  KeyboardArrowDown as ChevronIcon,
  Business as BusinessIcon,
  AdminPanelSettingsOutlined as AdminIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { fetchAllSchools, createSchool, toggleSchool, deleteSchool, clearLastCreated } from '../redux/companySlice';
import { logout } from '../redux/authSlice';
import BeinnovoLogo from '../components/BeinnovoLogo';

// ─── Auto-generate password ────────────────────────────────────────────────────
const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums  = '0123456789';
  const sym   = '@#$!';
  const pick  = (s) => s[Math.floor(Math.random() * s.length)];
  const base  = Array.from({ length: 5 }, () => pick(chars)).join('');
  return pick(upper) + base + pick(nums) + pick(nums) + pick(sym);
};

const PLAN_META = {
  trial:    { color: '#64748B', bg: '#F1F5F9', label: 'Trial' },
  basic:    { color: '#0284C7', bg: '#E0F2FE', label: 'Basic' },
  standard: { color: '#D97706', bg: '#FEF3C7', label: 'Standard' },
  premium:  { color: '#7C3AED', bg: '#EDE9FE', label: 'Premium' },
};
const PLANS = ['trial', 'basic', 'standard', 'premium'];

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND = {
  navy:       '#030D1E',
  navyMid:    '#071428',
  navyLight:  '#0D2146',
  blue:       '#1055B8',
  blueLight:  '#42A5F5',
  blueBright: '#2979FF',
  gold:       '#F5A623',
  goldLight:  '#FFC53D',
  goldDark:   '#E65100',
};

const SIDEBAR_W = 264;

export default function SuperAdminDashboard() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { authData }              = useSelector((s) => s.auth);
  const { companies, schoolsLoading, lastCreated } = useSelector((s) => s.companies);

  const [search,      setSearch]      = useState('');
  const [filterPlan,  setFilterPlan]  = useState('all');
  const [filterStatus,setFilterStatus]= useState('all');
  const [createOpen,  setCreateOpen]  = useState(false);
  const [credOpen,    setCredOpen]    = useState(false);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [snack,       setSnack]       = useState({ open: false, msg: '', severity: 'success' });
  const [showPass,    setShowPass]    = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [toggling,    setToggling]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const [form, setForm] = useState({
    name: '', address: '', contact: '', email: '',
    adminName: '', adminEmail: '', adminPassword: '',
    plan: 'trial', notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { dispatch(fetchAllSchools()); }, [dispatch]);

  useEffect(() => {
    if (lastCreated) { setCreateOpen(false); setCredOpen(true); }
  }, [lastCreated]);

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const schools = (companies || []).filter(c => c.companyId !== 'BEINNOVO-001');

  const filtered = schools.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.companyId?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const matchPlan   = filterPlan   === 'all' || c.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? c.isActive !== false : c.isActive === false);
    return matchSearch && matchPlan && matchStatus;
  });

  const totalActive   = schools.filter(c => c.isActive !== false).length;
  const totalInactive = schools.filter(c => c.isActive === false).length;
  const totalStudents = schools.reduce((s, c) => s + (c.stats?.studentCount || 0), 0);
  const totalUsers    = schools.reduce((s, c) => s + (c.stats?.userCount    || 0), 0);

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name        = 'School name is required';
    if (!form.adminEmail.trim()) e.adminEmail   = 'Admin email is required';
    if (!/\S+@\S+\.\S+/.test(form.adminEmail)) e.adminEmail = 'Invalid email';
    if (!form.adminPassword)     e.adminPassword = 'Password is required';
    if (form.adminPassword.length < 8) e.adminPassword = 'Min 8 characters';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setForm({ name: '', address: '', contact: '', email: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'trial', notes: '' });
    setFormErrors({});
    setShowPass(false);
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    try {
      await dispatch(createSchool(form)).unwrap();
      toast('School created successfully!');
      resetForm();
    } catch (err) {
      toast(err?.message || 'Failed to create school', 'error');
    } finally { setCreating(false); }
  };

  const handleToggle = async (school) => {
    setToggling(school._id);
    try {
      const res = await dispatch(toggleSchool(school._id)).unwrap();
      toast(res.message);
    } catch (err) {
      toast(err?.message || 'Toggle failed', 'error');
    } finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteSchool(deleteTarget._id)).unwrap();
      toast('School deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast(err?.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast('Copied!', 'info'); };

  // ── Reusable copy field for credentials dialog ───────────────────────────────
  const CopyField = ({ label, value, secret }) => {
    const [vis, setVis] = useState(false);
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, mt: 0.5,
          bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'grey.200',
          borderRadius: 2, px: 2, py: 1.2,
        }}>
          <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, color: 'text.primary', letterSpacing: 0.5 }}>
            {secret && !vis ? '•'.repeat(Math.min(value.length, 14)) : value}
          </Typography>
          {secret && (
            <IconButton size="small" onClick={() => setVis(!vis)} sx={{ color: 'text.secondary' }}>
              {vis ? <EyeOffIcon sx={{ fontSize: 16 }} /> : <EyeIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          )}
          <Tooltip title="Copy">
            <IconButton size="small" onClick={() => copyToClipboard(value)} sx={{ color: 'primary.main' }}>
              <CopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  // ── Avatar colour from name ─────────────────────────────────────────────────
  const avatarColor = (name = '') => {
    const palette = ['#2563EB','#7C3AED','#0891B2','#059669','#D97706','#DC2626','#DB2777'];
    return palette[(name.charCodeAt(0) || 0) % palette.length];
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6FB' }}>

      {/* ════════════════════════════════════════════════════════════════════
          LEFT SIDEBAR — Beinnovo Brand
      ════════════════════════════════════════════════════════════════════ */}
      <Box sx={{
        width: SIDEBAR_W, flexShrink: 0,
        background: `linear-gradient(180deg, ${BRAND.navy} 0%, ${BRAND.navyMid} 60%, ${BRAND.navyLight} 100%)`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh', zIndex: 200,
        borderRight: `1px solid ${alpha(BRAND.blue, 0.15)}`,
      }}>
        {/* ── Brand Logo ──────────────────────────────────────────────── */}
        <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BeinnovoLogo size={42} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1, letterSpacing: '-0.02em' }}>Bein</Typography>
                <Typography sx={{ color: BRAND.blueLight, fontWeight: 800, fontSize: '1.2rem', lineHeight: 1, letterSpacing: '-0.02em' }}>novo</Typography>
              </Box>
              <Typography sx={{ color: alpha('#FFFFFF', 0.35), fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, mt: 0.3 }}>
                EIMS Platform
              </Typography>
            </Box>
          </Box>
          {/* Tagline */}
          <Box sx={{ mt: 2, px: 0.5 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              <Box component="span" sx={{ color: alpha('#FFFFFF', 0.55) }}>Innovate. </Box>
              <Box component="span" sx={{ color: BRAND.gold }}>Integrate. </Box>
              <Box component="span" sx={{ color: alpha('#FFFFFF', 0.55) }}>Elevate.</Box>
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: alpha(BRAND.blue, 0.2), mx: 2 }} />

        {/* ── Nav Items ───────────────────────────────────────────────── */}
        <Box sx={{ px: 2, py: 2, flex: 1 }}>
          {[
            { icon: <DashIcon />, label: 'Dashboard', active: true },
            { icon: <SchoolIcon />, label: 'Schools', active: false },
            { icon: <GroupsIcon />, label: 'Users', active: false },
            { icon: <TrendIcon />, label: 'Analytics', active: false },
          ].map((item) => (
            <Box key={item.label} sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2, py: 1.4, borderRadius: 2, mb: 0.5, cursor: 'pointer',
              bgcolor: item.active ? alpha(BRAND.blue, 0.25) : 'transparent',
              borderLeft: item.active ? `3px solid ${BRAND.gold}` : '3px solid transparent',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: alpha('#FFFFFF', 0.05) },
            }}>
              <Box sx={{ color: item.active ? BRAND.blueLight : alpha('#FFFFFF', 0.4), display: 'flex' }}>
                {item.icon}
              </Box>
              <Typography sx={{ color: item.active ? 'white' : alpha('#FFFFFF', 0.5), fontWeight: item.active ? 700 : 500, fontSize: '0.875rem' }}>
                {item.label}
              </Typography>
              {item.active && (
                <Box sx={{ ml: 'auto', px: 1, py: 0.2, borderRadius: 1, bgcolor: alpha(BRAND.gold, 0.15),
                  border: `1px solid ${alpha(BRAND.gold, 0.3)}` }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: BRAND.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: alpha(BRAND.blue, 0.2), mx: 2 }} />

        {/* ── Admin Profile ───────────────────────────────────────────── */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              width: 38, height: 38, fontSize: '0.9rem', fontWeight: 800,
              background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueLight})`,
              border: `2px solid ${alpha(BRAND.gold, 0.4)}`,
              boxShadow: `0 0 0 1px ${alpha(BRAND.gold, 0.2)}`,
            }}>
              {authData?.name?.charAt(0)?.toUpperCase() || 'B'}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {authData?.name || 'Beinnovo Admin'}
              </Typography>
              <Typography sx={{ color: BRAND.gold, fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Super Admin</Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={handleLogout}
                sx={{ color: alpha('#FFFFFF', 0.3), '&:hover': { color: '#F87171', bgcolor: alpha('#F87171', 0.1) }, borderRadius: 1.5 }}>
                <LogoutIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════════ */}
      <Box sx={{ flex: 1, ml: `${SIDEBAR_W}px`, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <Box sx={{
          bgcolor: 'white', borderBottom: '2px solid', borderColor: alpha(BRAND.blue, 0.12),
          px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: `0 2px 12px ${alpha(BRAND.navy, 0.06)}`,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, color: BRAND.navy }}>School Management</Typography>
            <Typography variant="caption" fontWeight={500} sx={{ color: 'text.secondary' }}>
              Manage all schools on the Beinnovo EIMS platform
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Tooltip title="Refresh data">
              <IconButton size="small" onClick={() => dispatch(fetchAllSchools())}
                sx={{ bgcolor: alpha(BRAND.blue, 0.06), color: BRAND.blue, borderRadius: 1.5, '&:hover': { bgcolor: alpha(BRAND.blue, 0.12) } }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={() => { resetForm(); setCreateOpen(true); }}
              sx={{
                borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3,
                background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueBright} 100%)`,
                boxShadow: `0 4px 14px ${alpha(BRAND.blue, 0.4)}`,
                '&:hover': { boxShadow: `0 6px 20px ${alpha(BRAND.blue, 0.5)}` },
              }}
            >
              Add New School
            </Button>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1 }}>

          {/* ── Stats Row ───────────────────────────────────────────────── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {[
              {
                label: 'Total Schools', value: schools.length, sub: 'Registered on platform',
                gradient: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.blue} 100%)`,
                icon: <SchoolIcon sx={{ fontSize: 28 }} />, shadow: alpha(BRAND.blue, 0.4),
                accent: BRAND.gold,
              },
              {
                label: 'Active Schools', value: totalActive, sub: 'Currently operational',
                gradient: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueBright} 100%)`,
                icon: <CheckCircleIcon sx={{ fontSize: 28 }} />, shadow: alpha(BRAND.blue, 0.35),
                accent: BRAND.blueLight,
              },
              {
                label: 'Total Students', value: totalStudents, sub: 'Across all schools',
                gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
                icon: <GroupsIcon sx={{ fontSize: 28 }} />, shadow: alpha(BRAND.gold, 0.4),
                accent: BRAND.goldLight,
              },
              {
                label: 'Staff Members', value: totalUsers, sub: 'Admins & teachers',
                gradient: `linear-gradient(135deg, ${BRAND.navyMid} 0%, ${BRAND.navyLight} 50%, ${BRAND.blue} 100%)`,
                icon: <AdminIcon sx={{ fontSize: 28 }} />, shadow: alpha(BRAND.navy, 0.5),
                accent: BRAND.blueLight,
              },
            ].map((s) => (
              <Grid item xs={6} lg={3} key={s.label}>
                <Box sx={{
                  background: s.gradient, borderRadius: 3, p: 2.5,
                  boxShadow: `0 8px 24px ${s.shadow}`,
                  position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}>
                  <Box sx={{
                    position: 'absolute', right: -10, top: -10,
                    width: 80, height: 80, borderRadius: '50%',
                    bgcolor: alpha('#FFFFFF', 0.1),
                  }} />
                  <Box sx={{ color: alpha('#FFFFFF', 0.85), mb: 1.5 }}>{s.icon}</Box>
                  <Typography variant="h3" fontWeight={800} sx={{ color: 'white', lineHeight: 1, mb: 0.5 }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{ color: alpha('#FFFFFF', 0.9), fontWeight: 700, fontSize: '0.875rem' }}>
                    {s.label}
                  </Typography>
                  <Typography sx={{ color: alpha('#FFFFFF', 0.6), fontSize: '0.72rem', mt: 0.3 }}>
                    {s.sub}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <Box sx={{
            display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center',
            bgcolor: 'white', p: 2, borderRadius: 3, border: '1px solid', borderColor: 'grey.200',
          }}>
            <TextField
              placeholder="Search by name, ID or email..."
              size="small" value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                sx: { borderRadius: 2 },
              }}
            />
            <TextField select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 140 }} label="Status" InputProps={{ sx: { borderRadius: 2 } }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">✅ Active</MenuItem>
              <MenuItem value="inactive">❌ Inactive</MenuItem>
            </TextField>
            <TextField select size="small" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
              sx={{ minWidth: 140 }} label="Plan" InputProps={{ sx: { borderRadius: 2 } }}>
              <MenuItem value="all">All Plans</MenuItem>
              {PLANS.map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {filtered.length} of {schools.length} schools
            </Typography>
          </Box>

          {/* ── Schools Table ────────────────────────────────────────────── */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 3, overflow: 'hidden' }}>
            {schoolsLoading && <LinearProgress sx={{ height: 3 }} />}

            {!schoolsLoading && filtered.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: '50%', bgcolor: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                }}>
                  <SchoolIcon sx={{ fontSize: 36, color: '#2563EB', opacity: 0.5 }} />
                </Box>
                <Typography variant="h6" fontWeight={700} color="text.secondary">No schools found</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                  {schools.length === 0 ? 'Click "Add New School" to get started.' : 'Try adjusting your search or filters.'}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      {['School', 'School ID', 'Students', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                        <TableCell key={h} sx={{
                          fontWeight: 700, fontSize: '0.72rem', color: '#64748B',
                          textTransform: 'uppercase', letterSpacing: 0.8, py: 1.8,
                          borderBottom: '2px solid', borderColor: 'grey.200',
                        }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((school, idx) => {
                      const ac = avatarColor(school.name);
                      const isActive = school.isActive !== false;
                      const pm = PLAN_META[school.plan] || PLAN_META.trial;
                      return (
                        <TableRow key={school._id} sx={{
                          '&:last-child td': { border: 0 },
                          bgcolor: idx % 2 === 0 ? 'white' : '#FAFBFC',
                          '&:hover': { bgcolor: '#EFF6FF' },
                          transition: 'background 0.15s',
                        }}>
                          {/* School name */}
                          <TableCell sx={{ py: 2.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{
                                width: 40, height: 40, fontSize: '1rem', fontWeight: 800,
                                bgcolor: alpha(ac, 0.12), color: ac,
                                border: `1.5px solid ${alpha(ac, 0.25)}`,
                              }}>
                                {school.name?.charAt(0)?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                                  {school.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                  {school.email || school.contact || '—'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* School ID */}
                          <TableCell>
                            <Box sx={{
                              display: 'inline-flex', alignItems: 'center', gap: 0.5,
                              bgcolor: '#EFF6FF', px: 1.5, py: 0.5, borderRadius: 1.5,
                              border: '1px solid', borderColor: '#BFDBFE',
                            }}>
                              <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: '#1D4ED8' }}>
                                {school.companyId}
                              </Typography>
                              <Tooltip title="Copy ID">
                                <IconButton size="small" onClick={() => copyToClipboard(school.companyId)}
                                  sx={{ p: 0.2, color: '#93C5FD', '&:hover': { color: '#2563EB' } }}>
                                  <CopyIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>

                          {/* Students */}
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={`${school.stats?.studentCount ?? 0} students`}
                                size="small"
                                sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 700, fontSize: '0.72rem', border: 'none' }}
                              />
                              <Chip
                                label={`${school.stats?.userCount ?? 0} staff`}
                                size="small"
                                sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: '0.72rem', border: 'none' }}
                              />
                            </Stack>
                          </TableCell>

                          {/* Plan */}
                          <TableCell>
                            <Box sx={{
                              display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 1.5,
                              bgcolor: pm.bg, border: `1px solid ${alpha(pm.color, 0.25)}`,
                            }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: pm.color }}>
                                {pm.label}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Box sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                bgcolor: isActive ? '#22C55E' : '#EF4444',
                                boxShadow: isActive ? '0 0 0 3px rgba(34,197,94,0.2)' : '0 0 0 3px rgba(239,68,68,0.2)',
                              }} />
                              <Typography variant="body2" fontWeight={600}
                                sx={{ color: isActive ? '#15803D' : '#B91C1C' }}>
                                {isActive ? 'Active' : 'Inactive'}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              {school.createdAt
                                ? new Date(school.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'}
                            </Typography>
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title={isActive ? 'Deactivate School' : 'Activate School'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggle(school)}
                                    disabled={toggling === school._id}
                                    sx={{
                                      bgcolor: isActive ? alpha('#22C55E', 0.1) : alpha('#6B7280', 0.1),
                                      color: isActive ? '#16A34A' : '#6B7280',
                                      borderRadius: 1.5,
                                      '&:hover': { bgcolor: isActive ? alpha('#22C55E', 0.2) : alpha('#6B7280', 0.2) },
                                    }}
                                  >
                                    {toggling === school._id
                                      ? <CircularProgress size={16} color="inherit" />
                                      : <PowerIcon sx={{ fontSize: 18 }} />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete School">
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteTarget(school)}
                                  sx={{
                                    bgcolor: alpha('#EF4444', 0.08), color: '#EF4444', borderRadius: 1.5,
                                    '&:hover': { bgcolor: alpha('#EF4444', 0.15) },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          CREATE SCHOOL DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

        {/* Dialog Header */}
        <Box sx={{
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.blue} 100%)`,
          px: 3, py: 3,
          borderBottom: `3px solid ${BRAND.gold}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BeinnovoLogo size={42} />
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: 'white', lineHeight: 1 }}>
                Add New School
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                Fill in the details to provision a new school account
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3, py: 3, bgcolor: '#FAFBFC' }}>

          {/* Section: School Info */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BusinessIcon sx={{ fontSize: 14, color: '#2563EB' }} />
              </Box>
              <Typography variant="body2" fontWeight={800} sx={{ color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.72rem' }}>
                School Details
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="School Name *" size="small" value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  error={!!formErrors.name} helperText={formErrors.name}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Contact / Phone" size="small" value={form.contact}
                  onChange={(e) => setForm(f => ({ ...f, contact: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="School Email" size="small" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" size="small" value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Plan" size="small" value={form.plan}
                  onChange={(e) => setForm(f => ({ ...f, plan: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }}>
                  {PLANS.map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Internal Notes" size="small" value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Section: Admin Account */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AdminIcon sx={{ fontSize: 14, color: '#7C3AED' }} />
              </Box>
              <Typography variant="body2" fontWeight={800} sx={{ color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.72rem' }}>
                Admin Account
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Admin Full Name" size="small" value={form.adminName}
                  onChange={(e) => setForm(f => ({ ...f, adminName: e.target.value }))}
                  placeholder={form.name ? `${form.name} Admin` : 'School Admin'}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Admin Email *" size="small" value={form.adminEmail}
                  onChange={(e) => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                  error={!!formErrors.adminEmail} helperText={formErrors.adminEmail}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Admin Password *" size="small"
                  type={showPass ? 'text' : 'password'}
                  value={form.adminPassword}
                  onChange={(e) => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                  error={!!formErrors.adminPassword} helperText={formErrors.adminPassword}
                  InputProps={{
                    sx: { borderRadius: 2, bgcolor: 'white' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Auto-generate strong password">
                          <IconButton size="small" onClick={() => { const p = generatePassword(); setForm(f => ({ ...f, adminPassword: p })); setShowPass(true); }}
                            sx={{ color: '#7C3AED' }}>
                            <AutoIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => setShowPass(!showPass)} sx={{ color: 'text.secondary' }}>
                          {showPass ? <EyeOffIcon sx={{ fontSize: 18 }} /> : <EyeIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'white', gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}
            sx={{
              textTransform: 'none', fontWeight: 700, px: 4, borderRadius: 2,
              background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueBright} 100%)`,
              boxShadow: `0 4px 14px ${alpha(BRAND.blue, 0.4)}`,
            }}>
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create School →'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          CREDENTIALS DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={credOpen} onClose={() => { setCredOpen(false); dispatch(clearLastCreated()); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

        <Box sx={{
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.blue} 100%)`,
          px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: `3px solid ${BRAND.gold}`,
        }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha('#FFFFFF', 0.2),
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'white', lineHeight: 1 }}>
              School Created Successfully!
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.75) }}>
              Share these login credentials with the school administrator
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3, py: 3, bgcolor: '#FAFBFC' }}>
          <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
            ⚠️ <strong>Save now!</strong> The password cannot be retrieved again after closing this dialog.
          </Alert>

          {lastCreated && (
            <Box>
              <CopyField label="School Name"         value={lastCreated.company?.name || ''} />
              <CopyField label="School ID (for login)" value={lastCreated.credentials?.schoolId || ''} />
              <CopyField label="Admin Email"          value={lastCreated.credentials?.adminEmail || ''} />
              <CopyField label="Admin Password"       value={lastCreated.credentials?.adminPassword || ''} secret />

              <Box sx={{ mt: 2.5, p: 2, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600, lineHeight: 1.6 }}>
                  💡 <strong>How to share:</strong> Send the School ID, Admin Email, and Password to the school. The admin logs in at the same login page using their email + School ID + password.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'white' }}>
          <Button variant="contained" onClick={() => { setCredOpen(false); dispatch(clearLastCreated()); }}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4,
              background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueBright})`,
              boxShadow: `0 4px 14px ${alpha(BRAND.blue, 0.4)}`,
            }}>
            Done — Credentials Saved ✓
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ bgcolor: '#FEF2F2', px: 3, py: 2.5, borderBottom: '1px solid', borderColor: '#FECACA' }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#DC2626' }}>Delete School</Typography>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: '#DC2626' }}>{deleteTarget?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            All staff accounts for this school will be removed. Student records are preserved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
          onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
