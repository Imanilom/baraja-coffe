// utils/socketManagement.js - UPDATED with Device-Based Broadcasting

class SocketManagement {
    constructor() {
        this.connectedDevices = new Map();
        // ✅ OPTIMIZATION: Device indexing for O(1) lookup
        this.devicesByRole = new Map(); // role -> Set of socketIds
        this.devicesByOutlet = new Map(); // outletId -> Set of socketIds
    }

    async registerDevice(socket, deviceData) {
        const {
            deviceId,
            outletId,
            role,
            location,
            deviceName,
            assignedAreas = [],
            assignedTables = [],
            orderTypes = [],
            sessionId
        } = deviceData;

        this.connectedDevices.set(socket.id, {
            socketId: socket.id,
            deviceId,
            outletId,
            role,
            location,
            deviceName,
            assignedAreas,
            assignedTables,
            orderTypes,
            sessionId,
            connectedAt: new Date()
        });

        // ✅ OPTIMIZATION: Maintain role index
        if (!this.devicesByRole.has(role)) {
            this.devicesByRole.set(role, new Set());
        }
        this.devicesByRole.get(role).add(socket.id);

        // ✅ OPTIMIZATION: Maintain outlet index
        const outletKey = outletId.toString();
        if (!this.devicesByOutlet.has(outletKey)) {
            this.devicesByOutlet.set(outletKey, new Set());
        }
        this.devicesByOutlet.get(outletKey).add(socket.id);

        console.log(`✅ Device registered: ${deviceName} (${deviceId})`);
        console.log(`   Socket ID: ${socket.id}`);
        console.log(`   Role: ${role}`);
        console.log(`   Location: ${location}`);
        console.log(`   Assigned Areas: ${assignedAreas.join(', ') || 'None'}`);
        console.log(`   Assigned Tables: ${assignedTables.join(', ') || 'None'}`);

        return this.connectedDevices.get(socket.id);
    }

    handleDisconnection(socketId) {
        const device = this.connectedDevices.get(socketId);
        if (device) {
            console.log(`❌ Device disconnected: ${device.deviceName}`);
            
            // ✅ OPTIMIZATION: Clean up indexes
            if (this.devicesByRole.has(device.role)) {
                this.devicesByRole.get(device.role).delete(socketId);
                if (this.devicesByRole.get(device.role).size === 0) {
                    this.devicesByRole.delete(device.role);
                }
            }
            
            const outletKey = device.outletId.toString();
            if (this.devicesByOutlet.has(outletKey)) {
                this.devicesByOutlet.get(outletKey).delete(socketId);
                if (this.devicesByOutlet.get(outletKey).size === 0) {
                    this.devicesByOutlet.delete(outletKey);
                }
            }
            
            this.connectedDevices.delete(socketId);
        }
    }

    // ✅ MAIN BROADCAST FUNCTION WITH DEVICE FILTERING
    // async broadcastOrder(orderData) {
    //     try {
    //         const {
    //             order_id: orderId,
    //             tableNumber,
    //             items,
    //             outlet,
    //             source,
    //             order_type: orderType,
    //             customer_name: customerName,
    //             service
    //         } = orderData;

    //         const outletId = outlet?._id || outlet;

    //         console.log('╔═══════════════════════════════════════════════════════════╗');
    //         console.log('📡 BROADCASTING ORDER WITH DEVICE FILTERING');
    //         console.log('╠═══════════════════════════════════════════════════════════╣');
    //         console.log(`   Order ID: ${orderId}`);
    //         console.log(`   Table: ${tableNumber || 'N/A'}`);
    //         console.log(`   Total Items: ${items?.length || 0}`);
    //         console.log(`   Outlet: ${outletId}`);
    //         console.log('╚═══════════════════════════════════════════════════════════╝');

    //         // Get all connected devices
    //         const connectedDevices = Array.from(this.connectedDevices.values());
    //         console.log(`📱 Total connected devices: ${connectedDevices.length}`);

