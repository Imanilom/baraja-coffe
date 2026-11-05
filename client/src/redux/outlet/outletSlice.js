import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/lib/axios';

export const fetchOutlets = createAsyncThunk(
    'outlet/fetchOutlets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/outlet');
            const outletsData = Array.isArray(response.data)
                ? response.data
                : (response.data && Array.isArray(response.data.data))
                    ? response.data.data
                    : [];
            return outletsData;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch outlets');
        }
    }
);

const outletSlice = createSlice({
    name: 'outlet',
    initialState: {
        outlets: [],
        loading: false,
        error: null,
        lastFetched: null,
    },
    reducers: {
        clearOutlets: (state) => {
            state.outlets = [];
            state.lastFetched = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOutlets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOutlets.fulfilled, (state, action) => {
                state.loading = false;
                state.outlets = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchOutlets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearOutlets } = outletSlice.actions;
export default outletSlice.reducer;
