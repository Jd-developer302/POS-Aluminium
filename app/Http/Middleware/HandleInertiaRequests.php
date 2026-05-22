<?php

namespace App\Http\Middleware;

use App\Models\Company\Branch;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $branchId = $request->session()->get('current_branch_id');

        if ($user && $user->hasRole('Super Admin')) {
            $effectiveBranchId = $branchId;
        } elseif ($user && $user->branch_id) {
            $effectiveBranchId = $user->branch_id;
        } else {
            $effectiveBranchId = $branchId;
        }

        $currentBranch = $effectiveBranchId
            ? Branch::query()->whereKey($effectiveBranchId)->first()?->only(['id', 'name'])
            : null;

        $appNameSetting = Setting::query()->where('key', 'app_name')->value('value');
        $appName = (is_string($appNameSetting) && $appNameSetting !== '')
            ? $appNameSetting
            : (string) config('app.name', 'Laravel');

        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'branding' => Setting::brandingUrls(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'existing_stock_id' => $request->session()->get('existing_stock_id'),
                'import_summary' => $request->session()->get('import_summary'),
                'import_row_errors' => $request->session()->get('import_row_errors'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->values()->all(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                ] : null,
            ],
            'currentBranch' => $currentBranch,
            'appName' => $appName,
            'currency' => Setting::currencyCode(),
            'currencySymbol' => Setting::currencySymbol(),
        ];
    }
}
