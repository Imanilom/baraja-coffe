import React, { useEffect, useState } from 'react';

const BubbleAlert = ({ paginatedData }) => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const newMessages = [];

        paginatedData.forEach((item) => {

            const productName = item?.name
                .toLowerCase()
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            if (item?.stockData?.currentStock <= 0 || item?.stockData == null) {
                newMessages.push({
                    type: 'danger',
                    text: `Stok produk "${productName}" habis! Isi sekarang!`,
                });
            } else if (item?.stockData?.currentStock <= item?.stockData?.minStock) {
                newMessages.push({
                    type: 'warning',
                    text: `Stok produk "${productName}" menipis, segera restock.`,
                });
            }
        });

        setMessages(newMessages);

        const timeout = setTimeout(() => {
            setMessages([]);
        }, 5000);

        return () => clearTimeout(timeout);
    }, [paginatedData]);

    if (messages.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-50 space-y-2">
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`px-4 py-3 rounded-xl text-white shadow-lg max-w-sm
                    ${msg.type === 'danger' ? 'bg-red-500' : 'bg-yellow-500 text-black'}`}
                >
                    <p className="text-sm">{msg.text}</p>
                </div>
            ))}
        </div>
    );
};

export default BubbleAlert;