    //         // ✅ Separate items by workstation type
    //         const beverageItems = items.filter(item => {
    //             const mainCat = (item.mainCategory || '').toLowerCase();
    //             const ws = (item.workstation || '').toLowerCase();
    //             return mainCat.includes('beverage') ||
    //                 mainCat.includes('minuman') ||
    //                 ws.includes('bar');
    //         });

    //         const kitchenItems = items.filter(item => {
    //             const mainCat = (item.mainCategory || '').toLowerCase();
    //             const ws = (item.workstation || '').toLowerCase();
    //             return !mainCat.includes('beverage') &&
    //                 !mainCat.includes('minuman') &&
    //                 !ws.includes('bar');
    //         });

    //         console.log(`   Kitchen Items: ${kitchenItems.length}`);
    //         console.log(`   Beverage Items: ${beverageItems.length}`);

    //         // ✅ Broadcast to relevant devices
    //         let sentCount = 0;
    //         for (const device of connectedDevices) {
    //             // Skip if different outlet
    //             if (device.outletId.toString() !== outletId.toString()) {
    //                 console.log(`⏭️  Skipping ${device.deviceName} - Different outlet`);
    //                 continue;
    //             }

    //             let relevantItems = [];
    //             let eventType = '';

    //             // Determine which items this device should receive
    //             if (device.role.includes('bar')) {
    //                 relevantItems = beverageItems;
    //                 eventType = 'beverage_immediate_print';

    //                 // Check if table is assigned to this bar
    //                 if (tableNumber && !this._isTableAssignedToDevice(tableNumber, device)) {
    //                     console.log(`⏭️  Skipping bar ${device.deviceName} - Table ${tableNumber} not assigned`);
    //                     continue;
    //                 }
    //             } else if (device.role.includes('kitchen')) {
    //                 relevantItems = kitchenItems;
    //                 eventType = 'kitchen_immediate_print';
    //                 // Kitchen gets all kitchen items (no table filtering)
    //             } else {
    //                 // General devices might handle both
    //                 relevantItems = items;
    //                 eventType = 'kitchen_immediate_print';
    //             }

    //             // Skip if no relevant items
    //             if (relevantItems.length === 0) {
    //                 console.log(`⏭️  Skipping ${device.deviceName} - No relevant items`);
    //                 continue;
    //             }

    //             // ✅ CRITICAL: Send to specific device socket with deviceId
    //             const printData = {
    //                 orderId,
    //                 tableNumber,
    //                 orderType,
    //                 source,
    //                 name: customerName || 'Guest',
    //                 service: service || 'Dine-In',
    //                 orderItems: relevantItems,
    //                 deviceId: device.deviceId,  // ← CRITICAL: Include backend device ID
    //                 targetDevice: device.deviceName,
    //                 timestamp: new Date()
    //             };

    //             global.io.to(device.socketId).emit(eventType, printData);

    //             console.log(`✅ Sent to: ${device.deviceName}`);
    //             console.log(`   Socket ID: ${device.socketId}`);
    //             console.log(`   Device ID: ${device.deviceId}`);
    //             console.log(`   Event: ${eventType}`);
    //             console.log(`   Items: ${relevantItems.length}`);

    //             sentCount++;
    //         }

    //         console.log(`📊 Broadcast Summary: Sent to ${sentCount} device(s)`);
    //         console.log('═══════════════════════════════════════════════════════════');

    //         return {
    //             success: true,
    //             devicesNotified: sentCount,
    //             kitchenItems: kitchenItems.length,
    //             beverageItems: beverageItems.length
    //         };

    //     } catch (error) {
    //         console.error('❌ Broadcast order error:', error);
    //         return {
    //             success: false,
    //             error: error.message
    //         };
    //     }
    // }

