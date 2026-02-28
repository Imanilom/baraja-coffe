import AutoPromo from '../models/AutoPromo.model.js';
import mongoose from 'mongoose';

/**
 * ✅ PROCESS SELECTED PROMOS (ALL TYPES)
 */
export async function processSelectedPromos(promoSelections, orderItems, outlet, session) {
    let totalDiscount = 0;
    const appliedPromos = [];
    const usedItems = [];
    const freeItems = [];

    console.log('🔍 PROCESSING CASHIER SELECTED PROMOS:', {
        count: promoSelections.length,
        selections: promoSelections.map(ps => ({
            promoId: ps.promoId,
            type: ps.promoType,
            bundleSets: ps.bundleSets,
            selectedItems: ps.selectedItems?.length || 0
        }))
    });

    for (const promoSelection of promoSelections) {
        try {
            // Cari promo dari database
            const promo = await AutoPromo.findById(promoSelection.promoId)
                .populate('conditions.bundleProducts.product')
                .populate('conditions.buyProduct')
                .populate('conditions.getProduct')
                .populate('conditions.products')
                .session(session);

            if (!promo) {
                console.warn(`❌ Promo ${promoSelection.promoId} not found`);
                continue;
            }

            // Validasi tipe promo yang diizinkan untuk kasir
            const allowedTypes = ['bundling', 'buy_x_get_y', 'product_specific'];
            if (!allowedTypes.includes(promo.promoType)) {
                console.warn(`❌ Promo type ${promo.promoType} not selectable by cashier`);
                continue;
            }

            let promoResult = { applied: false, discount: 0 };

            // PROSES BERDASARKAN JENIS PROMO
            switch (promo.promoType) {
                case 'bundling':
                    promoResult = await applySelectedBundling(
                        promo,
                        orderItems,
                        promoSelection.bundleSets || 1,
                        usedItems
                    );
                    break;

                case 'buy_x_get_y':
                    promoResult = await applySelectedBuyXGetY(
                        promo,
                        orderItems,
                        promoSelection.selectedItems || [],
                        usedItems
                    );
                    break;

                case 'product_specific':
                    promoResult = await applySelectedProductSpecific(
                        promo,
                        orderItems,
                        promoSelection.selectedItems || [],
                        usedItems
                    );
                    break;

                default:
                    console.warn(`❌ Unsupported promo type: ${promo.promoType}`);
                    continue;
            }

            if (promoResult.applied && promoResult.discount > 0) {
                totalDiscount += promoResult.discount;

                // Track used items untuk mencegah double counting
                if (promoResult.usedItems) {
                    promoResult.usedItems.forEach(usedItem => {
                        const existingIndex = usedItems.findIndex(item =>
                            item.menuItem.toString() === usedItem.menuItem.toString()
                        );

                        if (existingIndex >= 0) {
                            usedItems[existingIndex].quantityUsed += usedItem.quantityUsed;
                        } else {
                            usedItems.push(usedItem);
                        }
                    });
                }

                // Add free items jika ada (untuk Buy X Get Y)
                if (promoResult.freeItems) {
                    freeItems.push(...promoResult.freeItems);
                }

                // Format applied promo
                const appliedPromo = {
                    promoId: promo._id,
                    promoName: promo.name,
                    promoType: promo.promoType,
                    bundleSets: promoSelection.bundleSets,
                    discount: promoResult.discount, // ✅ FIX: Match schema field name
                    affectedItems: promoResult.affectedItems || [],
                    freeItems: promoResult.freeItems || []
                };

                appliedPromos.push(appliedPromo);

                console.log(`✅ ${promo.promoType} promo applied: ${promo.name}`, {
                    discount: promoResult.discount,
                    affectedItems: appliedPromo.affectedItems.length,
                    freeItems: appliedPromo.freeItems.length
                });
            } else {
                console.warn(`❌ Promo not applied: ${promo.name}`, promoResult.reason);
            }
        } catch (error) {
            console.error(`❌ Error processing promo ${promoSelection.promoId}:`, error);
            throw new Error(`Failed to process promo ${promoSelection.promoId}: ${error.message}`);
        }
    }

    return {
        totalDiscount,
        appliedPromos,
        usedItems,
        freeItems
    };
}

/**
 * ✅ APPLY SELECTED BUNDLING
 */
