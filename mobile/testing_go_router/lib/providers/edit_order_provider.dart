import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/edit_order_request.model.dart';
import 'package:kasirbaraja/models/edit_order_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/services/order_service.dart';
// import 'package:kasirbaraja/services/api_service.dart';

final editOrderStateProviderV3 =
    StateNotifierProvider<EditOrderStateNotifierV3, EditOrderStateV3>((ref) {
      return EditOrderStateNotifierV3();
    });

class EditOrderStateV3 {
  final OrderDetailModel? originalOrder;
  final List<EditableOrderItem>
  currentOrderItems; // Daftar item untuk ditampilkan di UI
  final List<Operation> pendingOperations; // Operasi untuk dikirim ke API
  final bool isSubmitting;
  final String? errorMessage;

  EditOrderStateV3({
    this.originalOrder,
    this.currentOrderItems = const [],
    this.pendingOperations = const [],
    this.isSubmitting = false,
    this.errorMessage,
  });

  EditOrderStateV3 copyWith({
    OrderDetailModel? originalOrder,
    List<EditableOrderItem>? currentOrderItems,
    List<Operation>? pendingOperations,
    bool? isSubmitting,
    String? errorMessage,
  }) {
    return EditOrderStateV3(
      originalOrder: originalOrder ?? this.originalOrder,
      currentOrderItems: currentOrderItems ?? this.currentOrderItems,
      pendingOperations: pendingOperations ?? this.pendingOperations,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class EditOrderStateNotifierV3 extends StateNotifier<EditOrderStateV3> {
  EditOrderStateNotifierV3() : super(EditOrderStateV3());

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
    // Cek apakah item ini SAMA PERSIS (berdasarkan uniqueId) dengan item yang sudah ada di currentOrderItems
    // dan yang *tidak* dihapus (karena item yang dihapus tidak bisa ditambahkan lagi sebagai "baru")
    final existingItemIndex = state.currentOrderItems.indexWhere(
      (item) =>
          item.uniqueId == newItem.uniqueId &&
          item.changeType != ItemChangeType.removed,
    );

    if (existingItemIndex != -1) {
      // Item sudah ada dan tidak dihapus -> Update qty
      final existingItem = state.currentOrderItems[existingItemIndex];
      final updatedItemModel = existingItem.item.copyWith(
        quantity: existingItem.item.quantity + newItem.quantity,
      );
      final updatedItem = existingItem.copyWith(
        item: updatedItemModel,
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
      // Cari operasi yang relevan di pendingOperations berdasarkan itemId atau uniqueId
      final existingOpIndex = state.pendingOperations.indexWhere((op) {
        if (op is UpdateOperation) {
          return op.itemId ==
              existingItem.item.menuItem.id; // Update berdasarkan itemId
        }
        if (op is AddOperation) {
          // Add berdasarkan uniqueId
          return op.item.uniqueId == newItem.uniqueId;
        }
        return false; // Remove tidak perlu dicek di sini
      });

      List<Operation> newPendingOps = List<Operation>.from(
        state.pendingOperations,
      );
      if (existingOpIndex != -1) {
        // Update operasi yang sudah ada
        final op = newPendingOps[existingOpIndex];
        if (op is UpdateOperation) {
          // Gabungkan patch, pastikan quantity yang baru
          final newPatch = {...op.patch, 'quantity': updatedItem.item.quantity};
          newPendingOps[existingOpIndex] = op.copyWith(patch: newPatch);
        } else if (op is AddOperation) {
          // Update item ADD dengan quantity baru
          newPendingOps[existingOpIndex] = Operation.add(
            item: updatedItem.item.copyWith(
              quantity:
                  updatedItem.item.quantity, // Quantity sudah diupdate di model
            ),
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
          newPendingOps.add(Operation.add(item: updatedItem.item));
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
      final newPendingOps = List<Operation>.from(state.pendingOperations)
        ..add(Operation.add(item: newItem)); // Gunakan OrderItemModel langsung

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
      orderType: patch['orderType'] ?? currentItem.item.orderType,
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
          // Jika sudah bayar tapi bukan OOS, mungkin add_after_fullpay atau swap_item
          // Logika ini bisa diperjelas berdasarkan kombinasi operasi
          reason =
              EditReason
                  .addAfterFullpay
                  .name; // Default jika ada operasi add/update
        }
      }

      final request = EditOrderRequest(
        reason: reason,
        operations: state.pendingOperations,
      );

      // Gunakan Idempotency-Key
      String idempotencyKey = 'edit-${DateTime.now().millisecondsSinceEpoch}';

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

// --- EXTENSION UNTUK OrderItemModel ---
// File: models/order_item.model.dart (Tambahkan extension ini di akhir file)
extension OrderItemModelExtension on OrderItemModel {
  String getUniqueId(OrderItemModel item) {
    // Urutkan addon dan topping untuk konsistensi
    final addonIds = (selectedAddons.map((a) => a.id).toList()..sort()).join(
      '-',
    );
    final toppingIds = (selectedToppings.map((t) => t.id).toList()..sort())
        .join('-');
    return '${menuItem.id}-$addonIds-$toppingIds-$notes-${orderType.name}';
  }
}