    async broadcastOrder(orderData) {
        try {
            const {
                order_id: orderId,
                tableNumber,
                items,
                outlet,
                source,
                order_type: orderType,
                customer_name: customerName,
                service
            } = orderData;
            const outletId = outlet?._id || outlet;
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log('📡 BROADCASTING ORDER WITH BAR-FIRST PRIORITY');
            console.log('╠═══════════════════════════════════════════════════════════╣');
            console.log(`   Order ID: ${orderId}`);
            console.log(`   Table: ${tableNumber || 'N/A'}`);
            console.log(`   Total Items: ${items?.length || 0}`);
            console.log(`   Outlet: ${outletId}`);
            console.log('╚═══════════════════════════════════════════════════════════╝');
            // Get all connected devices
            const connectedDevices = Array.from(this.connectedDevices.values());
            console.log(`📱 Total connected devices: ${connectedDevices.length}`);
            // ✅ Separate items by workstation type
            const beverageItems = items.filter(item => {
                const mainCat = (item.mainCategory || '').toLowerCase();
                const ws = (item.workstation || '').toLowerCase();
                return mainCat.includes('beverage') ||
                    mainCat.includes('minuman') ||
                    ws.includes('bar');
            });
            const kitchenItems = items.filter(item => {
                const mainCat = (item.mainCategory || '').toLowerCase();
                const ws = (item.workstation || '').toLowerCase();
                return !mainCat.includes('beverage') &&
                    !mainCat.includes('minuman') &&
                    !ws.includes('bar');
            });
            console.log(`   Kitchen Items: ${kitchenItems.length}`);
            console.log(`   Beverage Items: ${beverageItems.length}`);
            // ✅ SEPARATE DEVICES BY TYPE
            const barDevices = [];
            const kitchenDevices = [];
            const otherDevices = [];
            for (const device of connectedDevices) {
                // Skip if different outlet
                if (device.outletId.toString() !== outletId.toString()) {
                    console.log(`⏭️  Skipping ${device.deviceName} - Different outlet`);
                    continue;
                }
                if (device.role.includes('bar')) {
                    barDevices.push(device);
                } else if (device.role.includes('kitchen')) {
                    kitchenDevices.push(device);
                } else {
                    otherDevices.push(device);
                }
            }
            console.log(`   📊 Device Distribution:`);
            console.log(`      Bar Devices: ${barDevices.length}`);
            console.log(`      Kitchen Devices: ${kitchenDevices.length}`);
            console.log(`      Other Devices: ${otherDevices.length}`);
            let sentCount = 0;
            // ✅ STEP 1: Send to BAR devices FIRST
            console.log('\n🍹 STEP 1: Broadcasting to BAR devices...');
            for (const device of barDevices) {
                const relevantItems = beverageItems;
                if (relevantItems.length === 0) {
                    console.log(`   ⏭️  Skipping ${device.deviceName} - No beverage items`);
                    continue;
                }
                // Check table assignment
                if (tableNumber && !this._isTableAssignedToDevice(tableNumber, device)) {
                    console.log(`   ⏭️  Skipping ${device.deviceName} - Table ${tableNumber} not assigned`);
                    continue;
                }
                const printData = {
                    orderId,
                    tableNumber,
                    orderType,
                    source,
                    name: customerName || 'Guest',
                    service: service || 'Dine-In',
                    orderItems: relevantItems,
                    deviceId: device.deviceId,
                    targetDevice: device.deviceName,
                    timestamp: new Date()
                };
                global.io.to(device.socketId).emit('beverage_immediate_print', printData);
                console.log(`   ✅ [BAR FIRST] Sent to: ${device.deviceName}`);
                console.log(`      Socket ID: ${device.socketId}`);
                console.log(`      Items: ${relevantItems.length}`);
                sentCount++;
            }
            // ✅ STEP 2: NON-BLOCKING DELAY for kitchen (prioritize bar)
            if (barDevices.length > 0 && kitchenDevices.length > 0 && beverageItems.length > 0 && kitchenItems.length > 0) {
                console.log(`\n⏱️  STEP 2: Scheduling kitchen broadcast in 800ms (non-blocking)...`);
                
                // ✅ OPTIMIZATION: Non-blocking setTimeout
                setTimeout(() => {
                    console.log('\n🍳 STEP 3: Broadcasting to KITCHEN devices (delayed)...');
                    for (const device of kitchenDevices) {
                        const relevantItems = kitchenItems;
                        if (relevantItems.length === 0) {
                            console.log(`   ⏭️  Skipping ${device.deviceName} - No kitchen items`);
                            return;
                        }
                        const printData = {
                            orderId,
                            tableNumber,
                            orderType,
                            source,
                            name: customerName || 'Guest',
                            service: service || 'Dine-In',
                            orderItems: relevantItems,
                            deviceId: device.deviceId,
                            targetDevice: device.deviceName,
                            timestamp: new Date()
                        };
                        global.io.to(device.socketId).emit('kitchen_immediate_print', printData);
                        console.log(`   ✅ [KITCHEN DELAYED] Sent to: ${device.deviceName}`);
                        console.log(`      Socket ID: ${device.socketId}`);
                        console.log(`      Items: ${relevantItems.length}`);
                    }
                }, 800);
            } else {
                // ✅ STEP 3: Send to KITCHEN devices immediately (no bar items)
                console.log('\n🍳 STEP 3: Broadcasting to KITCHEN devices (immediate)...');
                for (const device of kitchenDevices) {
                    const relevantItems = kitchenItems;
                    if (relevantItems.length === 0) {
                        console.log(`   ⏭️  Skipping ${device.deviceName} - No kitchen items`);
                        continue;
                    }
                    const printData = {
                        orderId,
                        tableNumber,
                        orderType,
                        source,
                        name: customerName || 'Guest',
                        service: service || 'Dine-In',
                        orderItems: relevantItems,
                        deviceId: device.deviceId,
                        targetDevice: device.deviceName,
                        timestamp: new Date()
                    };
                    global.io.to(device.socketId).emit('kitchen_immediate_print', printData);
                    console.log(`   ✅ [KITCHEN] Sent to: ${device.deviceName}`);
                    console.log(`      Socket ID: ${device.socketId}`);
                    console.log(`      Items: ${relevantItems.length}`);
                    sentCount++;
                }
            }
            // ✅ STEP 4: Send to OTHER devices (if any)
            if (otherDevices.length > 0) {
                console.log('\n📋 STEP 4: Broadcasting to OTHER devices...');
                for (const device of otherDevices) {
                    const relevantItems = items; // Send all items to general devices
                    if (relevantItems.length === 0) {
                        console.log(`   ⏭️  Skipping ${device.deviceName} - No items`);
                        continue;
                    }
                    const printData = {
                        orderId,
                        tableNumber,
                        orderType,
                        source,
                        name: customerName || 'Guest',
                        service: service || 'Dine-In',
                        orderItems: relevantItems,
                        deviceId: device.deviceId,
                        targetDevice: device.deviceName,
                        timestamp: new Date()
                    };
                    global.io.to(device.socketId).emit('kitchen_immediate_print', printData);
                    console.log(`   ✅ [OTHER] Sent to: ${device.deviceName}`);
                    console.log(`      Items: ${relevantItems.length}`);
                    sentCount++;
                }
            }
            console.log('\n╔═══════════════════════════════════════════════════════════╗');
            console.log('📊 BROADCAST SUMMARY');
            console.log('╠═══════════════════════════════════════════════════════════╣');
            console.log(`   Total Devices Notified: ${sentCount}`);
            console.log(`   Bar Devices (First): ${barDevices.filter(d => beverageItems.length > 0).length}`);
            console.log(`   Kitchen Devices (After): ${kitchenDevices.filter(d => kitchenItems.length > 0).length}`);
            console.log(`   Other Devices: ${otherDevices.length}`);
            console.log('╚═══════════════════════════════════════════════════════════╝\n');
            return {
                success: true,
                devicesNotified: sentCount,
                barDevicesFirst: barDevices.length,
                kitchenDevicesAfter: kitchenDevices.length,
                kitchenItems: kitchenItems.length,
                beverageItems: beverageItems.length
            };
        } catch (error) {
            console.error('❌ Broadcast order error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ✅ Helper function untuk check table assignment
    _isTableAssignedToDevice(tableNumber, device) {
        // If no assignments, accept all (backward compatibility)
        if ((!device.assignedAreas || device.assignedAreas.length === 0) &&
            (!device.assignedTables || device.assignedTables.length === 0)) {
            return true;
        }

        // Check exact table match
        if (device.assignedTables && device.assignedTables.includes(tableNumber)) {
            console.log(`   ✅ Table ${tableNumber} directly assigned to ${device.deviceName}`);
            return true;
        }

        // Check area prefix match
        if (device.assignedAreas && device.assignedAreas.length > 0 && tableNumber) {
            const areaPrefix = tableNumber.charAt(0).toUpperCase();
            if (device.assignedAreas.includes(areaPrefix)) {
                console.log(`   ✅ Table ${tableNumber} in assigned area ${areaPrefix} for ${device.deviceName}`);
                return true;
            }
        }

        return false;
    }

    // ✅ Get device by socket ID
    getDevice(socketId) {
        return this.connectedDevices.get(socketId);
    }

    // ✅ Get device by device ID
    getDeviceByDeviceId(deviceId) {
        for (const device of this.connectedDevices.values()) {
            if (device.deviceId === deviceId) {
                return device;
            }
        }
        return null;
    }

    // ✅ Get all devices by outlet
    getDevicesByOutlet(outletId) {
        const devices = [];
        for (const device of this.connectedDevices.values()) {
            if (device.outletId.toString() === outletId.toString()) {
                devices.push(device);
            }
        }
        return devices;
    }

    // ✅ Get devices by role
    getDevicesByRole(role, outletId = null) {
        const devices = [];
        for (const device of this.connectedDevices.values()) {
            if (device.role.includes(role)) {
                if (outletId === null || device.outletId.toString() === outletId.toString()) {
                    devices.push(device);
                }
            }
        }
        return devices;
    }

    // ✅ Get connected devices status
    getConnectedDevicesStatus() {
        const devices = [];
        for (const device of this.connectedDevices.values()) {
            devices.push({
                deviceId: device.deviceId,
                deviceName: device.deviceName,
                role: device.role,
                location: device.location,
                outletId: device.outletId,
                connectedAt: device.connectedAt,
                socketId: device.socketId,
                assignedAreas: device.assignedAreas,
                assignedTables: device.assignedTables
            });
        }
        return {
            totalConnected: devices.length,
            devices: devices
        };
    }

    // ✅ Broadcast to specific workstation type
    async broadcastToWorkstation(workstationType, outletId, eventName, data) {
        try {
            const devices = this.getDevicesByRole(workstationType, outletId);

            console.log(`📡 Broadcasting to ${workstationType}: ${devices.length} device(s)`);

            for (const device of devices) {
                global.io.to(device.socketId).emit(eventName, {
                    ...data,
                    deviceId: device.deviceId,
                    targetDevice: device.deviceName
                });
            }

            return {
                success: true,
                devicesNotified: devices.length
            };
        } catch (error) {
            console.error(`Error broadcasting to ${workstationType}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ✅ Debug: Print all connected devices
    printConnectedDevices() {
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('📱 CONNECTED DEVICES STATUS');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log(`   Total Devices: ${this.connectedDevices.size}`);
        console.log('╠═══════════════════════════════════════════════════════════╣');

        for (const device of this.connectedDevices.values()) {
            console.log(`   Device: ${device.deviceName}`);
            console.log(`   ID: ${device.deviceId}`);
            console.log(`   Role: ${device.role}`);
            console.log(`   Location: ${device.location}`);
            console.log(`   Socket: ${device.socketId}`);
            console.log(`   Areas: ${device.assignedAreas.join(', ') || 'None'}`);
            console.log(`   Tables: ${device.assignedTables.join(', ') || 'None'}`);
            console.log('   ───────────────────────────────────────────────────────');
        }

        console.log('╚═══════════════════════════════════════════════════════════╝');
    }
}

// ✅ Export singleton instance
export const socketManagement = new SocketManagement();

// ✅ Make it globally available
if (typeof global !== 'undefined') {
    global.socketManagement = socketManagement;
}