async function applySelectedBundling(promo, orderItems, bundleSets, alreadyUsedItems = []) {
    const bundleProducts = promo.conditions?.bundleProducts || [];

    if (!bundleProducts || bundleProducts.length === 0) {
        return {
            applied: false,
            discount: 0,
            reason: 'No bundle products defined'
        };
    }

    console.log('📦 Applying Bundling Promo:', {
        promoName: promo.name,
        bundlePrice: promo.bundlePrice,
        requestedSets: bundleSets,
        products: bundleProducts.map(bp => ({
            name: bp.product?.name,
            quantity: bp.quantity
        }))
    });

    // Hitung maksimal bundle sets yang bisa dibuat
    let maxPossibleSets = Infinity;

    for (const bundleProduct of bundleProducts) {
        if (!bundleProduct.product) {
            console.warn('Bundle product missing product reference');
            return {
                applied: false,
                discount: 0,
                reason: 'Bundle product configuration error'
            };
        }

        const productId = bundleProduct.product._id.toString();

        // Cari item di keranjang
        const cartItem = orderItems.find(item =>
            item.menuItem && item.menuItem.toString() === productId
        );

        if (!cartItem) {
            console.log('❌ Missing product in cart:', bundleProduct.product.name);
            return {
                applied: false,
                discount: 0,
                reason: `Missing product: ${bundleProduct.product.name}`
            };
        }

        // Kurangi quantity yang sudah digunakan di promo lain
        const alreadyUsed = alreadyUsedItems.find(item =>
            item.menuItem.toString() === productId
        );

        const alreadyUsedQuantity = alreadyUsed ? alreadyUsed.quantityUsed : 0;
        const availableQuantity = cartItem.quantity - alreadyUsedQuantity;
        const requiredQuantity = bundleProduct.quantity * bundleSets;

        if (availableQuantity < requiredQuantity) {
            console.log('❌ Insufficient quantity:', {
                product: bundleProduct.product.name,
                required: requiredQuantity,
                available: availableQuantity,
                alreadyUsed: alreadyUsedQuantity
            });
            return {
                applied: false,
                discount: 0,
                reason: `Insufficient quantity for ${bundleProduct.product.name}`
            };
        }

        const setsForThisProduct = Math.floor(availableQuantity / bundleProduct.quantity);
        maxPossibleSets = Math.min(maxPossibleSets, setsForThisProduct);
    }

    const actualSets = Math.min(maxPossibleSets, bundleSets);

    if (actualSets === 0) {
        return {
            applied: false,
            discount: 0,
            reason: 'No complete sets available'
        };
    }

    // Hitung total discount
    let originalBundlePrice = 0;
    const productDetails = [];

    for (const bundleProduct of bundleProducts) {
        const productTotal = bundleProduct.product.price * bundleProduct.quantity * actualSets;
        originalBundlePrice += productTotal;

        productDetails.push({
            product: bundleProduct.product.name,
            quantity: bundleProduct.quantity * actualSets,
            price: bundleProduct.product.price,
            total: productTotal
        });
    }

    const discountedBundlePrice = promo.bundlePrice * actualSets;
    const discount = originalBundlePrice - discountedBundlePrice;

    // Track used items dan hitung discount share per item
    const usedItems = [];
    const affectedItems = [];

    for (const bundleProduct of bundleProducts) {
        const productId = bundleProduct.product._id.toString();
        const quantityUsed = bundleProduct.quantity * actualSets;

        usedItems.push({
            menuItem: bundleProduct.product._id,
            menuItemName: bundleProduct.product.name,
            quantityUsed: quantityUsed
        });

        // Hitung discount share untuk item ini
        const itemOriginalTotal = bundleProduct.product.price * quantityUsed;
        const itemDiscountShare = (itemOriginalTotal / originalBundlePrice) * discount;

        affectedItems.push({
            menuItem: bundleProduct.product._id,
            menuItemName: bundleProduct.product.name,
            quantity: quantityUsed,
            discountShare: itemDiscountShare,
            originalSubtotal: itemOriginalTotal,
            discountedSubtotal: itemOriginalTotal - itemDiscountShare
        });
    }

    console.log('✅ Bundling applied successfully:', {
        promo: promo.name,
        requestedSets: bundleSets,
        actualSets,
        originalPrice: originalBundlePrice,
        bundlePrice: discountedBundlePrice,
        discount,
        productDetails
    });

    return {
        applied: true,
        discount,
        affectedItems,
        usedItems
    };
}

