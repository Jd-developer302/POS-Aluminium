@php
    $title = $title ?? 'EVERGREEN ALUMINIUM';
    $subtitle = $subtitle ?? 'SERVE YOU ACCORDING TO YOUR TASTE';
@endphp

@if (!empty($invoiceLogoPath) || !empty($title) || !empty($subtitle))
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 14px 0;">
        <tr>
            <td style="vertical-align: middle; padding: 0;">
                @if (!empty($invoiceLogoPath))
                    <img
                        src="{{ $invoiceLogoPath }}"
                        alt=""
                        style="max-height: 72px; max-width: 260px; height: auto; width: auto; display: inline-block;"
                    >
                @endif
            </td>
            <td style="vertical-align: middle; padding: 0 0 0 12px;">
                @if (!empty($title))
                    <div style="font-family: 'Times New Roman', Georgia, serif; font-size: 20px; font-style: italic; font-weight: 700; margin: 0; line-height: 1.15;">
                        {{ $title }}
                    </div>
                @endif
                @if (!empty($subtitle))
                    <div style="font-family: 'Times New Roman', Georgia, serif; font-size: 11px; font-style: italic; font-weight: 600; color: #444; margin-top: 3px; letter-spacing: 1.2px;">
                        {{ $subtitle }}
                    </div>
                @endif
            </td>
        </tr>
    </table>
@endif
