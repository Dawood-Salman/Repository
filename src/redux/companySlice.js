import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../services/api';

// ─── School user: load own company ────────────────────────────────────────────
export const fetchCurrentCompany = createAsyncThunk(
  'companies/fetchCurrentCompany',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.fetchCompanyById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, company }, { rejectWithValue }) => {
    try {
      const { data } = await api.updateCompany(id, company);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ─── Superadmin: school management ────────────────────────────────────────────
export const fetchAllSchools = createAsyncThunk(
  'companies/fetchAllSchools',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.fetchAllSchools();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createSchool = createAsyncThunk(
  'companies/createSchool',
  async (schoolData, { rejectWithValue }) => {
    try {
      const { data } = await api.createSchool(schoolData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const toggleSchool = createAsyncThunk(
  'companies/toggleSchool',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.toggleSchoolStatus(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteSchool = createAsyncThunk(
  'companies/deleteSchool',
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteSchool(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const companySlice = createSlice({
  name: 'companies',
  initialState: {
    loading: false,
    schoolsLoading: false,
    error: null,
    selectedCompany: null,
    companies: [],       // all schools (superadmin view)
    lastCreated: null,   // last created school + credentials
  },
  reducers: {
    selectCompany: (state) => state,
    clearLastCreated: (state) => { state.lastCreated = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentCompany
      .addCase(fetchCurrentCompany.pending, (state) => { state.loading = true; })
      .addCase(fetchCurrentCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCompany = action.payload;
        state.companies = action.payload ? [action.payload] : [];
      })
      .addCase(fetchCurrentCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // updateCompany
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.selectedCompany = action.payload;
        const idx = state.companies.findIndex(c => c._id === action.payload._id);
        if (idx >= 0) state.companies[idx] = action.payload;
        else state.companies = [action.payload];
      })
      // fetchAllSchools
      .addCase(fetchAllSchools.pending, (state) => { state.schoolsLoading = true; })
      .addCase(fetchAllSchools.fulfilled, (state, action) => {
        state.schoolsLoading = false;
        state.companies = action.payload;
      })
      .addCase(fetchAllSchools.rejected, (state, action) => {
        state.schoolsLoading = false;
        state.error = action.payload?.message;
      })
      // createSchool
      .addCase(createSchool.fulfilled, (state, action) => {
        state.companies.unshift(action.payload.company);
        state.lastCreated = action.payload; // includes credentials
      })
      // toggleSchool
      .addCase(toggleSchool.fulfilled, (state, action) => {
        const idx = state.companies.findIndex(c => c._id === action.payload.company._id);
        if (idx >= 0) state.companies[idx] = { ...state.companies[idx], ...action.payload.company };
      })
      // deleteSchool
      .addCase(deleteSchool.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c._id !== action.payload);
      });
  },
});

export const { selectCompany, clearLastCreated } = companySlice.actions;
export default companySlice.reducer;