/**
 * ✅ APPLY SELECTED BUY X GET Y
 */
async function applySelectedBuyXGetY(promo, orderItems, selectedItems, alreadyUsedItems = []) {
    const { buyProduct, getProduct, minQuantity = 1 } = promo.conditions;

    if (!buyProduct || !getProduct) {
        return {
            applied: false,
            discount: 0,
            reason: 'Promo configuration incomplete: missing buyProduct or getProduct'
        };
    }

    console.log('🎁 Applying Buy X Get Y:', {
        promoName: promo.name,
        buyProduct: buyProduct.name,
        getProduct: getProduct.name,
        minQuantity,
        selectedItemsCount: selectedItems.length
    });

    // Cari item yang dipilih kasir untuk promo ini
    const selectedBuyItem = selectedItems.find(item =>
        item.menuItemId && item.menuItemId.toString() === buyProduct._id.toString()
    );

    if (!selectedBuyItem || !selectedBuyItem.quantity) {
        return {
            applied: false,
            discount: 0,
            reason: 'No buy items selected for this promo'
        };
    }

    // Cari item di keranjang
    const buyItemInCart = orderItems.find(item =>
        item.menuItem && item.menuItem.toString() === buyProduct._id.toString()
    );

    if (!buyItemInCart) {
        return {
            applied: false,
            discount: 0,
            reason: `Buy product ${buyProduct.name} not found in cart`
        };
    }

    // Cek quantity mencukupi (kurangi yang sudah digunakan di promo lain)
    const alreadyUsed = alreadyUsedItems.find(item =>
        item.menuItem.toString() === buyProduct._id.toString()
    );

    const alreadyUsedQuantity = alreadyUsed ? alreadyUsed.quantityUsed : 0;
    const availableQuantity = buyItemInCart.quantity - alreadyUsedQuantity;

    if (availableQuantity < selectedBuyItem.quantity) {
        return {
            applied: false,
            discount: 0,
            reason: `Insufficient quantity. Available: ${availableQuantity}, Selected: ${selectedBuyItem.quantity}`
        };
    }

    // Validasi minimal quantity
    if (selectedBuyItem.quantity < minQuantity) {
        return {
            applied: false,
            discount: 0,
            reason: `Minimum quantity required: ${minQuantity}`
        };
    }

    // Hitung berapa set yang didapat
    const sets = Math.floor(selectedBuyItem.quantity / minQuantity);
    if (sets === 0) {
        return {
            applied: false,
            discount: 0,
            reason: `Not enough items for promo. Need ${minQuantity} per set`
        };
    }

    // Hitung discount (harga getProduct * jumlah free items)
    const freeItemPrice = getProduct.price || 0;
    const discount = freeItemPrice * sets;

    // Track used items
    const usedItems = [{
        menuItem: buyProduct._id,
        menuItemName: buyProduct.name,
        quantityUsed: selectedBuyItem.quantity
    }];

    // Format affected items
    const affectedItems = [{
        menuItem: buyProduct._id,
        menuItemName: buyProduct.name,
        quantity: selectedBuyItem.quantity,
        originalSubtotal: (buyItemInCart.subtotal / buyItemInCart.quantity) * selectedBuyItem.quantity,
        discountedSubtotal: (buyItemInCart.subtotal / buyItemInCart.quantity) * selectedBuyItem.quantity,
        isTriggerItem: true
    }];

    // Format free items
    const freeItems = [{
        menuItem: getProduct._id,
        menuItemName: getProduct.name,
        quantity: sets,
        price: freeItemPrice,
        isFree: true,
        freeItemSubtotal: freeItemPrice * sets
    }];

    console.log('✅ Buy X Get Y applied successfully:', {
        buyProduct: buyProduct.name,
        buyQuantity: selectedBuyItem.quantity,
        getProduct: getProduct.name,
        freeQuantity: sets,
        discount,
        minQuantityPerSet: minQuantity
    });

    return {
        applied: true,
        discount,
        affectedItems,
        freeItems,
        usedItems
    };
}

/**
 * ✅ APPLY SELECTED PRODUCT SPECIFIC
 */
