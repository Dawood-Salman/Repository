import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../redux/authSlice';
import * as api from '../services/api';
import moment from 'moment';
import { io as ioClient } from 'socket.io-client';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  MenuItem,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Home as HomeIcon,
  Payment as FeesIcon,
  CalendarMonth as AttendanceIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutline as CheckIcon,
  ReceiptLong as ReceiptIcon,
  FamilyRestroom as GuardianIcon,
  LocalHospital as MedicalIcon,
  AccessTime as LateIcon,
  Article as DiaryIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const StudentDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Active Tab: 0=Home, 1=Fees, 2=Attendance, 3=Diary, 4=Notifications, 5=Profile
  const [activeTab, setActiveTab] = useState(0);

  // States for data
  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendance: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Pagination for attendance
  const [attendancePage, setAttendancePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Editable Profile fields
  const [profileForm, setProfileForm] = useState({
    contact: '',
    address: '',
    emergencyContact: '',
    guardianInfo: ''
  });
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [studentNotifications, setStudentNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [updateAlert, setUpdateAlert] = useState({ open: false, type: 'notification', message: '' });
  const knownNotificationIds = useRef(new Set());
  const knownDiaryIds = useRef(new Set());
  const initialDataLoaded = useRef(false);
  const socketRef = useRef(null);

  // Fetch initial profile
  const fetchProfile = async () => {
    try {
      const { data } = await api.getStudentProfile();
      setProfile(data);
      setProfileForm({
        contact: data.contact || '',
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        guardianInfo: data.guardianInfo || ''
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile details');
    }
  };

  // Fetch fees
  const fetchFees = async () => {
    try {
      const { data } = await api.getStudentFees();
      setFees(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fee information');
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    try {
      const params = {
        page: attendancePage + 1,
        limit: rowsPerPage,
        ...(selectedMonth && { month: selectedMonth }),
        ...(selectedYear && { year: selectedYear })
      };
      const { data } = await api.getStudentAttendance(params);
      setAttendanceData(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance logs');
    }
  };

  const handleNotificationRead = async (notificationId) => {
    try {
      await api.markStudentNotificationRead(notificationId);
      setStudentNotifications((prev) => prev.map((notification) => (
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      )));
    } catch (err) {
      console.error(err);
      toast.error('Unable to mark notification as read');
    }
  };

  const showUpdateAlert = (type, count) => {
    const label = type === 'notification' ? 'notification' : 'diary entry';
    setUpdateAlert({
      open: true,
      type,
      message: `You have ${count} new ${label}${count > 1 ? 's' : ''}.`,
    });
  };

  const handleAlertClose = () => {
    setUpdateAlert((prev) => ({ ...prev, open: false }));
  };

  const fetchDiaryEntries = async (showAlert = false) => {
    try {
      if (!showAlert) setDiaryLoading(true);
      const { data } = await api.fetchStudentDiary();
      setDiaryEntries(data);
      const fetchedIds = new Set(data.map((entry) => entry._id));
      if (initialDataLoaded.current && showAlert) {
        const newItems = data.filter((entry) => !knownDiaryIds.current.has(entry._id));
        if (newItems.length > 0) {
          showUpdateAlert('diary', newItems.length);
        }
      }
      knownDiaryIds.current = fetchedIds;
    } catch (err) {
      console.error(err);
      if (!showAlert) toast.error('Failed to load diary entries');
    } finally {
      if (!showAlert) setDiaryLoading(false);
    }
  };

  const fetchNotifications = async (showAlert = false) => {
    try {
      if (!showAlert) setNotificationsLoading(true);
      const { data } = await api.fetchStudentNotifications();
      setStudentNotifications(data);
      const fetchedIds = new Set(data.map((notification) => notification._id));
      if (initialDataLoaded.current && showAlert) {
        const newItems = data.filter((notification) => !knownNotificationIds.current.has(notification._id));
        if (newItems.length > 0) {
          showUpdateAlert('notification', newItems.length);
        }
      }
      knownNotificationIds.current = fetchedIds;
    } catch (err) {
      console.error(err);
      if (!showAlert) toast.error('Failed to load notifications');
    } finally {
      if (!showAlert) setNotificationsLoading(false);
    }
  };

  // Setup Socket.IO client to receive real-time updates
  useEffect(() => {
    if (!profile) return;
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.origin.replace(/^http/, 'ws'));
      const socket = ioClient(socketUrl, { transports: ['websocket'] });
      socketRef.current = socket;
      const companyRoom = `company:${profile.company?._id || profile.company}`;
      const studentRoom = `student:${profile._id}`;
      socket.on('connect', () => {
        socket.emit('join', companyRoom);
        socket.emit('join', studentRoom);
        if (profile.group?._id) socket.emit('join', `group:${profile.group._id}`);
      });

      socket.on('notification:new', (payload) => {
        setStudentNotifications((prev) => [payload, ...prev]);
        setUpdateAlert({ open: true, type: 'notification', message: payload.title || 'New notification' });
      });

      socket.on('diary:new', (payload) => {
        setDiaryEntries((prev) => [payload, ...prev]);
        setUpdateAlert({ open: true, type: 'diary', message: payload.title || 'New diary entry' });
      });

      return () => {
        try { socket.disconnect(); } catch (e) {}
        socketRef.current = null;
      };
    } catch (e) {
      console.warn('Socket init failed', e.message);
    }
  }, [profile]);

  // Load everything on start
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchFees(), fetchAttendance(), fetchDiaryEntries(), fetchNotifications()]);
      initialDataLoaded.current = true;
      setLoading(false);
    };
    loadAllData();
  }, []);

  // Reload attendance when filter changes
  useEffect(() => {
    if (!loading) {
      fetchAttendance();
    }
  }, [attendancePage, rowsPerPage, selectedMonth, selectedYear]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (initialDataLoaded.current) {
        fetchDiaryEntries(true);
        fetchNotifications(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle Logout
  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Handle profile edit save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const { data } = await api.updateStudentProfile(profileForm);
      setProfile(data);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Summary Metrics
  const nextDueFee = React.useMemo(() => {
    const pendingFees = fees.filter((fee) => fee.status !== 'paid');
    if (pendingFees.length === 0) return null;
    return pendingFees.reduce((closest, fee) => {
      const dueDate = new Date(fee.dueDate || fee.billingDate || fee.date);
      if (!closest) return fee;
      const closestDue = new Date(closest.dueDate || closest.billingDate || closest.date);
      return dueDate < closestDue ? fee : closest;
    }, null);
  }, [fees]);

  const getSummaryMetrics = () => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    fees.forEach((fee) => {
      totalBilled += fee.totalAmount || 0;
      totalPaid += fee.paidAmount || 0;
      const outstanding = fee.outstanding != null
        ? fee.outstanding
        : (fee.totalAmount || 0) - (fee.paidAmount || 0) - (fee.discountAmount || 0);
      totalOutstanding += outstanding;
    });

    const presentLogs = attendanceData.attendance.filter((a) => a.status === 'Present').length;
    const totalLogsFetched = attendanceData.attendance.length;
    const calculatedRate = totalLogsFetched > 0 ? Math.round((presentLogs / totalLogsFetched) * 100) : 0;

    return {
      totalBilled,
      totalPaid,
      totalOutstanding: Math.max(0, totalOutstanding),
      attendanceRate: calculatedRate,
    };
  };

  const metrics = getSummaryMetrics();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', px: 2 }}>
        <CircularProgress size={50} thickness={4.5} color="primary" />
      </Box>
    );
  }

  // Common Header component for both Laptop & Mobile
  const renderHeader = () => (
    <Box 
      sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: '#FFFFFF',
        pt: { xs: 4, md: 5 },
        pb: { xs: 6, md: 5 },
        px: { xs: 2, md: 4 },
        borderRadius: { xs: '0 0 28px 28px', md: '0 0 24px 24px' },
        boxShadow: theme.shadows[6],
        mb: { xs: 3, md: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            sx={{ 
              width: { xs: 50, md: 64 }, 
              height: { xs: 50, md: 64 }, 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              border: '2px solid rgba(255,255,255,0.4)'
            }}
          >
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
          </Avatar>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h4'} fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
              {profile?.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
              <SchoolIcon sx={{ fontSize: 16 }} />
              Student ID: {profile?.studentId || '—'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleLogout} sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
          <LogoutIcon />
        </IconButton>
      </Box>

      {/* Show school title if present */}
      {profile?.company?.name && (
        <Box sx={{ mt: 2, display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.15)' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
            {profile.company.name.toUpperCase()}
          </Typography>
        </Box>
      )}

      {nextDueFee && (
        <Box sx={{ mt: 3, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <Card sx={{ bgcolor: alpha(theme.palette.common.white, 0.12), border: `1px solid ${alpha(theme.palette.common.white, 0.18)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="common.white" sx={{ opacity: 0.82, letterSpacing: 1 }}>Next due payment</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 1, color: '#FFFFFF' }}>
                Rs. {nextDueFee.outstanding?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(255,255,255,0.85)' }}>
                {nextDueFee.feeName || nextDueFee.items?.[0]?.description || 'Upcoming fee'} due on {moment(nextDueFee.dueDate || nextDueFee.date).format('DD MMM YYYY')}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: alpha(theme.palette.common.white, 0.12), border: `1px solid ${alpha(theme.palette.common.white, 0.18)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="common.white" sx={{ opacity: 0.82, letterSpacing: 1 }}>Balance summary</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 1, color: '#FFFFFF' }}>
                {metrics.attendanceRate}% attendance
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(255,255,255,0.85)' }}>
                {fees.length} invoice{fees.length === 1 ? '' : 's'} tracked
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Desktop Tabs */}
      {!isMobile && (
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ 
            mt: 4, 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            '.MuiTab-root': { fontWeight: 600, px: 3, pt: 2, pb: 1, minWidth: 'auto', textTransform: 'none' }
          }}
        >
          <Tab icon={<HomeIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Dashboard" />
          <Tab icon={<FeesIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Fees Ledger" />
          <Tab icon={<AttendanceIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Attendance" />
          <Tab icon={<DiaryIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Diary" />
          <Tab icon={<NotificationsIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Notifications" />
          <Tab icon={<ProfileIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Profile Settings" />
        </Tabs>
      )}
    </Box>
  );

  // Tab 0: Overview / Home Dashboard
  const renderHomeTab = () => (
    <Grid container spacing={2}>
      {/* Metrics Row */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>OUTSTANDING</Typography>
                <Typography variant="h5" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>
                  Rs. {metrics.totalOutstanding.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>PAID TO DATE</Typography>
                <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                  Rs. {metrics.totalPaid.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.info.main}` }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ATTENDANCE RATE</Typography>
                <Typography variant="h5" fontWeight={800} color="info.main" sx={{ mt: 0.5 }}>
                  {metrics.attendanceRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>CLASS / GROUP</Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.group?.name || '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Profile Details Snapshot */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SchoolIcon color="primary" />
              Academic Profile
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">GENDER</Typography>
                <Typography variant="subtitle2" color="text.primary">{profile?.gender || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">DATE OF BIRTH</Typography>
                <Typography variant="subtitle2" color="text.primary">
                  {profile?.dateOfBirth ? moment(profile.dateOfBirth).format('DD MMM YYYY') : '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">ACADEMIC LEVEL</Typography>
                <Typography variant="subtitle2" color="text.primary">{profile?.group?.level || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">GROUP CODE</Typography>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                  {profile?.group?.code || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">STUDENT EMAIL</Typography>
                <Typography variant="subtitle2" color="text.primary">{profile?.email || '—'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Attendance / Announcements Card */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AttendanceIcon color="primary" />
              Recent Attendance logs
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {attendanceData.attendance.length > 0 ? (
              <List sx={{ p: 0 }}>
                {attendanceData.attendance.slice(0, 4).map((log) => (
                  <ListItem 
                    key={log._id} 
                    divider
                    secondaryAction={
                      <Chip 
                        label={log.status} 
                        size="small" 
                        color={
                          log.status === 'Present' ? 'success' : 
                          log.status === 'Absent' ? 'error' : 
                          log.status === 'Late' ? 'warning' : 'default'
                        }
                        sx={{ borderRadius: 1, fontWeight: 700 }}
                      />
                    }
                    sx={{ px: 0, py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {log.status === 'Present' ? <CheckIcon color="success" /> : 
                       log.status === 'Absent' ? <WarningIcon color="error" /> : 
                       <LateIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={moment(log.date).format('dddd, DD MMM YYYY')} 
                      secondary={log.remarks || 'No remarks'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <Typography variant="body2" color="text.secondary">No attendance logs logged yet.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 1: Fees Ledger
  const renderFeesTab = () => {
    if (isMobile) {
      return (
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
            Invoices & Payment Records
          </Typography>
          {fees.length > 0 ? (
            fees.map((fee) => {
              const balance = fee.outstanding != null
                ? fee.outstanding
                : (fee.totalAmount || 0) - (fee.paidAmount || 0) - (fee.discountAmount || 0);
              return (
                <Card key={fee._id} sx={{ position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: 4,
                      bgcolor:
                        fee.status === 'paid' ? 'success.main' :
                        fee.status === 'unpaid' ? 'error.main' : 'warning.main',
                    }}
                  />
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {fee.feeName || fee.items?.[0]?.description || 'Tuition Fee'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due: {moment(fee.dueDate || fee.date).format('DD MMM YYYY')}
                        </Typography>
                      </Box>
                      <Chip
                        label={(fee.status || 'pending').toUpperCase()}
                        size="small"
                        color={
                          fee.status === 'paid' ? 'success' :
                          fee.status === 'unpaid' ? 'error' : 'warning'
                        }
                        sx={{ borderRadius: 1, fontWeight: 700 }}
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">BILLED</Typography>
                        <Typography variant="subtitle2" fontWeight={600}>Rs. {fee.totalAmount?.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">PAID</Typography>
                        <Typography variant="subtitle2" fontWeight={600} color="success.main">Rs. {fee.paidAmount?.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">DUE</Typography>
                        <Typography variant="subtitle2" fontWeight={700} color={balance > 0 ? 'error.main' : 'success.main'}>
                          Rs. {balance?.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No invoices available.</Typography>
            </Paper>
          )}
        </Box>
      );
    }

    return (
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fee Category</TableCell>
                  <TableCell>Billing Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Billed Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Due Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.length > 0 ? (
                  fees.map((fee) => {
                    const outstanding = fee.outstanding != null
                      ? fee.outstanding
                      : (fee.totalAmount || 0) - (fee.paidAmount || 0) - (fee.discountAmount || 0);
                    return (
                      <TableRow key={fee._id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{fee.feeName || fee.items?.[0]?.description || 'Tuition Fee'}</TableCell>
                        <TableCell>{fee.billingDate ? moment(fee.billingDate).format('DD MMM YYYY') : '—'}</TableCell>
                        <TableCell>{moment(fee.dueDate || fee.date).format('DD MMM YYYY')}</TableCell>
                        <TableCell>Rs. {fee.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>Rs. {fee.paidAmount?.toLocaleString()}</TableCell>
                        <TableCell>Rs. {fee.discountAmount?.toLocaleString() || 0}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: outstanding > 0 ? 'error.main' : 'success.main' }}>
                          Rs. {outstanding?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(fee.status || 'pending').toUpperCase()}
                            size="small"
                            color={
                              fee.status === 'paid' ? 'success' :
                              fee.status === 'unpaid' ? 'error' : 'warning'
                            }
                            sx={{ borderRadius: 1 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <ReceiptIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No invoices available.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Tab 2: Attendance tracker
  const renderAttendanceTab = () => {
    const handlePageChange = (event, newPage) => {
      setAttendancePage(newPage);
    };

    const months = [
      { val: 1, label: 'January' }, { val: 2, label: 'February' }, { val: 3, label: 'March' },
      { val: 4, label: 'April' }, { val: 5, label: 'May' }, { val: 6, label: 'June' },
      { val: 7, label: 'July' }, { val: 8, label: 'August' }, { val: 9, label: 'September' },
      { val: 10, label: 'October' }, { val: 11, label: 'November' }, { val: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 4 }, (v, i) => currentYear - i);

    return (
      <Grid container spacing={2}>
        {/* Quick Filter Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Month"
                    value={selectedMonth}
                    onChange={(e) => { setSelectedMonth(e.target.value); setAttendancePage(0); }}
                  >
                    <MenuItem value="">All Months</MenuItem>
                    {months.map(m => (
                      <MenuItem key={m.val} value={m.val}>{m.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Year"
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setAttendancePage(0); }}
                  >
                    <MenuItem value="">All Years</MenuItem>
                    {years.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {(selectedMonth || selectedYear) && (
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="outlined" 
                      onClick={() => { setSelectedMonth(''); setSelectedYear(''); setAttendancePage(0); }}
                      fullWidth
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed logs */}
        <Grid item xs={12}>
          {isMobile ? (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {attendanceData.attendance.length > 0 ? (
                attendanceData.attendance.map((log) => (
                  <Card key={log._id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {moment(log.date).format('dddd, DD MMM YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remarks: {log.remarks || 'No remarks'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={log.status} 
                      size="small"
                      color={
                        log.status === 'Present' ? 'success' : 
                        log.status === 'Absent' ? 'error' : 
                        log.status === 'Late' ? 'warning' : 'default'
                      }
                      sx={{ borderRadius: 1, fontWeight: 700 }}
                    />
                  </Card>
                ))
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">No attendance logs found matching filters.</Typography>
                </Paper>
              )}
            </Box>
          ) : (
            <Card>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData.attendance.length > 0 ? (
                        attendanceData.attendance.map((log) => (
                          <TableRow key={log._id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{moment(log.date).format('dddd, DD MMM YYYY')}</TableCell>
                            <TableCell>
                              <Chip 
                                label={log.status} 
                                size="small"
                                color={
                                  log.status === 'Present' ? 'success' : 
                                  log.status === 'Absent' ? 'error' : 
                                  log.status === 'Late' ? 'warning' : 'default'
                                }
                                sx={{ borderRadius: 1, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>{log.remarks || '—'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                            <Typography variant="body2" color="text.secondary">No attendance logs found matching filters.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {attendanceData.total > 0 && (
            <TablePagination
              component="div"
              count={attendanceData.total}
              page={attendancePage}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setAttendancePage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          )}
        </Grid>
      </Grid>
    );
  };

  // Tab 3: Diary
  const renderDiaryTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DiaryIcon color="primary" />
                  Class Diary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: { xs: '100%', md: '70%' } }}>
                  Only notes shared by your teacher will appear here. This view is read-only so you can focus on daily class updates and homework messages.
                </Typography>
              </Box>
              <Chip
                label={profile?.group?.name ? `Group: ${profile.group.name}` : 'Teacher updates'}
                color="secondary"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            {diaryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : diaryEntries.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No teacher diary entries are available yet. Check back later for class updates.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {diaryEntries.map((entry) => (
                  <ListItem
                    key={entry._id}
                    alignItems="flex-start"
                    sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {entry.title}
                        </Typography>
                        <Chip
                          label={entry.group ? entry.group.name : 'All students'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {entry.teacher?.name ? `By ${entry.teacher.name}` : 'Teacher update'} • {moment(entry.entryDate).format('DD MMM YYYY')}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 1, whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                        {entry.content}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 4: Notifications
  const renderNotificationsTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" />
                  Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Messages sent by school administration and your class teacher.
                </Typography>
              </Box>
            </Box>

            {notificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : studentNotifications.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications yet. Check back later for announcements.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {studentNotifications.map((notification) => (
                  <ListItem key={notification._id} alignItems="flex-start" sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {notification.title}
                        </Typography>
                        <Chip label={notification.isRead ? 'Read' : 'New'} size="small" color={notification.isRead ? 'default' : 'secondary'} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {notification.targetLabel} • {moment(notification.createdAt).fromNow()}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                        {notification.message}
                      </Typography>
                    </Box>
                    {!notification.isRead && (
                      <Button size="small" variant="outlined" onClick={() => handleNotificationRead(notification._id)}>
                        Mark read
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 5: Profile Settings
  const renderProfileTab = () => (
    <Grid container spacing={2}>
      {/* Left side info cards */}
      <Grid item xs={12} md={4}>
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 72, 
                height: 72, 
                mx: 'auto', 
                mb: 2, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontSize: '1.75rem',
                fontWeight: 700
              }}
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </Avatar>
            <Typography variant="h6" fontWeight={800}>{profile?.name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              ID: {profile?.studentId}
            </Typography>
            <Chip 
              label={profile?.status || 'Active'} 
              size="small" 
              color="success" 
              sx={{ mt: 1, fontWeight: 700, borderRadius: 1 }} 
            />
          </CardContent>
        </Card>

        {/* Guardian and Emergency Snapshot */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <GuardianIcon color="primary" sx={{ fontSize: 18 }} />
              Guardian Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">FATHER'S NAME</Typography>
                <Typography variant="body2" fontWeight={600}>{profile?.fatherName || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">MOTHER'S NAME</Typography>
                <Typography variant="body2" fontWeight={600}>{profile?.motherName || '—'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Right side editable form */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EditIcon color="primary" />
              Update Contact Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <form onSubmit={handleProfileSave}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    value={profileForm.contact}
                    onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
                    InputProps={{
                      startAdornment: <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact"
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    InputProps={{
                      startAdornment: <MedicalIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Guardian Information (Name/Contact)"
                    value={profileForm.guardianInfo}
                    onChange={(e) => setProfileForm({ ...profileForm, guardianInfo: e.target.value })}
                    InputProps={{
                      startAdornment: <GuardianIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Residential Address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    InputProps={{
                      startAdornment: <LocationIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, mt: 1 }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={updatingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={updatingProfile}
                    sx={{ px: 4, py: 1, borderRadius: 2 }}
                  >
                    {updatingProfile ? 'Saving...' : 'Save Profile'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Main UI render with conditional layouts
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 4 } }}>
      {/* Mobile Top Bar */}
      {isMobile && (
        <Box 
          sx={{ 
            px: 2, 
            py: 1.5, 
            bgcolor: 'primary.main', 
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: theme.shadows[1]
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
            Beinnovo EIMS
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar 
              sx={{ 
                width: 28, 
                height: 28, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </Avatar>
            <IconButton onClick={handleLogout} size="small" sx={{ color: '#FFFFFF' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Main Container */}
      <Container maxWidth="md" sx={{ pt: { xs: 3.5, md: 4 }, px: { xs: 1.5, md: 2 } }}>
        
        {/* Render the Header component */}
        {renderHeader()}

        {/* Tab content wrapper */}
        <Box sx={{ mt: { xs: 3, md: 2 } }}>
          {activeTab === 0 && renderHomeTab()}
          {activeTab === 1 && renderFeesTab()}
          {activeTab === 2 && renderAttendanceTab()}
          {activeTab === 3 && renderDiaryTab()}
          {activeTab === 4 && renderNotificationsTab()}
          {activeTab === 5 && renderProfileTab()}
        </Box>
      </Container>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000, 
            borderRadius: 0,
            borderTop: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 -8px 24px rgba(0,0,0,0.14)',
            px: 1,
            pb: 1,
          }} 
          elevation={4}
        >
          <BottomNavigation
            showLabels={false}
            value={activeTab}
            onChange={(event, newValue) => {
              setActiveTab(newValue);
            }}
            sx={{ height: 66, minHeight: 66 }}
          >
            <BottomNavigationAction sx={{ minWidth: 0, flex: 1 }} label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction sx={{ minWidth: 0, flex: 1 }} label="Fees" icon={<FeesIcon />} />
            <BottomNavigationAction sx={{ minWidth: 0, flex: 1 }} label="Attendance" icon={<AttendanceIcon />} />
            <BottomNavigationAction sx={{ minWidth: 0, flex: 1 }} label="Diary" icon={<DiaryIcon />} />
            <BottomNavigationAction sx={{ minWidth: 0, flex: 1 }} label="Alerts" icon={<NotificationsIcon />} />
            <BottomNavigationAction sx={{ minWidth: 0, flex: 1 }} label="Profile" icon={<ProfileIcon />} />
          </BottomNavigation>
        </Paper>
      )}
      <Snackbar
        open={updateAlert.open}
        autoHideDuration={8000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity="info"
          sx={{ width: '100%', cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(updateAlert.type === 'diary' ? 3 : 4);
            handleAlertClose();
          }}
        >
          {updateAlert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDashboard;
