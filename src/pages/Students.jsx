import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../redux/studentSlice';
import { TableRowSkeleton } from '../components/SkeletonLoaders';
import WhatsAppContact from '../components/WhatsAppContact';
import { getGroups } from '../redux/groupSlice';
import * as api from '../services/api';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  AutoFixHigh as AutoFixHighIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import moment from 'moment';
import * as XLSX from 'xlsx';

const Students = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { companyId } = useParams();
  
  const { selectedCompany } = useSelector((state) => state.companies);
  const { students, loading, total, pages } = useSelector((state) => state.students);
  const { groups } = useSelector((state) => state.groups);
  
  const [open, setOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [nextIdPreview, setNextIdPreview] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);

  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    contact: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    fatherName: '',
    motherName: '',
    guardianInfo: '',
    emergencyContact: '',
    status: 'Active',
    groupId: '',
    openingBalance: '',
    loginEnabled: false
  });

  useEffect(() => {
    const id = companyId || selectedCompany?._id;
    if (id) {
      dispatch(getGroups(id));
      dispatch(getStudents({
          companyId: id,
          page: currentPage + 1,
          limit: rowsPerPage,
          search: searchTerm
      }));
    }
  }, [dispatch, selectedCompany, companyId, currentPage, rowsPerPage, searchTerm]);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleOpen = async (student = null) => {
    if (student) {
      setCurrentStudent(student);
      setFormData({
        name: student.name,
        studentId: student.studentId || '',  
        email: student.email || '',
        contact: student.contact || '',
        dateOfBirth: student.dateOfBirth ? moment(student.dateOfBirth).format('YYYY-MM-DD') : '',
        gender: student.gender || 'Male',
        address: student.address || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        guardianInfo: student.guardianInfo || '',
        emergencyContact: student.emergencyContact || '',
        status: student.status || 'Active',
        groupId: student.group?._id || student.group || '',
        openingBalance: '',
        loginEnabled: student.loginEnabled || false
      });
    } else {
      setCurrentStudent(null);
      setNextIdPreview('Loading…');
      const id = companyId || selectedCompany?._id;
      if (id) {
        try {
          const { data } = await api.fetchNextStudentId(id);
          setNextIdPreview(data.studentId);
        } catch { setNextIdPreview('Auto-generated'); }
      }
      setFormData({
        name: '',
        studentId: '',
        email: '',  
        contact: '',
        dateOfBirth: '',
        gender: 'Male',
        address: '',
        fatherName: '',
        motherName: '',
        guardianInfo: '',
        emergencyContact: '',
        status: 'Active',
        groupId: '',
        openingBalance: '',
        loginEnabled: false
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentStudent(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = companyId || selectedCompany?._id;
    if (!id) {
        toast.error('Institute ID missing. Please refresh the page.');
        return;
    }

    try {
      if (currentStudent) {
        const { studentId: _sid, ...rest } = formData;
        await dispatch(updateStudent({ 
          id: currentStudent._id, 
          student: rest 
        })).unwrap();
        toast.success('Student updated successfully');
      } else {
        const { studentId: _sid, ...rest } = formData;
        await dispatch(createStudent({ 
          ...rest, 
          companyId: id 
        })).unwrap();
        toast.success('Student created successfully');
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save student:', err);
      toast.error(err.message || 'Failed to save student');
    }
  };

  const handleMigrateIds = async () => {
    const id = companyId || selectedCompany?._id;
    if (!id) return;
    if (!window.confirm('This will reassign Student IDs to all students in BN-YY0001 format (sorted by join date). Continue?')) return;
    setMigrating(true);
    try {
      const { data } = await api.migrateStudentIds(id);
      toast.success(`${data.message}`);
      dispatch(getStudents({ companyId: id, page: currentPage + 1, limit: rowsPerPage, search: searchTerm }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await dispatch(deleteStudent(id)).unwrap();
        toast.success('Student deleted successfully');
      } catch (err) {
        console.error('Failed to delete student:', err);
        toast.error(err.message || 'Failed to delete student');
      }
    }
  };

  const handleExport = (type) => {
      const data = (students || []).map(c => ({
          name: c.name,
          email: c.email || '-',
          contact: c.contact || '-',
          address: c.address || '-',
          guardianInfo: c.guardianInfo || '-'
      }));

      const columns = [
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Contact', key: 'contact', width: 20 },
          { header: 'Address', key: 'address', width: 40 },
          { header: 'Guardian Info', key: 'guardianInfo', width: 20 }
      ];

      const title = 'Student List';
      const dateRange = moment().format('DD MMM YYYY');
      const themeColor = theme.palette.primary.main;

      if (type === 'excel') {
          exportToExcel(data, columns, title, dateRange, selectedCompany?.name, themeColor);
      } else {
          exportToPDF(data, columns, title, dateRange, selectedCompany?.name, themeColor);
      }
  };

  const handleBulkUploadOpen = () => {
    setBulkUploadOpen(true);
    setSelectedFile(null);
    setUploadResults(null);
  };

  const handleBulkUploadClose = () => {
    setBulkUploadOpen(false);
    setSelectedFile(null);
    setUploadResults(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const id = companyId || selectedCompany?._id;
    if (!id) {
      toast.error('Institute ID missing. Please refresh the page.');
      return;
    }

    setUploading(true);
    try {
      const { data } = await api.bulkUploadStudents(id, selectedFile);
      setUploadResults(data);
      toast.success(`Upload completed: ${data.successful} successful, ${data.failed} failed, ${data.duplicates} duplicates`);
      
      // Refresh students list
      dispatch(getStudents({
        companyId: id,
        page: currentPage + 1,
        limit: rowsPerPage,
        search: searchTerm
      }));
    } catch (err) {
      console.error('Bulk upload failed:', err);
      toast.error(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        contact: '1234567890',
        dateOfBirth: '2000-01-01',
        gender: 'Male',
        address: '123 Main St, City',
        fatherName: 'Father Name',
        motherName: 'Mother Name',
        guardianInfo: 'Guardian Info',
        emergencyContact: '9876543210',
        status: 'Active',
        loginEnabled: 'false',
        admissionFee: '1000',
        admissionFeePaid: 'false',
        admissionFeeDiscount: '0',
        openingBalance: '0',
        openingBalanceDate: '2024-01-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_bulk_upload_template.xlsx');
  };

  return (
    <Container maxWidth={false} sx={{ py: 2 }}>
      {/* Header Section */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={2} gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
            Student Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student enrollments, contact details, and academic history.
          </Typography>
        </Box>
        <Box display="flex" gap={2} width={{ xs: '100%', md: 'auto' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%">
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<UploadIcon />}
                  onClick={handleBulkUploadOpen}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600, color: '#FF6B35', borderColor: '#FF6B35', flex: { xs: 1, sm: 'none' } }}
                >
                  Bulk Upload
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('excel')}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600, color: '#1D6F42', borderColor: '#1D6F42', flex: { xs: 1, sm: 'none' } }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('pdf')}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600, color: '#D32F2F', borderColor: '#D32F2F', flex: { xs: 1, sm: 'none' } }}
                >
                  PDF
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={migrating ? <CircularProgress size={14} /> : <AutoFixHighIcon />}
                  onClick={handleMigrateIds}
                  disabled={migrating}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600, flex: { xs: 1, sm: 'none' } }}
                >
                  {migrating ? 'Migrating…' : 'Assign IDs'}
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpen()}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: 'none',
                    bgcolor: 'primary.main',
                    flex: { xs: 1, sm: 'none' },
                    '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: 'none'
                    }
                  }}
                >
                  Add Student
                </Button>
            </Stack>
        </Box>
      </Box>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 2, borderRadius: 3, overflow: 'visible', border: 'none', boxShadow: theme.shadows[1] }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth size="small"
                placeholder="Search students by name, email, or contact..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>),
                  sx: { borderRadius: 2, bgcolor: 'background.default' }
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select fullWidth size="small" value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                InputProps={{ sx: { borderRadius: 2, bgcolor: 'background.default' } }}
              >
                <MenuItem value="all">All Groups</MenuItem>
                {(groups || []).map((g) => (
                  <MenuItem key={g._id} value={g._id}>
                    <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: g.color || 'primary.main', mr: 1 }} />
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Students Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, boxShadow: theme.shadows[2], overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ py: 1, fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }}>Student ID</TableCell>
              <TableCell sx={{ py: 1, fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }}>Student Details</TableCell>
              <TableCell sx={{ py: 1, fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }}>Contact Info</TableCell>
              <TableCell sx={{ py: 1, fontWeight: 700, color: 'text.secondary', borderBottom: 'none', display: { xs: 'none', md: 'table-cell' } }}>Group</TableCell>
              <TableCell sx={{ py: 1, fontWeight: 700, color: 'text.secondary', borderBottom: 'none', display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
              <TableCell sx={{ py: 1, fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
                <TableRowSkeleton rows={8} cols={6} />
            ) : students && students.length > 0 ? (
              students.filter(s => filterGroup === 'all' || (s.group?._id || s.group) === filterGroup).map((student) => (
                <TableRow key={student._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s' }}>
                  <TableCell sx={{ py: 0.5 }}>
                    <Chip
                      label={student.studentId || '—'}
                      size="small"
                      sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.dark', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontWeight: 700,
                          borderRadius: 2,
                          fontSize: '0.875rem'
                        }}
                      >
                        {student.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="text.primary" fontSize="0.875rem">
                          {student.name}
                        </Typography>
                        {student.guardianInfo && (
                          <Chip
                            label={`Guardian: ${student.guardianInfo}`}
                            size="small"
                            sx={{ mt: 0, borderRadius: 1, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.dark', fontSize: '0.65rem', height: 16 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box display="flex" flexDirection="column" gap={0}>
                      {student.email && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
                          <Typography variant="caption" color="text.primary">{student.email}</Typography>
                        </Box>
                      )}
                      {student.contact && <WhatsAppContact value={student.contact} variant="caption" />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5, display: { xs: 'none', md: 'table-cell' } }}>
                    {student.group ? (
                      <Chip
                        label={student.group.name || student.group.code}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: 1, bgcolor: `${student.group.color || '#1976d2'}22`, color: student.group.color || 'primary.main' }}
                      />
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, display: { xs: 'none', md: 'table-cell' } }}>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14, mt: 0.2 }} />
                      <Typography variant="caption" color="text.primary" sx={{ maxWidth: 200, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {student.address || <span style={{ color: theme.palette.text.disabled }}>No address</span>}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleOpen(student)}
                          size="small"
                          sx={{
                            color: theme.palette.info.main,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            borderRadius: 1.5,
                            padding: 0.5,
                            '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                          }}
                        >
                          <EditIcon fontSize="small" sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(student._id)}
                          size="small"
                          sx={{
                            color: theme.palette.error.main,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            borderRadius: 1.5,
                            padding: 0.5,
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                          }}
                        >
                          <DeleteIcon fontSize="small" sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                    <Typography variant="subtitle1" color="text.secondary">No students found</Typography>
                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ mt: 1, borderRadius: 2 }}>
                      Add Student
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total || 0}
        page={currentPage}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          '.MuiTablePagination-toolbar': {
            justifyContent: 'flex-end',
          },
          '.MuiTablePagination-spacer': {
            display: 'none',
          },
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: theme.shadows[5] }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {currentStudent ? 'Edit Student' : 'Add New Student'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student ID"
                name="studentId"
                value={currentStudent ? (formData.studentId || '—') : nextIdPreview}
                InputProps={{
                  readOnly: true,
                  startAdornment: <LockIcon sx={{ fontSize: 15, color: 'text.disabled', mr: 0.5 }} />,
                  sx: { fontFamily: 'monospace', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.04) }
                }}
                helperText={currentStudent ? 'Auto-generated — cannot be changed' : 'Will be auto-assigned on save'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Number"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleChange}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Father's Name"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mother's Name"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Dropped">Dropped</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Academic Group</InputLabel>
                <Select
                  name="groupId"
                  value={formData.groupId}
                  label="Academic Group"
                  onChange={handleChange}
                >
                  <MenuItem value="">— No Group —</MenuItem>
                  {(groups || []).map((g) => (
                    <MenuItem key={g._id} value={g._id}>
                      <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: g.color || 'primary.main', mr: 1, verticalAlign: 'middle' }} />
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!currentStudent && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Opening Balance (if any)"
                  name="openingBalance"
                  type="number"
                  value={formData.openingBalance}
                  onChange={handleChange}
                  helperText="Initial balance for the student's ledger"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`, 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02)
              }}>
                <LoginIcon sx={{ mr: 2, color: 'primary.main', fontSize: 20 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.loginEnabled}
                      onChange={(e) => setFormData({ ...formData, loginEnabled: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Enable Student Login
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow this student to login with their email and default password (123456789)
                      </Typography>
                    </Box>
                  }
                  sx={{ ml: 0, alignItems: 'flex-start' }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Button onClick={handleClose} size="medium" sx={{ borderRadius: 2, px: 3, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="medium"
            disabled={!formData.name}
            sx={{
              borderRadius: 2,
              px: 4,
              boxShadow: 'none',
              bgcolor: 'primary.main',
              '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: 'none'
              }
            }}
          >
            {currentStudent ? 'Update Student' : 'Save Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={bulkUploadOpen}
        onClose={handleBulkUploadClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: theme.shadows[5] }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Bulk Upload Students
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`, 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                mb: 2
              }}>
                <DescriptionIcon sx={{ mr: 2, color: 'info.main', fontSize: 24 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                    Instructions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upload an Excel file with student data. Required fields: name, contact. 
                    Optional fields: email, dateOfBirth, gender, address, fatherName, motherName, guardianInfo, emergencyContact, status, loginEnabled, admissionFee, admissionFeePaid, admissionFeeDiscount, openingBalance, openingBalanceDate
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadSampleTemplate}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Download Sample Template
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="file"
                inputProps={{
                  accept: '.xlsx,.xls'
                }}
                onChange={handleFileSelect}
                helperText="Select Excel file (.xlsx or .xls format)"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>

            {selectedFile && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`, 
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.05)
                }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                    Selected File: {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>
              </Grid>
            )}

            {uploadResults && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, 
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={1}>
                    Upload Results
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="success.main">
                        Successful: {uploadResults.successful}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="warning.main">
                        Failed: {uploadResults.failed}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="info.main">
                        Duplicates: {uploadResults.duplicates}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {uploadResults.results.failed.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Failed Records:
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                        {uploadResults.results.failed.map((item, index) => (
                          <Typography key={index} variant="caption" color="text.secondary" display="block">
                            Row {item.row}: {item.error}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {uploadResults.results.duplicates.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Duplicate Records:
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                        {uploadResults.results.duplicates.map((item, index) => (
                          <Typography key={index} variant="caption" color="text.secondary" display="block">
                            Row {item.row}: {item.error} (Existing ID: {item.existingStudentId})
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Button onClick={handleBulkUploadClose} size="medium" sx={{ borderRadius: 2, px: 3, color: 'text.secondary' }}>
            Close
          </Button>
          <Button
            onClick={handleBulkUpload}
            variant="contained"
            size="medium"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={14} /> : <UploadIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              boxShadow: 'none',
              bgcolor: 'primary.main',
              '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: 'none'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Students'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Students;
