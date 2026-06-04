import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    operational: {
        installment: { data: [], lastFetched: null },
        userAttendances: { data: [], lastFetched: null },
        reconciliation: { data: [], lastFetched: null },
        commission: { data: [], lastFetched: null },
        expenditure: { data: [], lastFetched: null },
        stock: { data: [], lastFetched: null },
        table: { data: [], lastFetched: null },
    },
    inventory: {
        stockOpname: { data: [], lastFetched: null },
        productionStock: { data: [], lastFetched: null },
    },
};

const reportSlice = createSlice({
    name: 'report',
    initialState,
    reducers: {
        setReportData: (state, action) => {
            const { category, type, data } = action.payload;
            if (state[category] && state[category][type]) {
                state[category][type].data = data;
                state[category][type].lastFetched = new Date().toISOString();
            }
        },
        clearReportCache: (state, action) => {
            const { category, type } = action.payload;
            if (category && type) {
                state[category][type] = { data: [], lastFetched: null };
            } else if (category) {
                state[category] = initialState[category];
            } else {
                return initialState;
            }
        },
    },
});

export const { setReportData, clearReportCache } = reportSlice.actions;
export default reportSlice.reducer;

