import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../redux/authSlice';
import * as api from '../services/api';
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
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  
  alpha,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  School as ClassesIcon,
  CalendarMonth as AttendanceIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  AttachMoney as SalaryIcon,
  Book as DiaryIcon,

} from '@mui/icons-material';

const TeacherDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { authData } = useSelector((state) => state.auth);

  // Active Tab: 0=Home, 1=Classes, 2=Attendance, 3=Salary, 4=Profile
  const [activeTab, setActiveTab] = useState(0);

  // States for data
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getTeacherProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const renderHomeTab = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Welcome, {profile?.name || 'Teacher'}!
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ClassesIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Classes</Typography>
                  <Typography variant="body2" color="text.secondary">View your assigned classes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AttendanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Attendance</Typography>
                  <Typography variant="body2" color="text.secondary">Mark student attendance</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <DiaryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Diary</Typography>
                  <Typography variant="body2" color="text.secondary">Class diary entries</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <SalaryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Salary</Typography>
                  <Typography variant="body2" color="text.secondary">View salary details</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderClassesTab = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        My Classes
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Your assigned classes will appear here.
        </Typography>
      </Paper>
    </Box>
  );

  const renderAttendanceTab = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Mark Attendance
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Attendance marking interface will appear here.
        </Typography>
      </Paper>
    </Box>
  );

  const renderSalaryTab = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Salary Information
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Your salary details will appear here.
        </Typography>
      </Paper>
    </Box>
  );

  const renderProfileTab = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        My Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : profile ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 48 }}>
                {profile.name?.[0]?.toUpperCase() || 'T'}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{profile.name}</Typography>
              <Chip label="Teacher" color="primary" size="small" />
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{profile.email || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                  <Typography variant="body1">{profile.contact || '—'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{profile.address || '—'}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No profile data available.
          </Typography>
        )}
      </Paper>
    </Box>
  );

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Paper
          sx={{
            width: 280,
            position: 'fixed',
            height: '100vh',
            borderRight: `1px solid ${theme.palette.divider}`,
            zIndex: 1000,
          }}
          elevation={0}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} color="primary">
              Teacher Portal
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ py: 2 }}>
            <Button
              fullWidth
              startIcon={<HomeIcon />}
              onClick={() => setActiveTab(0)}
              sx={{
                justifyContent: 'flex-start',
                px: 3,
                py: 2,
                bgcolor: activeTab === 0 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: activeTab === 0 ? 'primary.main' : 'text.primary',
              }}
            >
              Home
            </Button>
            <Button
              fullWidth
              startIcon={<ClassesIcon />}
              onClick={() => setActiveTab(1)}
              sx={{
                justifyContent: 'flex-start',
                px: 3,
                py: 2,
                bgcolor: activeTab === 1 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: activeTab === 1 ? 'primary.main' : 'text.primary',
              }}
            >
              My Classes
            </Button>
            <Button
              fullWidth
              startIcon={<AttendanceIcon />}
              onClick={() => setActiveTab(2)}
              sx={{
                justifyContent: 'flex-start',
                px: 3,
                py: 2,
                bgcolor: activeTab === 2 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: activeTab === 2 ? 'primary.main' : 'text.primary',
              }}
            >
              Attendance
            </Button>

            <Button
              fullWidth
              startIcon={<SalaryIcon />}
              onClick={() => setActiveTab(3)}
              sx={{
                justifyContent: 'flex-start',
                px: 3,
                py: 2,
                bgcolor: activeTab === 3 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: activeTab === 3 ? 'primary.main' : 'text.primary',
              }}
            >
              Salary
            </Button>
            <Button
              fullWidth
              startIcon={<ProfileIcon />}
              onClick={() => setActiveTab(4)}
              sx={{
                justifyContent: 'flex-start',
                px: 3,
                py: 2,
                bgcolor: activeTab === 4 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: activeTab === 4 ? 'primary.main' : 'text.primary',
              }}
            >
              Profile
            </Button>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Button
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="error"
              sx={{ justifyContent: 'flex-start' }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, ml: !isMobile ? 280 : 0, p: { xs: 2, md: 4 } }}>
        {/* Mobile Header */}
        {isMobile && (
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" fontWeight={800} color="primary">
              Teacher Portal
            </Typography>
          </Paper>
        )}

        {/* Mobile Tabs */}
        {isMobile && (
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <Tab icon={<HomeIcon />} label="Home" />
              <Tab icon={<ClassesIcon />} label="Classes" />
              <Tab icon={<AttendanceIcon />} label="Attendance" />
              <Tab icon={<SalaryIcon />} label="Salary" />
              <Tab icon={<ProfileIcon />} label="Profile" />
            </Tabs>
          </Paper>
        )}

        {/* Tab Content */}
        {activeTab === 0 && renderHomeTab()}
        {activeTab === 1 && renderClassesTab()}
        {activeTab === 2 && renderAttendanceTab()}
        {activeTab === 3 && renderSalaryTab()}
        {activeTab === 4 && renderProfileTab()}

        {/* Mobile Logout */}
        {isMobile && (
          <Box sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="error"
            >
              Logout
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
