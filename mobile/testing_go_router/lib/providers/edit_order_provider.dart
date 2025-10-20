import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/edit_order_request.model.dart';
import 'package:kasirbaraja/models/edit_order_item_wrapper.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/services/order_service.dart';
// import 'package:kasirbaraja/services/api_service.dart';

final editOrderStateProviderV2 =
    StateNotifierProvider<EditOrderStateNotifierV2, EditOrderStateV2>((ref) {
      return EditOrderStateNotifierV2();
    });

class EditOrderStateV2 {
  final OrderDetailModel? originalOrder;
  final List<EditableOrderItem>
  currentOrderItems; // Daftar item untuk ditampilkan di kolom kanan
  final List<Operation> pendingOperations; // Operasi untuk dikirim ke API
  final bool isSubmitting;
  final String? errorMessage;

  EditOrderStateV2({
    this.originalOrder,
    this.currentOrderItems = const [],
    this.pendingOperations = const [],
    this.isSubmitting = false,
    this.errorMessage,
  });

  EditOrderStateV2 copyWith({
    OrderDetailModel? originalOrder,
    List<EditableOrderItem>? currentOrderItems,
    List<Operation>? pendingOperations,
    bool? isSubmitting,
    String? errorMessage,
  }) {
    return EditOrderStateV2(
      originalOrder: originalOrder ?? this.originalOrder,
      currentOrderItems: currentOrderItems ?? this.currentOrderItems,
      pendingOperations: pendingOperations ?? this.pendingOperations,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class EditOrderStateNotifierV2 extends StateNotifier<EditOrderStateV2> {
  EditOrderStateNotifierV2() : super(EditOrderStateV2());

  void setOriginalOrder(OrderDetailModel order) {
    final initialItems =
        order.items
            .map(
              (item) => EditableOrderItem(
                item: item,
                changeType: ItemChangeType.original,
                isOriginal: true,
              ),
            )
            .toList();
    state = state.copyWith(
      originalOrder: order,
      currentOrderItems: initialItems,
      pendingOperations: [],
      errorMessage: null,
    );
  }

  // --- LOGIKA TAMBAH ITEM ---
  void addItemToOrder(OrderItemModel newItem) {
    // Cek apakah item ini SAMA PERSIS dengan item yang sudah ada di currentOrderItems
    final existingItemIndex = state.currentOrderItems.indexWhere(
      (item) =>
          item.uniqueId == newItem.uniqueId &&
          item.changeType != ItemChangeType.removed,
    );

    if (existingItemIndex != -1) {
      // Item sudah ada dan tidak dihapus -> Update qty
      final existingItem = state.currentOrderItems[existingItemIndex];
      final updatedItem = existingItem.copyWith(
        item: existingItem.item.copyWith(
          quantity: existingItem.item.quantity + newItem.quantity,
        ),
        changeType:
            existingItem.isOriginal
                ? ItemChangeType.modified
                : ItemChangeType.added, // Jika bukan original, tetap added
      );

      final newCurrentItems = List<EditableOrderItem>.from(
        state.currentOrderItems,
      );
      newCurrentItems[existingItemIndex] = updatedItem;

      // Perbarui atau tambah operasi UPDATE atau ADD di pendingOperations
      final existingOpIndex = state.pendingOperations.indexWhere((op) {
        if (op is UpdateOperation) {
          return op.itemId == existingItem.item.menuItem.id;
        }
        if (op is AddOperation) {
          return OrderItemModelForRequest.fromOrderItemModel(
                op.item,
              ).uniqueId ==
              newItem.uniqueId;
        }
        return false;
      });

      List<Operation> newPendingOps = List<Operation>.from(
        state.pendingOperations,
      );
      if (existingOpIndex != -1) {
        // Update operasi yang sudah ada
        final op = newPendingOps[existingOpIndex];
        if (op is UpdateOperation) {
          newPendingOps[existingOpIndex] = op.copyWith(
            patch: {...op.patch, 'quantity': updatedItem.item.quantity},
          );
        } else if (op is AddOperation) {
          newPendingOps[existingOpIndex] = Operation.add(
            item: OrderItemModelForRequest.fromOrderItemModel(updatedItem.item),
          );
        }
      } else {
        // Tambah operasi baru (UPDATE jika original, ADD jika bukan)
        if (existingItem.isOriginal) {
          newPendingOps.add(
            Operation.update(
              itemId: existingItem.item.menuItem.id,
              patch: {'quantity': updatedItem.item.quantity},
            ),
          );
        } else {
          // Jika item yang ditambahkan sebelumnya (bukan original) dan qty-nya bertambah
          // Kita perlu update operasi ADD nya
          newPendingOps.add(
            Operation.add(
              item: OrderItemModelForRequest.fromOrderItemModel(
                updatedItem.item,
              ),
            ),
          );
          // Hapus operasi ADD lama jika ada (ini agak tricky, bisa diabaikan dulu, atau hapus yang lama dan tambah baru)
          // Solusi sederhana: Biarkan operasi ADD pertama, dan tambahkan UPDATE qty nanti saat submit jika perlu.
          // Solusi kompleks: Gabungkan operasi ADD menjadi satu.
          // Solusi sederhana yang lebih baik: Gunakan map untuk mengelola operasi pending berdasarkan uniqueId.
        }
      }

      state = state.copyWith(
        currentOrderItems: newCurrentItems,
        pendingOperations: newPendingOps,
      );
    } else {
      // Item belum ada -> Tambahkan sebagai item baru
      final newItemWrapper = EditableOrderItem(
        item: newItem,
        changeType: ItemChangeType.added,
        isOriginal: false,
      );
      final newCurrentItems = List<EditableOrderItem>.from(
        state.currentOrderItems,
      )..add(newItemWrapper);
      final newPendingOps = List<Operation>.from(state.pendingOperations)..add(
        Operation.add(
          item: OrderItemModelForRequest.fromOrderItemModel(newItem),
        ),
      );

      state = state.copyWith(
        currentOrderItems: newCurrentItems,
        pendingOperations: newPendingOps,
      );
    }
  }

  // --- LOGIKA UBAH ITEM ---
  void updateItemInOrder(String itemId, Map<String, dynamic> patch) {
    final itemIndex = state.currentOrderItems.indexWhere(
      (item) => item.item.menuItem.id == itemId,
    );
    if (itemIndex == -1) return; // Item tidak ditemukan

    final currentItem = state.currentOrderItems[itemIndex];
    // Update item model
    final updatedItemModel = currentItem.item.copyWith(
      quantity: patch['quantity'] ?? currentItem.item.quantity,
      notes: patch['notes'] ?? currentItem.item.notes,
      // Tambahkan update untuk addon/topping jika diperlukan
      // selectedAddons: patch['selectedAddons'] ?? currentItem.item.selectedAddons,
      // selectedToppings: patch['selectedToppings'] ?? currentItem.item.selectedToppings,
      orderType:
          patch['orderType'] != null
              ? OrderTypeExtension.fromString(patch['orderType'])
              : currentItem.item.orderType,
    );

    final updatedItem = currentItem.copyWith(
      item: updatedItemModel,
      changeType: ItemChangeType.modified,
    );

    final newCurrentItems = List<EditableOrderItem>.from(
      state.currentOrderItems,
    );
    newCurrentItems[itemIndex] = updatedItem;

    // Tambahkan operasi update ke pending
    final newPendingOps = List<Operation>.from(state.pendingOperations)
      ..add(Operation.update(itemId: itemId, patch: patch));

    state = state.copyWith(
      currentOrderItems: newCurrentItems,
      pendingOperations: newPendingOps,
    );
  }

  // --- LOGIKA HAPUS ITEM ---
  void removeItemFromOrder(String itemId) {
    final itemIndex = state.currentOrderItems.indexWhere(
      (item) => item.item.menuItem.id == itemId,
    );
    if (itemIndex == -1) return; // Item tidak ditemukan

    final currentItem = state.currentOrderItems[itemIndex];
    final updatedItem = currentItem.copyWith(
      changeType: ItemChangeType.removed,
    );

    final newCurrentItems = List<EditableOrderItem>.from(
      state.currentOrderItems,
    );
    newCurrentItems[itemIndex] = updatedItem;

    // Tambahkan operasi remove ke pending
    final newPendingOps = List<Operation>.from(state.pendingOperations)
      ..add(Operation.remove(itemId: itemId));

    state = state.copyWith(
      currentOrderItems: newCurrentItems,
      pendingOperations: newPendingOps,
    );
  }

  void clearOperations() {
    // Kembalikan ke keadaan awal
    setOriginalOrder(state.originalOrder!);
  }

  Future<void> submitEdits(String orderMongoId, OrderService apiService) async {
    if (state.pendingOperations.isEmpty) {
      state = state.copyWith(
        errorMessage: "Tidak ada perubahan untuk disimpan.",
      );
      return;
    }
    state = state.copyWith(isSubmitting: true, errorMessage: null);

    try {
      final isPaid =
          state.originalOrder?.paymentStatus ==
          'paid'; // Asumsikan ini cara mengecek
      // Tentukan reason berdasarkan isPaid dan isi pendingOperations
      // Contoh logika sederhana:
      String reason = EditReason.editBeforePay.name;
      if (isPaid) {
        bool hasOos = state.pendingOperations.any(
          (op) =>
              (op is RemoveOperation && op.oos) ||
              (op is UpdateOperation && op.oos),
        );
        if (hasOos) {
          reason = EditReason.oosRefund.name;
        } else {
          // Jika sudah bayar tapi bukan OOS, mungkin add_after_fullpay
          reason = EditReason.addAfterFullpay.name;
        }
      }

      final request = EditOrderRequest(
        reason: reason,
        operations: state.pendingOperations,
      );

      await apiService.patchOrder(
        orderId: orderMongoId,
        patchData: request.toJson(),
      );
      // Jika berhasil, reset state
      state = state.copyWith(
        isSubmitting: false,
        pendingOperations: [],
        errorMessage: null,
      );
      // Di UI, Anda bisa menutup modal dan memperbarui order detail
    } catch (e) {
      state = state.copyWith(isSubmitting: false, errorMessage: e.toString());
    }
  }
}

// --- EXTENSION UNTUK OrderItemModel -> OrderItemModelForRequest ---
// File: order_item.model.dart (Tambahkan extension ini di akhir file)
extension OrderItemModelExtension on OrderItemModel {
  String get uniqueId {
    // Urutkan addon dan topping untuk konsistensi
    final addonIds = (selectedAddons.map((a) => a.id).toList()..sort()).join(
      '-',
    );
    final toppingIds = (selectedToppings.map((t) => t.id).toList()..sort())
        .join('-');
    return '${menuItem.id}-$addonIds-$toppingIds-$notes-${orderType.name}';
  }
}

extension OrderItemModelForRequestExtension on OrderItemModelForRequest {
  static OrderItemModelForRequest fromOrderItemModel(OrderItemModel item) {
    return OrderItemModelForRequest(
      menuItem: item.menuItem.id,
      quantity: item.quantity,
      selectedAddons:
          item.selectedAddons
              .map(
                (a) => SelectedAddonForRequest(
                  id: a.id!,
                  options:
                      a.options
                          ?.map((o) => SelectedOptionForRequest(id: o.id!))
                          .toList() ??
                      [],
                ),
              )
              .toList(),
      selectedToppings:
          item.selectedToppings
              .map((t) => SelectedToppingForRequest(id: t.id!))
              .toList(),
      notes: item.notes ?? '',
      dineType:
          item.orderType.name, // Konversi enum ke string sesuai kebutuhan API
    );
  }
}
