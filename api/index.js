import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';

// Route
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import orderRoutes from './routes/order.route.js';
import voucherRoutes from './routes/voucher.admin.route.js';
import voucherUserRoutes from './routes/voucher.user.route.js';

dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

const __dirname = path.resolve();

const app = express();

// app.use(express.static(path.join(__dirname, '/client/dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

app.use(express.json());

app.use(cookieParser());
app.use(cors());

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/voucher', voucherRoutes);
app.use('/api/voucherUser', voucherUserRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});