async function applySelectedProductSpecific(promo, orderItems, selectedItems, alreadyUsedItems = []) {
    const { discount: promoDiscount, discountType } = promo;
    const promoProducts = promo.conditions.products || [];

    if (!promoDiscount || !discountType) {
        return {
            applied: false,
            discount: 0,
            reason: 'Promo configuration incomplete: missing discount or discountType'
        };
    }

    console.log('🏷️ Applying Product Specific Promo:', {
        promoName: promo.name,
        discountType,
        discountValue: promoDiscount,
        eligibleProductsCount: promoProducts.length,
        selectedItemsCount: selectedItems.length
    });

    if (selectedItems.length === 0) {
        return {
            applied: false,
            discount: 0,
            reason: 'No items selected for this promo'
        };
    }

    let totalDiscount = 0;
    const affectedItems = [];
    const usedItems = [];

    // Buat map untuk cek cepat apakah item eligible
    const eligibleProductIds = new Set(
        promoProducts.map(p => p._id.toString())
    );

    for (const selectedItem of selectedItems) {
        if (!selectedItem.menuItemId || !selectedItem.quantity) {
            console.warn('Skipping invalid selected item:', selectedItem);
            continue;
        }

        const selectedItemId = selectedItem.menuItemId.toString();

        // 1. Cek apakah item termasuk dalam promo
        if (!eligibleProductIds.has(selectedItemId)) {
            console.warn(`Item ${selectedItemId} not eligible for promo: ${promo.name}`);
            continue;
        }

        // 2. Cari item di keranjang
        const cartItem = orderItems.find(item =>
            item.menuItem && item.menuItem.toString() === selectedItemId
        );

        if (!cartItem) {
            console.warn(`Item ${selectedItemId} not found in cart`);
            continue;
        }

        // 3. Cek quantity tidak melebihi yang ada di keranjang
        const alreadyUsed = alreadyUsedItems.find(item =>
            item.menuItem.toString() === selectedItemId
        );

        const alreadyUsedQuantity = alreadyUsed ? alreadyUsed.quantityUsed : 0;
        const availableQuantity = cartItem.quantity - alreadyUsedQuantity;

        const applicableQuantity = Math.min(selectedItem.quantity, availableQuantity);

        if (applicableQuantity <= 0) {
            console.warn(`No available quantity for item ${cartItem.menuItemName}`);
            continue;
        }

        // 4. Hitung subtotal untuk quantity yang dipilih
        const pricePerUnit = cartItem.subtotal / cartItem.quantity;
        const subtotalForPromo = pricePerUnit * applicableQuantity;

        // 5. Hitung discount berdasarkan discountType
        let itemDiscount = 0;

        if (discountType === 'percentage') {
            itemDiscount = (promoDiscount / 100) * subtotalForPromo;
        } else if (discountType === 'fixed') {
            itemDiscount = promoDiscount * applicableQuantity;

            if (itemDiscount > subtotalForPromo) {
                itemDiscount = subtotalForPromo;
            }
        }

        totalDiscount += itemDiscount;

        // 6. Format affected item
        affectedItems.push({
            menuItem: selectedItemId,
            menuItemName: cartItem.menuItemName,
            quantity: applicableQuantity,
            originalSubtotal: subtotalForPromo,
            discountAmount: itemDiscount,
            discountedSubtotal: subtotalForPromo - itemDiscount,
            discountType,
            discountValue: promoDiscount,
            discountPercentage: discountType === 'percentage' ? promoDiscount : undefined
        });

        // 7. Track used items
        usedItems.push({
            menuItem: selectedItemId,
            menuItemName: cartItem.menuItemName,
            quantityUsed: applicableQuantity
        });

        console.log(`✅ Applied discount to ${cartItem.menuItemName}:`, {
            quantity: applicableQuantity,
            subtotal: subtotalForPromo,
            discount: itemDiscount,
            discountType
        });
    }

    const result = {
        applied: affectedItems.length > 0,
        discount: totalDiscount,
        affectedItems,
        usedItems
    };

    console.log('📊 Product Specific Promo Result:', {
        applied: result.applied,
        totalDiscount: result.discount,
        affectedItemsCount: result.affectedItems.length,
        discountType
    });

    return result;
}

/**
 * ✅ VALIDATE PROMO SELECTION
 */
