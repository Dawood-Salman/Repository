import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as api from '../services/api';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Stack,
} from '@mui/material';

const Notifications = () => {
  const { companyId } = useParams();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [targetStudent, setTargetStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const loadGroups = async () => {
    try {
      const { data } = await api.fetchGroups(companyId);
      const loadedGroups = Array.isArray(data) ? data : data?.groups || [];
      setGroups(loadedGroups);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load groups');
    }
  };

  const loadStudents = async (search = '') => {
    try {
      const { data } = await api.fetchStudents(companyId, { page: 1, limit: 100, search });
      setStudents(data.students || data || []);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load students');
    }
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.fetchAdminNotifications(companyId);
      setNotifications(data);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load school notifications');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadGroups(), loadStudents(), loadNotifications()]);
      setLoading(false);
    };
    initialize();
  }, [companyId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetGroup: targetGroup || null,
        targetStudentIds: targetStudent ? [targetStudent] : [],
      };

      await api.sendNotification(payload);
      toast.success('Notification sent successfully');
      setTitle('');
      setMessage('');
      setTargetGroup('');
      setTargetStudent('');
      await loadNotifications();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleStudentSearch = async (event) => {
    const value = event.target.value;
    setStudentSearch(value);
    await loadStudents(value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        School Notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Send announcements to all students, a specific class, or a selected student dashboard.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Create Notification
              </Typography>
              <Box component="form" onSubmit={handleSend}>
                <TextField
                  fullWidth
                  label="Notification Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  sx={{ mb: 2 }}
                  multiline
                  rows={4}
                  required
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="group-label">Target Group</InputLabel>
                  <Select
                    labelId="group-label"
                    value={targetGroup}
                    label="Target Group"
                    onChange={(e) => setTargetGroup(e.target.value)}
                  >
                    <MenuItem value="">All Students</MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group._id} value={group._id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Search student"
                  value={studentSearch}
                  onChange={handleStudentSearch}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="student-label">Target Student</InputLabel>
                  <Select
                    labelId="student-label"
                    value={targetStudent}
                    label="Target Student"
                    onChange={(e) => setTargetStudent(e.target.value)}
                  >
                    <MenuItem value="">No specific student</MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name} • {student.studentId || student.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Notification'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Recent Notifications
                </Typography>
                <Chip label={`${notifications.length} total`} color="primary" />
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No notifications have been created yet.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {notifications.map((notification) => (
                    <Box key={notification._id}>
                      <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                        <ListItemText
                          primary={notification.title}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {notification.student ? 'Direct to student' : notification.group ? `Group: ${notification.group?.name}` : 'All students'} • {new Date(notification.createdAt).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                                {notification.message}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Notifications;
