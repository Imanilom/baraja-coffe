import ProductStock from '../models/modul_menu/ProductStock.model.js';
import Product from '../models/modul_market/Product.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import Assets from '../models/Asset.model.js';
import mongoose from 'mongoose';

class StockOpnameController {
  
  // Mendapatkan stock opname harian
  async getDailyStockOpname(req, res) {
    try {
      const { date, warehouseId } = req.query;
      const targetDate = date ? new Date(date) : new Date();
      
      // Set tanggal untuk hari tersebut (00:00:00 - 23:59:59)
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const matchStage = {
        ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) })
      };

      const stockData = await ProductStock.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouse',
            foreignField: '_id',
            as: 'warehouseInfo'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $unwind: '$warehouseInfo'
        },
        {
          $addFields: {
            // Filter movements untuk hari ini
            todayMovements: {
              $filter: {
                input: '$movements',
                cond: {
                  $and: [
                    { $gte: ['$$this.date', startOfDay] },
                    { $lte: ['$$this.date', endOfDay] }
                  ]
                }
              }
            },
            // Stock awal hari (current stock - movements hari ini)
            beginningStock: {
              $subtract: [
                '$currentStock',
                {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$movements',
                          cond: {
                            $and: [
                              { $gte: ['$$this.date', startOfDay] },
                              { $lte: ['$$this.date', endOfDay] }
                            ]
                          }
                        }
                      },
                      in: {
                        $cond: {
                          if: { $in: ['$$this.type', ['in', 'transfer']] },
                          then: '$$this.quantity',
                          else: { $multiply: ['$$this.quantity', -1] }
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $project: {
            productId: '$product._id',
            productSku: '$product.sku',
            productName: '$product.name',
            productCategory: '$product.category',
            productUnit: '$product.unit',
            warehouseId: '$warehouseInfo._id',
            warehouseName: '$warehouseInfo.name',
            warehouseCode: '$warehouseInfo.code',
            beginningStock: 1,
            currentStock: 1,
            minStock: 1,
            todayMovements: 1,
            // Hitung pergerakan hari ini
            inQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$todayMovements',
                      cond: { $in: ['$$this.type', ['in']] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            outQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$todayMovements',
                      cond: { $in: ['$$this.type', ['out']] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            transferInQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$todayMovements',
                      cond: { 
                        $and: [
                          { $eq: ['$$this.type', 'transfer'] },
                          { $eq: ['$$this.destinationWarehouse', '$warehouse'] }
                        ]
                      }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            transferOutQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$todayMovements',
                      cond: { 
                        $and: [
                          { $eq: ['$$this.type', 'transfer'] },
                          { $eq: ['$$this.sourceWarehouse', '$warehouse'] }
                        ]
                      }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            adjustmentQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$todayMovements',
                      cond: { $eq: ['$$this.type', 'adjustment'] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            }
          }
        },
        {
          $sort: { productCategory: 1, productName: 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          stockOpname: stockData
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching daily stock opname',
        error: error.message
      });
    }
  }

  // Stock opname bulanan 
  async getMonthlyStockOpname(req, res) {
    try {
      const { month, year, warehouseId } = req.query;

      const targetDate = new Date();
      const targetMonth = month ? parseInt(month) - 1 : targetDate.getMonth(); // 0-based
      const targetYear = year ? parseInt(year) : targetDate.getFullYear();

      // Awal bulan
      const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
      // Akhir bulan
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const matchStage = {
        ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) })
      };

      const stockData = await ProductStock.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouse',
            foreignField: '_id',
            as: 'warehouseInfo'
          }
        },
        { $unwind: '$warehouseInfo' },
        {
          $addFields: {
            monthlyMovements: {
              $filter: {
                input: '$movements',
                cond: {
                  $and: [
                    { $gte: ['$$this.date', startOfMonth] },
                    { $lte: ['$$this.date', endOfMonth] }
                  ]
                }
              }
            },
            beginningStock: {
              $subtract: [
                '$currentStock',
                {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$movements',
                          cond: { $lte: ['$$this.date', endOfMonth] }
                        }
                      },
                      in: {
                        $cond: {
                          if: { $in: ['$$this.type', ['in', 'transfer']] },
                          then: '$$this.quantity',
                          else: { $multiply: ['$$this.quantity', -1] }
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $project: {
            productId: '$product._id',
            productSku: '$product.sku',
            productName: '$product.name',
            category: '$product.category',
            unit: '$product.unit',
            warehouseId: '$warehouseInfo._id',
            warehouseName: '$warehouseInfo.name',
            beginningStock: 1,
            currentStock: 1,
            monthlyMovements: 1,
            inQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$monthlyMovements',
                      cond: { $eq: ['$$this.type', 'in'] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            outQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$monthlyMovements',
                      cond: { $eq: ['$$this.type', 'out'] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            transferQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$monthlyMovements',
                      cond: { $eq: ['$$this.type', 'transfer'] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            },
            adjustmentQuantity: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$monthlyMovements',
                      cond: { $eq: ['$$this.type', 'adjustment'] }
                    }
                  },
                  in: '$$this.quantity'
                }
              }
            }
          }
        },
        { $sort: { category: 1, productName: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          month: targetMonth + 1,
          year: targetYear,
          stockOpname: stockData
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching monthly stock opname',
        error: error.message
      });
    }
  }

  // Generate laporan laba rugi berdasarkan pergerakan stock
  async generateProfitLossReport(req, res) {
    try {
      const { startDate, endDate, warehouseId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const matchStage = {
        'movements.date': { $gte: start, $lte: end },
        ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) })
      };

      const profitLossData = await ProductStock.aggregate([
        { $match: matchStage },
        { $unwind: '$movements' },
        {
          $match: {
            'movements.date': { $gte: start, $lte: end }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouse',
            foreignField: '_id',
            as: 'warehouseInfo'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $unwind: '$warehouseInfo'
        },
        {
          $addFields: {
            // Estimasi harga dari supplier terakhir
            estimatedPrice: {
              $ifNull: [
                { $arrayElemAt: ['$product.suppliers.price', 0] },
                0
              ]
            },
            movementValue: {
              $multiply: [
                '$movements.quantity',
                {
                  $ifNull: [
                    { $arrayElemAt: ['$product.suppliers.price', 0] },
                    0
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              category: '$product.category',
              warehouse: '$warehouseInfo.name',
              movementType: '$movements.type'
            },
            totalQuantity: { $sum: '$movements.quantity' },
            totalValue: { $sum: '$movementValue' },
            items: {
              $push: {
                productName: '$product.name',
                sku: '$product.sku',
                quantity: '$movements.quantity',
                estimatedPrice: '$estimatedPrice',
                value: '$movementValue',
                date: '$movements.date',
                notes: '$movements.notes'
              }
            }
          }
        },
        {
          $group: {
            _id: {
              category: '$_id.category',
              warehouse: '$_id.warehouse'
            },
            movements: {
              $push: {
                type: '$_id.movementType',
                totalQuantity: '$totalQuantity',
                totalValue: '$totalValue',
                items: '$items'
              }
            },
            totalInValue: {
              $sum: {
                $cond: {
                  if: { $in: ['$_id.movementType', ['in']] },
                  then: '$totalValue',
                  else: 0
                }
              }
            },
            totalOutValue: {
              $sum: {
                $cond: {
                  if: { $in: ['$_id.movementType', ['out']] },
                  then: '$totalValue',
                  else: 0
                }
              }
            },
            totalAdjustmentValue: {
              $sum: {
                $cond: {
                  if: { $eq: ['$_id.movementType', 'adjustment'] },
                  then: '$totalValue',
                  else: 0
                }
              }
            }
          }
        },
        {
          $project: {
            category: '$_id.category',
            warehouse: '$_id.warehouse',
            movements: 1,
            totalInValue: 1,
            totalOutValue: 1,
            totalAdjustmentValue: 1,
            netValue: {
              $subtract: [
                { $add: ['$totalInValue', '$totalAdjustmentValue'] },
                '$totalOutValue'
              ]
            }
          }
        },
        {
          $sort: { category: 1, warehouse: 1 }
        }
      ]);

      // Hitung summary
      const summary = profitLossData.reduce((acc, item) => {
        acc.totalInValue += item.totalInValue;
        acc.totalOutValue += item.totalOutValue;
        acc.totalAdjustmentValue += item.totalAdjustmentValue;
        acc.netValue += item.netValue;
        return acc;
      }, {
        totalInValue: 0,
        totalOutValue: 0,
        totalAdjustmentValue: 0,
        netValue: 0
      });

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate,
            endDate: endDate
          },
          summary,
          details: profitLossData
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating profit loss report',
        error: error.message
      });
    }
  }

  // Generate laporan neraca (balance sheet) inventory
  async generateBalanceSheet(req, res) {
        try {
            const { date, warehouseId } = req.query;
            const asOfDate = date ? new Date(date) : new Date();
            asOfDate.setHours(23, 59, 59, 999);

            const matchStageInventory = {
                ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) })
            };

            // 1. Ambil data Inventaris (Stock Opname)
            const balanceData = await ProductStock.aggregate([
                { $match: matchStageInventory },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $lookup: {
                        from: 'warehouses',
                        localField: 'warehouse',
                        foreignField: '_id',
                        as: 'warehouseInfo'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $unwind: '$warehouseInfo'
                },
                {
                    $addFields: {
                        // Hitung stock pada tanggal tertentu
                        stockAsOfDate: {
                            $subtract: [
                                '$currentStock',
                                {
                                    $sum: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$movements',
                                                    cond: { $gt: ['$$this.date', asOfDate] }
                                                }
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $in: ['$$this.type', ['in', 'transfer']] },
                                                    then: '$$this.quantity',
                                                    else: { $multiply: ['$$this.quantity', -1] }
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        estimatedPrice: {
                            $ifNull: [
                                { $arrayElemAt: ['$product.suppliers.price', 0] },
                                0
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        stockValue: {
                            $multiply: ['$stockAsOfDate', '$estimatedPrice']
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            category: '$product.category',
                            warehouse: '$warehouseInfo.name'
                        },
                        items: {
                            $push: {
                                productId: '$product._id',
                                sku: '$product.sku',
                                name: '$product.name',
                                unit: '$product.unit',
                                quantity: '$stockAsOfDate',
                                estimatedPrice: '$estimatedPrice',
                                value: '$stockValue',
                                minStock: '$minStock'
                            }
                        },
                        totalQuantity: { $sum: '$stockAsOfDate' },
                        totalValue: { $sum: '$stockValue' }
                    }
                },
                {
                    $group: {
                        _id: '$_id.category',
                        warehouses: {
                            $push: {
                                warehouse: '$_id.warehouse',
                                items: '$items',
                                totalQuantity: '$totalQuantity',
                                totalValue: '$totalValue'
                            }
                        },
                        categoryTotalValue: { $sum: '$totalValue' }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            // Hitung grand total Inventaris
            const grandTotalInventory = balanceData.reduce((acc, category) => {
                acc.totalValue += category.categoryTotalValue;
                return acc;
            }, { totalValue: 0 });

            // 2. Ambil data Aset (Assets)
            // Asumsi model Assets memiliki virtual field 'totalValue' = quantity * price
            const matchStageAssets = {
                isActive: true, // Hanya aset yang aktif
                ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) })
            };
            
            // Mengambil aset, populating warehouse name
            const assetData = await Assets.find(matchStageAssets)
                .populate('warehouse', 'name code') // Ambil info gudang
                .lean(); // Mengubah hasil query menjadi objek JavaScript biasa

            // Menghitung total nilai Aset (menggunakan totalValue dari virtual field atau perhitungan manual)
            // Jika menggunakan .lean(), virtual field tidak otomatis ada, jadi kita hitung manual:
            let totalAssetValue = 0;
            const assetsByCategory = assetData.reduce((acc, asset) => {
                const value = asset.quantity * asset.price; // Hitung totalValue manual
                totalAssetValue += value;
                
                const category = asset.category || 'Uncategorized';
                if (!acc[category]) {
                    acc[category] = {
                        category: category,
                        items: [],
                        categoryTotalValue: 0
                    };
                }

                acc[category].items.push({
                    name: asset.name,
                    code: asset.code,
                    unit: asset.unit,
                    quantity: asset.quantity,
                    price: asset.price,
                    warehouseName: asset.warehouse ? asset.warehouse.name : 'N/A',
                    value: value
                });
                acc[category].categoryTotalValue += value;
                return acc;
            }, {});

            const assetsArray = Object.values(assetsByCategory).sort((a, b) => a.category.localeCompare(b.category));
            
            // 3. Gabungkan hasil
            const grandTotalAssets = {
                totalValue: totalAssetValue
            };
            
            const grandTotalCombined = {
                totalValue: grandTotalInventory.totalValue + grandTotalAssets.totalValue
            };

            // Identifikasi stock kritis (tetap dipertahankan)
            const criticalStock = await ProductStock.aggregate([
                { $match: matchStageInventory },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $match: {
                        $expr: { $lte: ['$currentStock', '$minStock'] }
                    }
                },
                {
                    $project: {
                        productName: '$product.name',
                        sku: '$product.sku',
                        currentStock: 1,
                        minStock: 1,
                        shortage: { $subtract: ['$minStock', '$currentStock'] }
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    asOfDate: asOfDate.toISOString().split('T')[0],
                    inventory: {
                        byCategory: balanceData,
                        grandTotal: grandTotalInventory,
                        criticalStock
                    },
                    assets: { // BAGIAN BARU UNTUK ASET
                        byCategory: assetsArray,
                        grandTotal: grandTotalAssets
                    },
                    grandTotalCombined: grandTotalCombined // TOTAL KESELURUHAN ASET
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error generating balance sheet',
                error: error.message
            });
        }
    }


  // Generate laporan pergerakan stock (stock movement report)
  async generateStockMovementReport(req, res) {
    try {
      const { startDate, endDate, warehouseId, productId, movementType } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const matchStage = {
        'movements.date': { $gte: start, $lte: end },
        ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) }),
        ...(productId && { productId: new mongoose.Types.ObjectId(productId) })
      };

      const movementData = await ProductStock.aggregate([
        { $match: matchStage },
        { $unwind: '$movements' },
        {
          $match: {
            'movements.date': { $gte: start, $lte: end },
            ...(movementType && { 'movements.type': movementType })
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouse',
            foreignField: '_id',
            as: 'warehouseInfo'
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'movements.sourceWarehouse',
            foreignField: '_id',
            as: 'sourceWarehouseInfo'
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'movements.destinationWarehouse',
            foreignField: '_id',
            as: 'destinationWarehouseInfo'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $unwind: '$warehouseInfo'
        },
        {
          $project: {
            date: '$movements.date',
            productSku: '$product.sku',
            productName: '$product.name',
            category: '$product.category',
            warehouse: '$warehouseInfo.name',
            movementType: '$movements.type',
            quantity: '$movements.quantity',
            referenceId: '$movements.referenceId',
            notes: '$movements.notes',
            handledBy: '$movements.handledBy',
            sourceWarehouse: {
              $ifNull: [
                { $arrayElemAt: ['$sourceWarehouseInfo.name', 0] },
                null
              ]
            },
            destinationWarehouse: {
              $ifNull: [
                { $arrayElemAt: ['$destinationWarehouseInfo.name', 0] },
                null
              ]
            }
          }
        },
        {
          $sort: { date: -1, productName: 1 }
        }
      ]);

      // Summary by movement type
      const summary = movementData.reduce((acc, movement) => {
        if (!acc[movement.movementType]) {
          acc[movement.movementType] = {
            count: 0,
            totalQuantity: 0
          };
        }
        acc[movement.movementType].count++;
        acc[movement.movementType].totalQuantity += movement.quantity;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate,
            endDate: endDate
          },
          summary,
          totalMovements: movementData.length,
          movements: movementData
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating stock movement report',
        error: error.message
      });
    }
  }

  // Generate laporan aging inventory
  async generateInventoryAgingReport(req, res) {
    try {
      const { warehouseId } = req.query;
      const currentDate = new Date();

      const matchStage = {
        ...(warehouseId && { warehouse: new mongoose.Types.ObjectId(warehouseId) })
      };

      const agingData = await ProductStock.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouse',
            foreignField: '_id',
            as: 'warehouseInfo'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $unwind: '$warehouseInfo'
        },
        {
          $addFields: {
            lastMovementDate: {
              $max: '$movements.date'
            }
          }
        },
        {
          $addFields: {
            daysSinceLastMovement: {
              $divide: [
                { $subtract: [currentDate, '$lastMovementDate'] },
                86400000 // milliseconds in a day
              ]
            }
          }
        },
        {
          $addFields: {
            agingCategory: {
              $switch: {
                branches: [
                  { case: { $lte: ['$daysSinceLastMovement', 30] }, then: '0-30 days' },
                  { case: { $lte: ['$daysSinceLastMovement', 60] }, then: '31-60 days' },
                  { case: { $lte: ['$daysSinceLastMovement', 90] }, then: '61-90 days' },
                  { case: { $lte: ['$daysSinceLastMovement', 180] }, then: '91-180 days' }
                ],
                default: '180+ days'
              }
            }
          }
        },
        {
          $project: {
            productSku: '$product.sku',
            productName: '$product.name',
            category: '$product.category',
            warehouse: '$warehouseInfo.name',
            currentStock: 1,
            lastMovementDate: 1,
            daysSinceLastMovement: { $round: ['$daysSinceLastMovement', 0] },
            agingCategory: 1
          }
        },
        {
          $sort: { daysSinceLastMovement: -1 }
        }
      ]);

      // Group by aging category
      const agingSummary = agingData.reduce((acc, item) => {
        if (!acc[item.agingCategory]) {
          acc[item.agingCategory] = {
            count: 0,
            totalStock: 0,
            items: []
          };
        }
        acc[item.agingCategory].count++;
        acc[item.agingCategory].totalStock += item.currentStock;
        acc[item.agingCategory].items.push(item);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          asOfDate: currentDate.toISOString().split('T')[0],
          agingSummary,
          totalItems: agingData.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating inventory aging report',
        error: error.message
      });
    }
  }
}

export default new StockOpnameController();