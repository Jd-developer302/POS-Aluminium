<?php

use App\Http\Controllers\Branch\BranchController;
use App\Http\Controllers\Branch\WarehouseController;
use App\Http\Controllers\Catalog\BrandController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\SubCategoryController;
use App\Http\Controllers\Catalog\TaxController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\Customer\CustomerLedgerController;
use App\Http\Controllers\Customer\CustomerReceivableController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Employee\AttendanceController;
use App\Http\Controllers\Employee\DepartmentController;
use App\Http\Controllers\Employee\DesignationController;
use App\Http\Controllers\Employee\EmployeeController;
use App\Http\Controllers\Employee\LeaveBalanceController;
use App\Http\Controllers\Employee\LeaveController;
use App\Http\Controllers\Employee\LeaveTypeController;
use App\Http\Controllers\Employee\PayrollController;
use App\Http\Controllers\Expense\Category\CategoryController as ExpenseCategoryController;
use App\Http\Controllers\Expense\ExpenseController;
use App\Http\Controllers\Inventory\InventoryMovementController;
use App\Http\Controllers\Inventory\StockTransferController;
use App\Http\Controllers\Product\AttributeController;
use App\Http\Controllers\Product\AttributeValueController;
use App\Http\Controllers\Product\ProductBatchController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\ProductSerialController;
use App\Http\Controllers\Product\StockAdjustmentController;
use App\Http\Controllers\Product\UnitController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Purchase\PurchaseHistoryController;
use App\Http\Controllers\Purchase\PurchaseInvoiceController;
use App\Http\Controllers\Purchase\PurchaseOrderController;
use App\Http\Controllers\Quotation\QuotationController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Role\RoleController;
use App\Http\Controllers\Sale\SaleController;
use App\Http\Controllers\Sale\SaleHistoryController;
use App\Http\Controllers\Sale\SaleReturnController;
use App\Http\Controllers\Setting\SettingController;
use App\Http\Controllers\Stock\StockController;
use App\Http\Controllers\Supplier\SupplierController;
use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::middleware('verified')->resource('branches', BranchController::class);
    Route::middleware('verified')->resource('warehouses', WarehouseController::class);
    Route::middleware('verified')->post('categories/quick-store', [CategoryController::class, 'quickStore'])->name('categories.quick-store');
    Route::middleware('verified')->resource('categories', CategoryController::class);
    Route::middleware('verified')->post('sub-categories/quick-store', [SubCategoryController::class, 'quickStore'])->name('sub-categories.quick-store');
    Route::middleware('verified')->resource('sub-categories', SubCategoryController::class);
    Route::middleware('verified')->post('brands/quick-store', [BrandController::class, 'quickStore'])->name('brands.quick-store');
    Route::middleware('verified')->resource('brands', BrandController::class);
    Route::middleware('verified')->resource('taxes', TaxController::class);
    Route::middleware('verified')->get('products/import/template', [ProductController::class, 'importTemplate'])->name('products.import.template');
    Route::middleware('verified')->get('products/import', [ProductController::class, 'importForm'])->name('products.import');
    Route::middleware('verified')->post('products/import', [ProductController::class, 'importStore'])->name('products.import.store');
    Route::middleware('verified')->get('products/export', [ProductController::class, 'export'])->name('products.export');
    Route::middleware(['verified', 'permission:products.barcode'])->group(function () {
        Route::get('pos', [ProductController::class, 'pos'])->name('pos.index');
        Route::get('products/barcode/{barcode}', [ProductController::class, 'getProductByBarcode'])->name('products.barcode.lookup');
    });
    Route::middleware('verified')->resource('products', ProductController::class);
    Route::middleware('verified')->prefix('products/{product:slug}')->group(function () {
        Route::get('batches', [ProductBatchController::class, 'index'])->name('products.batches.index');
        Route::get('batches/create', [ProductBatchController::class, 'create'])->name('products.batches.create');
        Route::post('batches', [ProductBatchController::class, 'store'])->name('products.batches.store');
        Route::get('batches/{batch}/edit', [ProductBatchController::class, 'edit'])->name('products.batches.edit');
        Route::put('batches/{batch}', [ProductBatchController::class, 'update'])->name('products.batches.update');
        Route::delete('batches/{batch}', [ProductBatchController::class, 'destroy'])->name('products.batches.destroy');

        Route::get('serials', [ProductSerialController::class, 'index'])->name('products.serials.index');
        Route::get('serials/create', [ProductSerialController::class, 'create'])->name('products.serials.create');
        Route::post('serials', [ProductSerialController::class, 'store'])->name('products.serials.store');
        Route::get('serials/{serial}/edit', [ProductSerialController::class, 'edit'])->name('products.serials.edit');
        Route::put('serials/{serial}', [ProductSerialController::class, 'update'])->name('products.serials.update');
        Route::delete('serials/{serial}', [ProductSerialController::class, 'destroy'])->name('products.serials.destroy');
    });
    Route::middleware('verified')->post('attributes/quick-store', [AttributeController::class, 'quickStore'])->name('attributes.quick-store');
    Route::middleware('verified')->resource('attributes', AttributeController::class);
    Route::middleware('verified')->post('attribute-values/quick-store', [AttributeValueController::class, 'quickStore'])->name('attribute-values.quick-store');
    Route::middleware('verified')->resource('attribute-values', AttributeValueController::class);
    Route::middleware('verified')->post('units/quick-store', [UnitController::class, 'quickStore'])->name('units.quick-store');
    Route::middleware('verified')->resource('units', UnitController::class);

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::middleware(['verified', 'permission:settings.roles'])->group(function () {
        Route::resource('roles', RoleController::class);
    });

    Route::middleware(['verified', 'permission:settings.users'])->group(function () {
        Route::resource('users', UserController::class);
    });

    Route::middleware(['verified', 'permission:settings.view'])->group(function () {
        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [SettingController::class, 'update'])->name('settings.update');
    });

    Route::middleware('verified')->resource('expense-categories', ExpenseCategoryController::class);
    Route::middleware('verified')->resource('expenses', ExpenseController::class);
    Route::middleware('verified')->resource('departments', DepartmentController::class)->except(['show']);
    Route::middleware('verified')->resource('designations', DesignationController::class)->except(['show']);
    Route::middleware('verified')->resource('leave-types', LeaveTypeController::class)->except(['show']);
    Route::middleware('verified')->resource('leave-balances', LeaveBalanceController::class)->except(['show']);
    Route::middleware('verified')->post('leaves/{leaf}/approve', [LeaveController::class, 'approve'])->name('leaves.approve');
    Route::middleware('verified')->post('leaves/{leaf}/reject', [LeaveController::class, 'reject'])->name('leaves.reject');
    Route::middleware('verified')->resource('leaves', LeaveController::class)->except(['show']);
    Route::middleware('verified')->resource('employees', EmployeeController::class)->except(['show']);
    Route::middleware('verified')->resource('attendances', AttendanceController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::middleware('verified')->get('payrolls/attendance-summary', [PayrollController::class, 'attendanceSummary'])->name('payrolls.attendance-summary');
    Route::middleware('verified')->resource('payrolls', PayrollController::class)->except(['show']);
    Route::middleware('verified')->get('stocks/export/csv', [StockController::class, 'exportCsv'])->name('stocks.export.csv');
    Route::middleware('verified')->get('stocks/export/pdf', [StockController::class, 'exportPdf'])->name('stocks.export.pdf');
    Route::middleware('verified')->resource('stocks', StockController::class);
    Route::middleware('verified')->resource('stock-adjustments', StockAdjustmentController::class);
    Route::middleware('verified')->get('sale-history', [SaleHistoryController::class, 'index'])->name('sale-history.index');
    Route::middleware('verified')->get('quotations/{quotation}/pdf', [QuotationController::class, 'pdf'])->name('quotations.pdf');
    Route::middleware('verified')->delete('quotation-items/{quotationItem}', [QuotationController::class, 'destroyItem'])->name('quotation-items.destroy');
    Route::middleware('verified')->resource('quotations', QuotationController::class);
    Route::middleware('verified')->get('sales/stock-availability', [SaleController::class, 'stockAvailability'])->name('sales.stock-availability');
    Route::middleware('verified')->resource('sales', SaleController::class)->except(['destroy']);
    Route::middleware(['verified', 'permission:sales.delete'])->delete('sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy');
    Route::middleware('verified')->post('sales/{sale}/complete', [SaleController::class, 'complete'])->name('sales.complete');
    Route::middleware('verified')->post('sales/{sale}/payments', [SaleController::class, 'addPayment'])->name('sales.payments.store');
    Route::middleware('verified')->get('sales/{sale}/receipt', [SaleController::class, 'receipt'])->name('sales.receipt');
    Route::middleware('verified')->post('sales/{sale}/return', [SaleController::class, 'returnSale'])->name('sales.return');
    Route::middleware('verified')->resource('sale-returns', SaleReturnController::class)->only(['index', 'create', 'store', 'show', 'destroy']);
    Route::middleware('verified')->post('sale-returns/{sale_return}/complete', [SaleReturnController::class, 'complete'])->name('sale-returns.complete');
    Route::middleware('verified')->resource('stock-transfers', StockTransferController::class);
    Route::middleware(['verified', 'permission:inventory.movement'])->group(function () {
        Route::get('inventory-movements', [InventoryMovementController::class, 'index'])->name('inventory-movements.index');
        Route::delete('inventory-movements/{inventoryMovement}', [InventoryMovementController::class, 'destroy'])->name('inventory-movements.destroy');
    });

    Route::middleware(['verified', 'permission:reports.view'])->prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/{type}/export', [ReportController::class, 'export'])
            ->where('type', 'customer-aging|customer-due-register|customer-receivables|discount-analysis|expense-vs-sales|expenses|inventory-movements|profit-margin|product-sales-summary|purchase-invoices|purchase-order-notifications|purchase-orders|quotation-lines|quotations|returns-analysis|sale-returns|sales|stock-adjustments|stock-transfers|stocks|stock-valuation|supplier-aging|tax-summary')
            ->name('export');
        Route::get('/{type}', [ReportController::class, 'show'])
            ->where('type', 'customer-aging|customer-due-register|customer-receivables|discount-analysis|expense-vs-sales|expenses|inventory-movements|profit-margin|product-sales-summary|purchase-invoices|purchase-order-notifications|purchase-orders|quotation-lines|quotations|returns-analysis|sale-returns|sales|stock-adjustments|stock-transfers|stocks|stock-valuation|supplier-aging|tax-summary')
            ->name('show');
    });

    Route::middleware('verified')->get('purchase-history', [PurchaseHistoryController::class, 'index'])->name('purchase-history.index');

    Route::middleware(['verified', 'permission:suppliers.view'])->get('suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::middleware(['verified', 'permission:suppliers.create'])->post('suppliers/quick-store', [SupplierController::class, 'quickStore'])->name('suppliers.quick-store');
    Route::middleware(['verified', 'permission:suppliers.create'])->get('suppliers/create', [SupplierController::class, 'create'])->name('suppliers.create');
    Route::middleware(['verified', 'permission:suppliers.create'])->post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::middleware(['verified', 'permission:suppliers.edit'])->get('suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('suppliers.edit');
    Route::middleware(['verified', 'permission:suppliers.edit'])->put('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::middleware(['verified', 'permission:suppliers.delete'])->delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

    Route::middleware(['verified', 'permission:customers.view'])->get('customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::middleware(['verified', 'permission:customers.create'])->get('customers/create', [CustomerController::class, 'create'])->name('customers.create');
    Route::middleware(['verified', 'permission:customers.create'])->post('customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::middleware(['verified', 'permission:customers.create'])->post('customers/quick-store', [CustomerController::class, 'quickStore'])->name('customers.quick-store');
    Route::middleware(['verified', 'permission:customers.edit'])->get('customers/{customer}/edit', [CustomerController::class, 'edit'])->name('customers.edit');
    Route::middleware(['verified', 'permission:customers.edit'])->put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::middleware(['verified', 'permission:customers.view'])->get('customer-receivables', [CustomerReceivableController::class, 'index'])->name('customer-receivables.index');
    Route::middleware(['verified', 'role_or_permission:reports.view|customers.view'])->get('customer-receivables/ledger', [CustomerLedgerController::class, 'show'])->name('customer-receivables.ledger');
    Route::middleware(['verified', 'role_or_permission:reports.view|customers.view'])->get('customer-receivables/ledger/pdf', [CustomerLedgerController::class, 'pdf'])->name('customer-receivables.ledger.pdf');
    Route::middleware(['verified', 'permission:customers.edit'])->get('customer-receivables/due-items/create', [CustomerReceivableController::class, 'createDueItem'])->name('customer-receivables.due-items.create');
    Route::middleware(['verified', 'permission:customers.edit'])->post('customer-receivables/due-items', [CustomerReceivableController::class, 'storeDueItem'])->name('customer-receivables.due-items.store');
    Route::middleware(['verified', 'permission:customers.edit'])->get('customer-receivables/receipts/create', [CustomerReceivableController::class, 'createReceipt'])->name('customer-receivables.receipts.create');
    Route::middleware(['verified', 'permission:customers.edit'])->post('customer-receivables/receipts', [CustomerReceivableController::class, 'storeReceipt'])->name('customer-receivables.receipts.store');
    Route::middleware(['verified', 'permission:customers.edit'])->get('customer-receivables/adjustments/create', [CustomerReceivableController::class, 'createAdjustment'])->name('customer-receivables.adjustments.create');
    Route::middleware(['verified', 'permission:customers.edit'])->post('customer-receivables/adjustments', [CustomerReceivableController::class, 'storeAdjustment'])->name('customer-receivables.adjustments.store');

    Route::middleware('verified')->get('purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
    Route::middleware('verified')->get('purchase-orders/create', [PurchaseOrderController::class, 'create'])->name('purchase-orders.create');
    Route::middleware('verified')->post('purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store');
    Route::middleware('verified')->get('purchase-orders/{purchase_order}/edit', [PurchaseOrderController::class, 'edit'])->name('purchase-orders.edit');
    Route::middleware('verified')->put('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'update'])->name('purchase-orders.update');
    Route::middleware('verified')->delete('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'destroy'])->name('purchase-orders.destroy');
    Route::middleware('verified')->get('purchase-orders/{purchase_order}/pdf', [PurchaseOrderController::class, 'pdf'])->name('purchase-orders.pdf');
    Route::middleware('verified')->get('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show');
    Route::middleware('verified')->post('purchase-orders/{purchase_order}/mark-ordered', [PurchaseOrderController::class, 'markSent'])->name('purchase-orders.mark-ordered');
    Route::middleware('verified')->post('purchase-orders/{purchase_order}/mark-cancelled', [PurchaseOrderController::class, 'markCancelled'])->name('purchase-orders.mark-cancelled');
    Route::middleware('verified')->delete(
        'purchase-order-notification-logs/{purchaseOrderNotificationLog}',
        [PurchaseOrderController::class, 'destroyNotificationLog']
    )->name('purchase-order-notification-logs.destroy');

    Route::middleware('verified')->get('purchase-invoices', [PurchaseInvoiceController::class, 'index'])->name('purchase-invoices.index');
    Route::middleware('verified')->get('purchase-invoices/create', [PurchaseInvoiceController::class, 'create'])->name('purchase-invoices.create');
    Route::middleware('verified')->post('purchase-invoices', [PurchaseInvoiceController::class, 'store'])->name('purchase-invoices.store');
    Route::middleware('verified')->get('purchase-invoices/{purchase_invoice}/edit', [PurchaseInvoiceController::class, 'edit'])->name('purchase-invoices.edit');
    Route::middleware('verified')->put('purchase-invoices/{purchase_invoice}', [PurchaseInvoiceController::class, 'update'])->name('purchase-invoices.update');
    Route::middleware('verified')->delete('purchase-invoices/{purchase_invoice}', [PurchaseInvoiceController::class, 'destroy'])->name('purchase-invoices.destroy');
    Route::middleware('verified')->get('purchase-invoices/{purchase_invoice}', [PurchaseInvoiceController::class, 'show'])->name('purchase-invoices.show');
    Route::middleware('verified')->post('purchase-invoices/{purchase_invoice}/payments', [PurchaseInvoiceController::class, 'addPayment'])->name('purchase-invoices.payments.store');
    Route::middleware('verified')->get('purchase-invoices/{purchase_invoice}/voucher', [PurchaseInvoiceController::class, 'voucher'])->name('purchase-invoices.voucher');
    Route::middleware('verified')->post('purchase-invoices/{purchase_invoice}/receive', [PurchaseInvoiceController::class, 'receive'])->name('purchase-invoices.receive');
});

require __DIR__.'/auth.php';
