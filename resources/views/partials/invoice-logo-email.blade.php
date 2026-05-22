@if (!empty($invoiceLogoSrc))
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0;">
        <tr>
            <td align="center" style="padding: 8px 0 16px 0;">
                <img
                    src="{{ $invoiceLogoSrc }}"
                    alt="{{ config('app.name') }}"
                    style="display: block; margin: 0 auto; max-width: 280px; max-height: 72px; width: auto; height: auto; border: 0; outline: none; text-decoration: none;"
                />
            </td>
        </tr>
    </table>
@endif
