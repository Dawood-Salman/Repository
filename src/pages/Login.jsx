import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signin, clearError } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  useTheme,
  InputAdornment,
  alpha // Import alpha
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import BeinnovoLogo from '../components/BeinnovoLogo';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', companyId: '' });
  const [loginError, setLoginError] = useState(null);
  const [isStudentLogin, setIsStudentLogin] = useState(false);
  const [availableSchools, setAvailableSchools] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authData, loading, error } = useSelector((state) => state.auth);
  const theme = useTheme();

  useEffect(() => {
    if (authData) {
      if (authData.role === 'superadmin') {
        navigate('/superadmin/dashboard');

      }else if(authData.role === 'student'){
        navigate('/student/dashboard');

      }else if(authData.role === 'teacher'){
        navigate('/teacher/dashboard');

      }else if (authData.company) {
        navigate(`/company/${authData.company}/dashboard`);
      } else {
        navigate('/login');
      }
    }
    return () => {
        dispatch(clearError());
    }
  }, [authData, navigate, dispatch]);

  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);

  // Check if email belongs to a student and fetch available schools
  const handleEmailBlur = async (e) => {
    const email = e.target.value.toLowerCase().trim();
    if (!email || !email.includes('@')) return;

    try {
      const response = await fetch(`/api/users/available-schools/${email}`);
      const data = await response.json();
      
      if (response.ok && data.schools && data.schools.length > 0) {
        setIsStudentLogin(true);
        setAvailableSchools(data.schools);
        // Auto-fill School ID if only one school
        if (data.schools.length === 1) {
          setFormData(prev => ({ ...prev, companyId: data.schools[0].companyId }));
        }
      } else {
        setIsStudentLogin(false);
        setAvailableSchools([]);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
      setIsStudentLogin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    
    // Validate: Students MUST have School ID
    if (isStudentLogin && !formData.companyId) {
      setLoginError('Please select your School ID');
      return;
    }
    
    try {
      const result = await dispatch(signin(formData)).unwrap();
      console.log('Login successful:', result);
    } catch (err) {
      console.error('Login failed:', err);
      setLoginError(err.message || 'Login failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Grid container component="main" sx={{ height: '100vh', overflow: 'hidden' }}>
        {/* Left Side - Brand / Image */}
        <Grid
            item
            xs={false}
            sm={4}
            md={7}
            lg={8}
            sx={{
                background: 'linear-gradient(160deg, #030D1E 0%, #071428 45%, #0D2146 100%)',
                position: 'relative',
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                p: 6,
                overflow: 'hidden',
                borderRight: '1px solid rgba(16,85,184,0.3)',
            }}
        >
            {/* Brand mesh gradient orbs */}
            <Box sx={{ position: 'absolute', top: '8%', left: '5%', width: 320, height: 320, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,85,184,0.25) 0%, transparent 70%)', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', bottom: '10%', right: '0%', width: 280, height: 280, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', top: '45%', right: '10%', width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(66,165,245,0.15) 0%, transparent 70%)', zIndex: 0 }} />

            {/* Grid pattern overlay */}
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.04,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px' }} />

            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480 }}>
                {/* Big logo */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                  <BeinnovoLogo size={96} />
                </Box>

                {/* Wordmark */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0, mb: 1 }}>
                  <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '2.8rem', letterSpacing: '-0.03em', lineHeight: 1 }}>Bein</Typography>
                  <Typography sx={{ color: '#42A5F5', fontWeight: 900, fontSize: '2.8rem', letterSpacing: '-0.03em', lineHeight: 1 }}>novo</Typography>
                </Box>
                <Typography sx={{ color: alpha('#FFFFFF', 0.5), fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, mb: 3 }}>
                  EIMS Platform
                </Typography>

                {/* Tagline */}
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, mb: 4 }}>
                  <Box component="span" sx={{ color: alpha('#FFFFFF', 0.65) }}>Innovate. </Box>
                  <Box component="span" sx={{ color: '#F5A623' }}>Integrate. </Box>
                  <Box component="span" sx={{ color: alpha('#FFFFFF', 0.65) }}>Elevate.</Box>
                </Typography>

                <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.55), lineHeight: 1.8, px: 2 }}>
                    Complete institutional management suite for modern schools — built for efficiency, designed for growth.
                </Typography>

                {/* Bottom feature pills */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 5, flexWrap: 'wrap' }}>
                  {['Student Management', 'Fee Collection', 'Analytics', 'Multi-School'].map((f) => (
                    <Box key={f} sx={{ px: 1.5, py: 0.5, borderRadius: 5, bgcolor: alpha('#FFFFFF', 0.06),
                      border: '1px solid', borderColor: alpha('#42A5F5', 0.25) }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: alpha('#FFFFFF', 0.6) }}>{f}</Typography>
                    </Box>
                  ))}
                </Box>
            </Box>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid 
            item 
            xs={12} 
            sm={8} 
            md={5} 
            lg={4} 
            component={Paper} 
            elevation={0} 
            square 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper'
            }}
        >
            <Box
                sx={{
                    my: 8,
                    mx: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 400,
                    width: '100%'
                }}
            >
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                    <BeinnovoLogo size={44} />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#030D1E', lineHeight: 1 }}>Bein</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#1055B8', lineHeight: 1 }}>novo</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1.5 }}>EIMS Platform</Typography>
                    </Box>
                 </Box>
                 <Typography component="h1" variant="h5" fontWeight={800} sx={{ color: '#030D1E', mb: 0.5, letterSpacing: -0.5, alignSelf: 'flex-start' }}>
                    Sign In
                 </Typography>
                 <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, alignSelf: 'flex-start' }}>
                    Enter your credentials to access your dashboard.
                 </Typography>

                {loginError && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2, width: '100%' }}>
                        {loginError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon color="action" />
                                </InputAdornment>
                            ),
                            sx: { fontSize: '1rem', borderRadius: 3 }
                        }}
                    />
                    <TextField
                        margin="normal"
                        required={isStudentLogin}
                        fullWidth
                        id="companyId"
                        label={isStudentLogin ? 'School ID *' : 'School ID'}
                        name="companyId"
                        placeholder="e.g. SCH-2026-0001"
                        value={formData.companyId}
                        onChange={handleChange}
                        variant="outlined"
                        error={isStudentLogin && !formData.companyId && loginError === 'Please select your School ID'}
                        helperText={
                          isStudentLogin 
                            ? availableSchools.length > 1 
                              ? `Found ${availableSchools.length} school(s). Enter your School ID.`
                              : availableSchools.length === 1
                              ? `School: ${availableSchools[0].name} (${availableSchools[0].companyId})`
                              : 'Students MUST enter their School ID. Check your admission letter.'
                            : 'School users: enter your School ID. Beinnovo admin: leave blank.'
                        }
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <BusinessIcon color={isStudentLogin && !formData.companyId ? 'error' : 'action'} />
                                </InputAdornment>
                            ),
                            sx: { fontSize: '1rem', borderRadius: 3 }
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon color="action" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 3 }
                        }}
                        sx={{ mb: 4 }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ 
                            py: 1.5, 
                            fontSize: '1rem',
                            textTransform: 'none',
                            borderRadius: 4,
                            fontWeight: 700,
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: 'none'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                    <Box sx={{ mt: 8, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.disabled">
                            &copy; {new Date().getFullYear()} Beinnovo EIMS. All rights reserved.
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Grid>
    </Grid>
  );
};

export default Login;