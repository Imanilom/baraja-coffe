import { useState, useEffect } from 'react';
import { Table, Spin, Alert, Modal, Button, Form, Input, Select, message } from 'antd';
import moment from 'moment';

const { Option } = Select;

export default function DewaadminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dewaadmin/orders', {
        headers: {
          'Content-Type': 'application/json',
          // Assuming token is handled by a cookie or interceptor in this app
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      setOrders(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showEditModal = (record) => {
    setSelectedOrder(record);
    form.setFieldsValue({
      status: record.status,
      grandTotal: record.grandTotal,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
    form.resetFields();
  };

  const handleUpdate = async (values) => {
    try {
      const res = await fetch(`/api/dewaadmin/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update order');
      
      message.success('Order updated successfully!');
      setIsModalVisible(false);
      fetchOrders();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to hard-delete this order?')) return;
    
    try {
      const res = await fetch(`/api/dewaadmin/orders/${id}?hardDelete=true`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete order');
      
      message.success('Order deleted permanently!');
      fetchOrders();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAtWIB',
      key: 'createdAtWIB',
      render: (text) => text ? moment(text).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (val) => `Rp ${val?.toLocaleString('id-ID')}`
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button type="primary" onClick={() => showEditModal(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record._id)}>Delete</Button>
        </div>
      ),
    },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Dewaadmin: Order Override</h1>
      {error && <Alert message={error} type="error" className="mb-4" closable />}
      
      <div className="bg-white p-4 rounded-lg shadow">
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="Dewaadmin Override Order"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="status"
            label="Order Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value="Pending">Pending</Option>
              <Option value="Waiting">Waiting</Option>
              <Option value="OnProcess">OnProcess</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Canceled">Canceled</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="grandTotal"
            label="Grand Total (Override)"
            rules={[{ required: true, message: 'Please enter grand total' }]}
          >
            <Input type="number" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save Changes</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
