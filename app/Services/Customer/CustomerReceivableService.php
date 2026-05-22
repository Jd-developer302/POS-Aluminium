<?php

namespace App\Services\Customer;

use App\Models\Customer\CustomerDueAdjustment;
use App\Models\Customer\CustomerDueItem;
use App\Models\Customer\CustomerReceipt;
use App\Models\Customer\CustomerReceiptAllocation;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class CustomerReceivableService
{
    public function storeDueItem(array $data, ?UploadedFile $supportingImage = null, ?UploadedFile $supportingPdf = null): CustomerDueItem
    {
        return DB::transaction(function () use ($data, $supportingImage, $supportingPdf): CustomerDueItem {
            $original = $this->money((float) $data['original_amount']);
            $productId = isset($data['product_id']) ? (int) $data['product_id'] : null;
            $variantId = isset($data['product_variant_id']) ? (int) $data['product_variant_id'] : null;

            $productName = $data['product_name'] ?? null;
            $variantName = $data['variant_name'] ?? null;

            if ($productId) {
                $product = Product::query()->find($productId);
                if ($product) {
                    $productName = $productName ?? $product->name;
                }
            }
            if ($variantId) {
                $variant = ProductVarient::query()->find($variantId);
                if ($variant) {
                    $variantName = $variantName ?? (string) ($variant->name ?? $variant->sku ?? '');
                }
            }

            $item = CustomerDueItem::query()->create([
                'branch_id' => (int) $data['branch_id'],
                'customer_id' => (int) $data['customer_id'],
                'source_type' => (string) $data['source_type'],
                'sale_id' => isset($data['sale_id']) ? (int) $data['sale_id'] : null,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'product_name' => $productName,
                'variant_name' => $variantName,
                'reference_no' => $data['reference_no'] ?? null,
                'transaction_date' => $data['transaction_date'],
                'due_date' => $data['due_date'] ?? null,
                'original_amount' => $original,
                'paid_amount' => 0,
                'adjusted_amount' => 0,
                'balance_amount' => $original,
                'status' => 'unpaid',
                'notes' => $data['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            $updates = [];
            if ($supportingImage instanceof UploadedFile) {
                $updates['supporting_image_path'] = $supportingImage->store(
                    'customer-due-items/'.$item->id,
                    'public'
                );
            }
            if ($supportingPdf instanceof UploadedFile) {
                $updates['supporting_pdf_path'] = $supportingPdf->store(
                    'customer-due-items/'.$item->id,
                    'public'
                );
            }
            if ($updates !== []) {
                $item->update($updates);
            }

            return $item->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function storeReceiptWithOptionalAllocation(array $data, bool $autoAllocate): CustomerReceipt
    {
        return DB::transaction(function () use ($data, $autoAllocate): CustomerReceipt {
            $branchId = (int) $data['branch_id'];
            $customerId = (int) $data['customer_id'];
            $amount = $this->money((float) $data['amount']);

            $receiptNo = $this->generateUniqueReceiptNumber($branchId);

            $receipt = CustomerReceipt::query()->create([
                'branch_id' => $branchId,
                'customer_id' => $customerId,
                'received_by' => Auth::id(),
                'receipt_no' => $receiptNo,
                'receipt_date' => $data['receipt_date'],
                'receipt_type' => (string) $data['receipt_type'],
                'amount' => $amount,
                'allocated_amount' => 0,
                'unallocated_amount' => $amount,
                'payment_method' => (string) ($data['payment_method'] ?? 'cash'),
                'payment_reference' => $data['payment_reference'] ?? null,
                'status' => 'posted',
                'notes' => $data['notes'] ?? null,
            ]);

            if ($autoAllocate && $amount > 0) {
                $this->allocateReceiptFifo($receipt);
            }

            return $receipt->fresh(['allocations']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function storeAdjustment(array $data): CustomerDueAdjustment
    {
        return DB::transaction(function () use ($data): CustomerDueAdjustment {
            $due = CustomerDueItem::query()
                ->whereKey((int) $data['customer_due_item_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($due->status, ['cancelled', 'written_off'], true)) {
                throw new RuntimeException('Cannot adjust a cancelled or written-off due line.');
            }

            $type = (string) $data['adjustment_type'];
            $rawAmount = (float) $data['amount'];

            $deltaAdjusted = match ($type) {
                'correction' => $this->money($rawAmount),
                default => $this->money(abs($rawAmount)),
            };

            $adjustment = CustomerDueAdjustment::query()->create([
                'branch_id' => (int) $data['branch_id'],
                'customer_id' => (int) $data['customer_id'],
                'customer_due_item_id' => $due->id,
                'created_by' => Auth::id(),
                'adjustment_date' => $data['adjustment_date'],
                'adjustment_type' => $type,
                'amount' => $deltaAdjusted,
                'reason' => $data['reason'] ?? null,
            ]);

            $due->adjusted_amount = $this->money((float) $due->adjusted_amount + $deltaAdjusted);
            $this->recalculateDueItem($due);
            $due->save();

            return $adjustment;
        });
    }

    public function allocateReceiptFifo(CustomerReceipt $receipt): void
    {
        $receipt = CustomerReceipt::query()->whereKey($receipt->id)->lockForUpdate()->firstOrFail();

        if ($receipt->status !== 'posted') {
            return;
        }

        $remaining = $this->money((float) $receipt->amount);

        $dueItems = CustomerDueItem::query()
            ->where('customer_id', $receipt->customer_id)
            ->where('branch_id', $receipt->branch_id)
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['unpaid', 'partial'])
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $allocatedTotal = 0.0;

        foreach ($dueItems as $dueItem) {
            if ($remaining <= 0) {
                break;
            }

            $balance = $this->money((float) $dueItem->balance_amount);
            if ($balance <= 0) {
                continue;
            }

            $allocateAmount = $this->money(min($remaining, $balance));

            CustomerReceiptAllocation::query()->create([
                'customer_receipt_id' => $receipt->id,
                'customer_due_item_id' => $dueItem->id,
                'amount' => $allocateAmount,
            ]);

            $dueItem->paid_amount = $this->money((float) $dueItem->paid_amount + $allocateAmount);
            $this->recalculateDueItem($dueItem);
            $dueItem->save();

            $allocatedTotal = $this->money($allocatedTotal + $allocateAmount);
            $remaining = $this->money($remaining - $allocateAmount);
        }

        $receipt->allocated_amount = $this->money((float) $receipt->amount - $remaining);
        $receipt->unallocated_amount = $remaining;
        $receipt->save();
    }

    public function recalculateDueItem(CustomerDueItem $due): void
    {
        if (in_array($due->status, ['written_off', 'cancelled'], true)) {
            return;
        }

        $due->balance_amount = $this->money(
            max(0.0, (float) $due->original_amount - (float) $due->paid_amount - (float) $due->adjusted_amount)
        );

        if ($due->balance_amount <= 0) {
            $due->balance_amount = 0;
            $due->status = 'paid';
        } elseif ((float) $due->paid_amount > 0 || (float) $due->adjusted_amount > 0) {
            $due->status = 'partial';
        } else {
            $due->status = 'unpaid';
        }
    }

    private function money(float $v): float
    {
        return round($v, 2);
    }

    private function generateUniqueReceiptNumber(int $branchId): string
    {
        $prefix = Setting::invoicePrefix();

        for ($attempt = 0; $attempt < 25; $attempt++) {
            $candidate = $prefix.'-R-'.strtoupper(str_replace('.', '', uniqid('', true)));
            if (strlen($candidate) > 100) {
                $candidate = substr($candidate, 0, 100);
            }

            $exists = CustomerReceipt::query()
                ->where('branch_id', $branchId)
                ->where('receipt_no', $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }
        }

        throw new RuntimeException('Could not generate a unique receipt number. Try again.');
    }

    /**
     * @return array{total_balance: float, total_recovered: float}
     */
    public function summaryForFilters(?int $branchId, ?int $customerId): array
    {
        $dueQuery = CustomerDueItem::query()
            ->whereNotIn('status', ['paid', 'cancelled']);

        if ($branchId) {
            $dueQuery->where('branch_id', $branchId);
        }
        if ($customerId) {
            $dueQuery->where('customer_id', $customerId);
        }

        $totalBalance = (float) $dueQuery->clone()->sum('balance_amount');

        $receiptQuery = CustomerReceipt::query()->where('status', 'posted');
        if ($branchId) {
            $receiptQuery->where('branch_id', $branchId);
        }
        if ($customerId) {
            $receiptQuery->where('customer_id', $customerId);
        }

        $totalRecovered = (float) $receiptQuery->sum('allocated_amount');

        return [
            'total_balance' => round($totalBalance, 2),
            'total_recovered' => round($totalRecovered, 2),
        ];
    }
}