export async function validatePromoSelection(promoSelections, orderItems, outletId) {
    const validationResults = [];

    for (const selection of promoSelections) {
        try {
            const promo = await AutoPromo.findById(selection.promoId)
                .populate('conditions.bundleProducts.product')
                .populate('conditions.buyProduct')
                .populate('conditions.getProduct')
                .populate('conditions.products');

            if (!promo) {
                validationResults.push({
                    promoId: selection.promoId,
                    valid: false,
                    error: 'Promo not found'
                });
                continue;
            }

            let validationResult = { valid: true };

            switch (promo.promoType) {
                case 'bundling':
                    validationResult = await validateBundlingSelection(promo, orderItems, selection.bundleSets);
                    break;
                case 'buy_x_get_y':
                    validationResult = await validateBuyXGetYSelection(promo, orderItems, selection.selectedItems);
                    break;
                case 'product_specific':
                    validationResult = await validateProductSpecificSelection(promo, orderItems, selection.selectedItems);
                    break;
                default:
                    validationResult = { valid: false, error: `Unsupported promo type: ${promo.promoType}` };
            }

            validationResults.push({
                promoId: selection.promoId,
                promoName: promo.name,
                promoType: promo.promoType,
                ...validationResult
            });

        } catch (error) {
            validationResults.push({
                promoId: selection.promoId,
                valid: false,
                error: error.message
            });
        }
    }

    return validationResults;
}

async function validateBundlingSelection(promo, orderItems, bundleSets) {
    const bundleProducts = promo.conditions.bundleProducts || [];

    if (!bundleSets || bundleSets < 1) {
        return { valid: false, error: 'Bundle sets must be at least 1' };
    }

    for (const bundleProduct of bundleProducts) {
        const cartItem = orderItems.find(item =>
            item.menuItem.toString() === bundleProduct.product._id.toString()
        );

        if (!cartItem) {
            return {
                valid: false,
                error: `Product ${bundleProduct.product.name} not found in cart`
            };
        }

        if (cartItem.quantity < (bundleProduct.quantity * bundleSets)) {
            return {
                valid: false,
                error: `Insufficient quantity for ${bundleProduct.product.name}. Required: ${bundleProduct.quantity * bundleSets}, Available: ${cartItem.quantity}`
            };
        }
    }

    return { valid: true };
}

async function validateBuyXGetYSelection(promo, orderItems, selectedItems) {
    const { buyProduct, getProduct, minQuantity = 1 } = promo.conditions;

    if (!selectedItems || selectedItems.length === 0) {
        return { valid: false, error: 'No items selected for this promo' };
    }

    const selectedBuyItem = selectedItems.find(item =>
        item.menuItemId.toString() === buyProduct._id.toString()
    );

    if (!selectedBuyItem) {
        return { valid: false, error: `Buy product ${buyProduct.name} not selected` };
    }

    const cartItem = orderItems.find(item =>
        item.menuItem.toString() === buyProduct._id.toString()
    );

    if (!cartItem) {
        return { valid: false, error: `Buy product ${buyProduct.name} not found in cart` };
    }

    if (cartItem.quantity < selectedBuyItem.quantity) {
        return {
            valid: false,
            error: `Insufficient quantity for ${buyProduct.name}. Selected: ${selectedBuyItem.quantity}, Available: ${cartItem.quantity}`
        };
    }

    if (selectedBuyItem.quantity < minQuantity) {
        return {
            valid: false,
            error: `Minimum quantity required: ${minQuantity}`
        };
    }

    return { valid: true };
}

async function validateProductSpecificSelection(promo, orderItems, selectedItems) {
    const promoProducts = promo.conditions.products || [];

    if (!selectedItems || selectedItems.length === 0) {
        return { valid: false, error: 'No items selected for this promo' };
    }

    const eligibleProductIds = new Set(
        promoProducts.map(p => p._id.toString())
    );

    for (const selectedItem of selectedItems) {
        if (!eligibleProductIds.has(selectedItem.menuItemId.toString())) {
            return {
                valid: false,
                error: `Product ${selectedItem.menuItemId} not eligible for this promo`
            };
        }

        const cartItem = orderItems.find(item =>
            item.menuItem.toString() === selectedItem.menuItemId.toString()
        );

        if (!cartItem) {
            return {
                valid: false,
                error: `Product ${selectedItem.menuItemId} not found in cart`
            };
        }

        if (cartItem.quantity < selectedItem.quantity) {
            return {
                valid: false,
                error: `Insufficient quantity for item. Selected: ${selectedItem.quantity}, Available: ${cartItem.quantity}`
            };
        }
    }

    return { valid: true };
}

export default {
    processSelectedPromos,
    validatePromoSelection
};