<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderNotificationLog extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'purchase_order_id',
        'user_id',
        'email_status',
        'email_detail',
        'whatsapp_status',
        'whatsapp_detail',
    ];

    /**
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
