import BranchLogoDropzone from '@/Components/BranchLogoDropzone';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Create({
    categories,
    subCategories,
    brands,
    units,
    taxes,
    attributes,
    low_stock_threshold: lowStockThreshold = 10,
    default_tax_percentage: defaultTaxPercentage = 0,
    default_tax_id: defaultTaxId = null,
}) {
    const { csrf_token: csrfFromPage } = usePage().props;
    const [categoryOptions, setCategoryOptions] = useState(categories ?? []);
    const [subCategoryOptions, setSubCategoryOptions] = useState(subCategories ?? []);
    const [brandOptions, setBrandOptions] = useState(brands ?? []);
    const [unitOptions, setUnitOptions] = useState(units ?? []);
    const firstCatId = '';
    const firstSubId = '';
    const firstUnitId = units?.[0]?.id ?? '';

    const { data, setData, post, processing, errors, transform } = useForm({
        category_id: firstCatId,
        sub_category_id: firstSubId,
        brand_id: null,
        unit_id: firstUnitId,
        tax_id: defaultTaxId != null ? Number(defaultTaxId) : null,
        name: '',
        sku: '',
        purchase_price: '',
        sale_price: '',
        type: 'simple',
        sale_type: 'quantity',
        quantity_in_pack: 1,
        pack_in_carton: 1,
        image: null,
        description: '',
        alert: false,
        alert_message: '',
        expiry_alert: '',
        quantity_alert: '',
        status: 'active',
        variants: [],
    });
    const [variantConfig, setVariantConfig] = useState([
        {
            attribute_id: '',
            value_ids: [],
            custom_values: '',
            attribute_query: '',
            value_query: '',
        },
    ]);
    /** `{ rowIndex }` while open — add one custom variant value at a time */
    const [customValueModal, setCustomValueModal] = useState(null);
    const [customValueDraft, setCustomValueDraft] = useState('');
    const [searchQuery, setSearchQuery] = useState({
        category: '',
        subCategory: '',
        brand: '',
        unit: '',
        tax: '',
    });
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categoryCreateName, setCategoryCreateName] = useState('');
    const [categoryCreateBusy, setCategoryCreateBusy] = useState(false);
    const [categoryCreateError, setCategoryCreateError] = useState('');
    const [subCategoryModalOpen, setSubCategoryModalOpen] = useState(false);
    const [subCategoryCreateName, setSubCategoryCreateName] = useState('');
    const [subCategoryCreateBusy, setSubCategoryCreateBusy] = useState(false);
    const [subCategoryCreateError, setSubCategoryCreateError] = useState('');
    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [brandCreateName, setBrandCreateName] = useState('');
    const [brandCreateBusy, setBrandCreateBusy] = useState(false);
    const [brandCreateError, setBrandCreateError] = useState('');
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [unitCreateName, setUnitCreateName] = useState('');
    const [unitCreateSymbol, setUnitCreateSymbol] = useState('');
    const [unitCreateBusy, setUnitCreateBusy] = useState(false);
    const [unitCreateError, setUnitCreateError] = useState('');
    const [attributeOptions, setAttributeOptions] = useState(attributes ?? []);
    const [attributeModalOpen, setAttributeModalOpen] = useState(false);
    const [attributeModalRowIndex, setAttributeModalRowIndex] = useState(null);
    const [attributeCreateName, setAttributeCreateName] = useState('');
    const [attributeCreateBusy, setAttributeCreateBusy] = useState(false);
    const [attributeCreateError, setAttributeCreateError] = useState('');
    const [attributeValueModalOpen, setAttributeValueModalOpen] = useState(false);
    const [attributeValueModalRowIndex, setAttributeValueModalRowIndex] = useState(null);
    const [attributeValueCreateText, setAttributeValueCreateText] = useState('');
    const [attributeValueCreateBusy, setAttributeValueCreateBusy] = useState(false);
    const [attributeValueCreateError, setAttributeValueCreateError] = useState('');
    const subOptions = useMemo(
        () =>
            (subCategoryOptions ?? []).filter(
                (s) => String(s.category_id) === String(data.category_id),
            ),
        [subCategoryOptions, data.category_id],
    );
    const selectedCategory = useMemo(
        () =>
            (categoryOptions ?? []).find(
                (c) => String(c.id) === String(data.category_id),
            ) ?? null,
        [categoryOptions, data.category_id],
    );
    const selectedSubCategory = useMemo(
        () =>
            subOptions.find(
                (s) => String(s.id) === String(data.sub_category_id),
            ) ?? null,
        [subOptions, data.sub_category_id],
    );
    const selectedBrand = useMemo(
        () =>
            (brandOptions ?? []).find((b) => String(b.id) === String(data.brand_id)) ?? null,
        [brandOptions, data.brand_id],
    );
    const selectedUnit = useMemo(
        () =>
            (unitOptions ?? []).find((u) => String(u.id) === String(data.unit_id)) ?? null,
        [unitOptions, data.unit_id],
    );
    const selectedTax = useMemo(
        () =>
            (taxes ?? []).find((t) => String(t.id) === String(data.tax_id)) ?? null,
        [taxes, data.tax_id],
    );
    const filteredCategories = useMemo(() => {
        const q = String(searchQuery.category ?? '').trim().toLowerCase();
        return q
            ? (categoryOptions ?? []).filter((c) =>
                  String(c.name ?? '')
                      .toLowerCase()
                      .includes(q),
              )
            : (categoryOptions ?? []);
    }, [categoryOptions, searchQuery.category]);
    const filteredSubCategories = useMemo(() => {
        const q = String(searchQuery.subCategory ?? '').trim().toLowerCase();
        return q
            ? subOptions.filter((s) =>
                  String(s.name ?? '')
                      .toLowerCase()
                      .includes(q),
              )
            : subOptions;
    }, [subOptions, searchQuery.subCategory]);
    const filteredBrands = useMemo(() => {
        const q = String(searchQuery.brand ?? '').trim().toLowerCase();
        return q
            ? (brandOptions ?? []).filter((b) =>
                  String(b.name ?? '')
                      .toLowerCase()
                      .includes(q),
              )
            : (brandOptions ?? []);
    }, [brandOptions, searchQuery.brand]);
    const filteredUnits = useMemo(() => {
        const q = String(searchQuery.unit ?? '').trim().toLowerCase();
        return q
            ? (unitOptions ?? []).filter((u) =>
                  `${u.name ?? ''} ${u.symbol ?? ''}`.toLowerCase().includes(q),
              )
            : (unitOptions ?? []);
    }, [unitOptions, searchQuery.unit]);
    const filteredTaxes = useMemo(() => {
        const q = String(searchQuery.tax ?? '').trim().toLowerCase();
        return q
            ? (taxes ?? []).filter((t) =>
                  `${t.name ?? ''} ${t.code ?? ''}`.toLowerCase().includes(q),
              )
            : (taxes ?? []);
    }, [taxes, searchQuery.tax]);

    const closeCategoryModal = () => {
        setCategoryModalOpen(false);
        setCategoryCreateName('');
        setCategoryCreateError('');
    };

    const closeSubCategoryModal = () => {
        setSubCategoryModalOpen(false);
        setSubCategoryCreateName('');
        setSubCategoryCreateError('');
    };

    const closeBrandModal = () => {
        setBrandModalOpen(false);
        setBrandCreateName('');
        setBrandCreateError('');
    };

    const closeUnitModal = () => {
        setUnitModalOpen(false);
        setUnitCreateName('');
        setUnitCreateSymbol('');
        setUnitCreateError('');
    };

    const openAttributeModal = (rowIdx) => {
        setAttributeCreateName('');
        setAttributeCreateError('');
        setAttributeModalRowIndex(rowIdx);
        setAttributeModalOpen(true);
    };

    const closeAttributeModal = () => {
        setAttributeModalOpen(false);
        setAttributeModalRowIndex(null);
        setAttributeCreateName('');
        setAttributeCreateError('');
    };

    const openAttributeValueModal = (rowIdx) => {
        if (!variantConfig[rowIdx]?.attribute_id) {
            return;
        }
        setAttributeValueModalRowIndex(rowIdx);
        setAttributeValueCreateText('');
        setAttributeValueCreateError('');
        setAttributeValueModalOpen(true);
    };

    const closeAttributeValueModal = () => {
        setAttributeValueModalOpen(false);
        setAttributeValueModalRowIndex(null);
        setAttributeValueCreateText('');
        setAttributeValueCreateError('');
    };

    const csrfToken = () =>
        (typeof csrfFromPage === 'string' && csrfFromPage) ||
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        '';

    const createCategoryInline = async () => {
        const name = String(categoryCreateName ?? '').trim();
        if (!name) {
            setCategoryCreateError('Category name is required.');
            return;
        }
        setCategoryCreateBusy(true);
        setCategoryCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const res = await fetch(route('categories.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ name, status: 'active' }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.message || 'Failed to create category.');
            }
            const created = json?.category;
            if (!created?.id) {
                throw new Error('Invalid category response.');
            }
            setCategoryOptions((prev) => [...prev, created]);
            setData('category_id', created.id);
            setData('sub_category_id', '');
            setSearchQuery((q) => ({ ...q, category: '', subCategory: '' }));
            closeCategoryModal();
        } catch (err) {
            setCategoryCreateError(err?.message || 'Failed to create category.');
        } finally {
            setCategoryCreateBusy(false);
        }
    };

    const createSubCategoryInline = async () => {
        const name = String(subCategoryCreateName ?? '').trim();
        if (!data.category_id) {
            setSubCategoryCreateError('Select category first.');
            return;
        }
        if (!name) {
            setSubCategoryCreateError('Sub category name is required.');
            return;
        }
        setSubCategoryCreateBusy(true);
        setSubCategoryCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const res = await fetch(route('sub-categories.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    category_id: data.category_id,
                    name,
                    status: 'active',
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.message || 'Failed to create sub category.');
            }
            const created = json?.sub_category;
            if (!created?.id) {
                throw new Error('Invalid sub category response.');
            }
            setSubCategoryOptions((prev) => [...prev, created]);
            setData('sub_category_id', created.id);
            setSearchQuery((q) => ({ ...q, subCategory: '' }));
            closeSubCategoryModal();
        } catch (err) {
            setSubCategoryCreateError(err?.message || 'Failed to create sub category.');
        } finally {
            setSubCategoryCreateBusy(false);
        }
    };

    const createBrandInline = async () => {
        const name = String(brandCreateName ?? '').trim();
        if (!name) {
            setBrandCreateError('Brand name is required.');
            return;
        }
        setBrandCreateBusy(true);
        setBrandCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const res = await fetch(route('brands.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ name, status: 'active' }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.message || 'Failed to create brand.');
            }
            const created = json?.brand;
            if (!created?.id) {
                throw new Error('Invalid brand response.');
            }
            setBrandOptions((prev) => [...prev, created]);
            setData('brand_id', created.id);
            setSearchQuery((q) => ({ ...q, brand: '' }));
            closeBrandModal();
        } catch (err) {
            setBrandCreateError(err?.message || 'Failed to create brand.');
        } finally {
            setBrandCreateBusy(false);
        }
    };

    const createUnitInline = async () => {
        const name = String(unitCreateName ?? '').trim();
        if (!name) {
            setUnitCreateError('Unit name is required.');
            return;
        }
        setUnitCreateBusy(true);
        setUnitCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const res = await fetch(route('units.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name,
                    symbol: String(unitCreateSymbol ?? '').trim() || null,
                    status: 'active',
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.message || 'Failed to create unit.');
            }
            const created = json?.unit;
            if (!created?.id) {
                throw new Error('Invalid unit response.');
            }
            setUnitOptions((prev) => [...prev, created]);
            setData('unit_id', created.id);
            setSearchQuery((q) => ({ ...q, unit: '' }));
            closeUnitModal();
        } catch (err) {
            setUnitCreateError(err?.message || 'Failed to create unit.');
        } finally {
            setUnitCreateBusy(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        transform((form) => {
            const isVariable = form.type === 'variable';
            return {
                ...form,
                brand_id: form.brand_id || null,
                tax_id: form.tax_id || null,
                barcode: null,
                variants: isVariable
                    ? form.variants.map((variant) => ({
                          ...variant,
                          barcode: null,
                      }))
                    : [],
                purchase_price: isVariable
                    ? 0
                    : Number(form.purchase_price),
                sale_price: isVariable ? 0 : Number(form.sale_price),
                expiry_alert:
                    form.expiry_alert === '' || form.expiry_alert == null
                        ? null
                        : Number(form.expiry_alert),
                quantity_alert:
                    form.quantity_alert === '' || form.quantity_alert == null
                        ? null
                        : Number(form.quantity_alert),
            };
        });
        post(route('products.store'));
    };

    const updateVariantRow = (idx, patch) => {
        setData(
            'variants',
            data.variants.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
        );
    };

    const removeVariantRow = (idx) => {
        setData(
            'variants',
            data.variants.filter((_, i) => i !== idx),
        );
    };

    const configRows = useMemo(() => {
        return variantConfig.map((row) => {
            const attribute = (attributeOptions ?? []).find(
                (item) => String(item.id) === String(row.attribute_id),
            );
            const query = String(row.attribute_query ?? '').trim().toLowerCase();
            const filteredAttributes = query
                ? (attributeOptions ?? []).filter((item) =>
                      String(item.name ?? '')
                          .toLowerCase()
                          .includes(query),
                  )
                : (attributeOptions ?? []);
            const valueQuery = String(row.value_query ?? '').trim().toLowerCase();
            const filteredValues = valueQuery
                ? (attribute?.values ?? []).filter((item) =>
                      String(item.value ?? '')
                          .toLowerCase()
                          .includes(valueQuery),
                  )
                : (attribute?.values ?? []);
            return {
                ...row,
                availableValues: attribute?.values ?? [],
                attributeName: attribute?.name ?? '',
                filteredAttributes,
                filteredValues,
            };
        });
    }, [variantConfig, attributeOptions]);

    const addAttributeConfig = () => {
        setVariantConfig((rows) => [
            ...rows,
            {
                attribute_id: '',
                value_ids: [],
                custom_values: '',
                attribute_query: '',
                value_query: '',
            },
        ]);
    };

    const updateAttributeConfig = (idx, patch) => {
        setVariantConfig((rows) =>
            rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
        );
    };

    const createAttributeInline = async () => {
        const name = String(attributeCreateName ?? '').trim();
        if (!name) {
            setAttributeCreateError('Attribute name is required.');
            return;
        }
        const targetRowIndex = attributeModalRowIndex;
        setAttributeCreateBusy(true);
        setAttributeCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const res = await fetch(route('attributes.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ name, status: 'active' }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                let msg = json?.message || 'Failed to create attribute.';
                if (json?.errors && typeof json.errors === 'object') {
                    const first = Object.values(json.errors).flat()[0];
                    if (typeof first === 'string') msg = first;
                }
                throw new Error(msg);
            }
            const created = json?.attribute;
            if (!created?.id) {
                throw new Error('Invalid attribute response.');
            }
            setAttributeOptions((prev) => [...prev, created]);
            if (targetRowIndex != null) {
                updateAttributeConfig(targetRowIndex, {
                    attribute_id: String(created.id),
                    value_ids: [],
                    custom_values: '',
                    attribute_query: '',
                    value_query: '',
                });
            }
            closeAttributeModal();
        } catch (err) {
            setAttributeCreateError(err?.message || 'Failed to create attribute.');
        } finally {
            setAttributeCreateBusy(false);
        }
    };

    const createAttributeValueInline = async () => {
        const raw = String(attributeValueCreateText ?? '').trim();
        if (!raw) {
            setAttributeValueCreateError('Value is required.');
            return;
        }
        const rowIdx = attributeValueModalRowIndex;
        const aid = variantConfig[rowIdx]?.attribute_id;
        if (!aid) {
            setAttributeValueCreateError('Select an attribute first.');
            return;
        }
        const priorIds = variantConfig[rowIdx]?.value_ids ?? [];
        setAttributeValueCreateBusy(true);
        setAttributeValueCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const res = await fetch(route('attribute-values.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    attribute_id: Number(aid),
                    value: raw,
                    status: 'active',
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                let msg = json?.message || 'Failed to create value.';
                if (json?.errors && typeof json.errors === 'object') {
                    const first = Object.values(json.errors).flat()[0];
                    if (typeof first === 'string') msg = first;
                }
                throw new Error(msg);
            }
            const created = json?.attribute_value;
            if (!created?.id) {
                throw new Error('Invalid response from server.');
            }
            setAttributeOptions((prev) =>
                prev.map((attr) =>
                    String(attr.id) === String(created.attribute_id)
                        ? {
                              ...attr,
                              values: [
                                  ...(attr.values ?? []),
                                  { id: created.id, value: created.value },
                              ].sort((x, y) =>
                                  String(x.value ?? '').localeCompare(
                                      String(y.value ?? ''),
                                      undefined,
                                      { sensitivity: 'base' },
                                  ),
                              ),
                          }
                        : attr,
                ),
            );
            const nextIds = new Set(priorIds.map(String));
            nextIds.add(String(created.id));
            updateAttributeConfig(rowIdx, {
                value_ids: [...nextIds],
                value_query: '',
            });
            closeAttributeValueModal();
        } catch (err) {
            setAttributeValueCreateError(err?.message || 'Failed to create value.');
        } finally {
            setAttributeValueCreateBusy(false);
        }
    };

    const removeAttributeConfig = (idx) => {
        setVariantConfig((rows) => rows.filter((_, i) => i !== idx));
        setCustomValueModal((m) => (m?.rowIndex === idx ? null : m));
    };

    const closeCustomValueModal = () => {
        setCustomValueModal(null);
        setCustomValueDraft('');
    };

    const appendCustomValue = (rowIndex, newToken) => {
        const token = String(newToken ?? '').trim();
        if (!token) {
            return;
        }
        setVariantConfig((rows) =>
            rows.map((row, i) => {
                if (i !== rowIndex) {
                    return row;
                }
                const parts = String(row.custom_values ?? '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                if (parts.includes(token)) {
                    return row;
                }
                parts.push(token);
                return { ...row, custom_values: parts.join(', ') };
            }),
        );
    };

    const confirmAddCustomValue = () => {
        if (customValueModal == null) {
            return;
        }
        const raw = customValueDraft.trim();
        if (!raw) {
            return;
        }
        appendCustomValue(customValueModal.rowIndex, raw);
        closeCustomValueModal();
    };

    const cartesian = (arr) =>
        arr.reduce((acc, cur) => {
            const out = [];
            acc.forEach((a) => cur.forEach((b) => out.push([...a, b])));
            return out;
        }, [[]]);

    const generateVariants = () => {
        const normalized = configRows
            .filter(
                (r) =>
                    r.attribute_id &&
                    (r.value_ids.length > 0 ||
                        String(r.custom_values ?? '').trim() !== ''),
            )
            .map((r) => ({
                attribute_id: Number(r.attribute_id),
                attribute_name: r.attributeName,
                values: [
                    ...r.availableValues
                        .filter((v) => r.value_ids.includes(String(v.id)))
                        .map((v) => ({
                            id: v.id,
                            value: v.value,
                            attribute_id: Number(r.attribute_id),
                        })),
                    ...String(r.custom_values ?? '')
                        .split(',')
                        .map((v) => v.trim())
                        .filter((v) => v.length > 0)
                        .map((v) => ({
                            id: null,
                            value: v,
                            attribute_id: Number(r.attribute_id),
                        })),
                ],
            }));

        if (normalized.length === 0) {
            return;
        }

        const combos = cartesian(normalized.map((r) => r.values));

        const rows = combos.map((combo) => {
            const labels = combo.map((v) => v.value).join(' - ');
            return {
                name: `${data.name || 'Variant'} - ${labels}`,
                sku: '',
                cost_price: '0',
                selling_price: '0',
                status: 'active',
                attribute_values: combo.map((v) => ({
                    attribute_id: v.attribute_id,
                    value: v.value,
                })),
            };
        });

        setData('variants', rows);
    };

    const ready =
        (categoryOptions?.length ?? 0) > 0 &&
        (subCategoryOptions?.length ?? 0) > 0 &&
        (unitOptions?.length ?? 0) > 0;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New product</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Slug is generated from the name. Sub category must match
                        category.
                    </p>
                </div>
            }
        >
            <Head title="New product" />

            {!ready ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    <p className="font-medium">Setup required</p>
                    <p className="mt-1">
                        You need at least one category, one sub category under it,
                        and one unit before creating products.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setCategoryModalOpen(true)}
                            className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                        >
                            + Create category
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubCategoryModalOpen(true)}
                            disabled={!data.category_id}
                            className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            + Create sub category
                        </button>
                        <button
                            type="button"
                            onClick={() => setBrandModalOpen(true)}
                            className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                        >
                            + Create brand
                        </button>
                        <button
                            type="button"
                            onClick={() => setUnitModalOpen(true)}
                            className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                        >
                            + Create unit
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="mx-auto max-w-7xl space-y-4">
                    <div className="grid gap-4 lg:grid-cols-12">
                        <div className="space-y-4 lg:col-span-8">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    General Information
                                </h2>
                        <div>
                                    <InputLabel htmlFor="name" value="Product Name" />
                            <TextInput
                                        id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                                    <InputError className="mt-2" message={errors.name} />
                        </div>
                                <div className="mt-3">
                                    <InputLabel htmlFor="description" value="Description" />
                                    <textarea
                                        id="description"
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData('description', e.target.value)
                                        }
                                    />
                            <InputError
                                className="mt-2"
                                        message={errors.description}
                                    />
                                </div>
                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel htmlFor="category_id" value="Category" />
                                            <button
                                                type="button"
                                                onClick={() => setCategoryModalOpen(true)}
                                                className="text-xs font-semibold text-brand hover:text-brand-dark"
                                            >
                                                + New
                                            </button>
                                        </div>
                                        <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                            <input
                                                id="category_id"
                                                type="text"
                                                className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Search category..."
                                                value={
                                                    String(searchQuery.category ?? '').trim() !== ''
                                                        ? searchQuery.category
                                                        : selectedCategory?.name ?? ''
                                                }
                                                onChange={(e) =>
                                                    setSearchQuery((q) => ({
                                                        ...q,
                                                        category: e.target.value,
                                                    }))
                                                }
                                            />
                                            {String(searchQuery.category ?? '').trim() !== '' && (
                                                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    {filteredCategories.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                            No category found
                                                        </div>
                                                    ) : (
                                                        filteredCategories.map((c) => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const cid = c.id;
                                                                    setData('category_id', cid);
                                                                    setData('sub_category_id', '');
                                                                    setSearchQuery((q) => ({
                                                                        ...q,
                                                                        category: '',
                                                                        subCategory: '',
                                                                    }));
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {c.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <InputError className="mt-2" message={errors.category_id} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel
                                                htmlFor="sub_category_id"
                                                value="Sub category"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSubCategoryModalOpen(true)}
                                                disabled={!data.category_id}
                                                className="text-xs font-semibold text-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                + New
                                            </button>
                                        </div>
                                        <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                            <input
                                                id="sub_category_id"
                                                type="text"
                                                className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Search sub category..."
                                                value={
                                                    String(searchQuery.subCategory ?? '').trim() !== ''
                                                        ? searchQuery.subCategory
                                                        : selectedSubCategory?.name ?? ''
                                                }
                                                onChange={(e) =>
                                                    setSearchQuery((q) => ({
                                                        ...q,
                                                        subCategory: e.target.value,
                                                    }))
                                                }
                                            />
                                            {String(searchQuery.subCategory ?? '').trim() !== '' && (
                                                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    {filteredSubCategories.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                            No sub category found
                                                        </div>
                                                    ) : (
                                                        filteredSubCategories.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('sub_category_id', s.id);
                                                                    setSearchQuery((q) => ({
                                                                        ...q,
                                                                        subCategory: '',
                                                                    }));
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {s.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <InputError className="mt-2" message={errors.sub_category_id} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel htmlFor="brand_id" value="Brand (optional)" />
                                            <button
                                                type="button"
                                                onClick={() => setBrandModalOpen(true)}
                                                className="text-xs font-semibold text-brand hover:text-brand-dark"
                                            >
                                                + New
                                            </button>
                                        </div>
                                        <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                            <input
                                                id="brand_id"
                                                type="text"
                                                className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Search brand..."
                                                value={
                                                    String(searchQuery.brand ?? '').trim() !== ''
                                                        ? searchQuery.brand
                                                        : selectedBrand?.name ?? ''
                                                }
                                                onChange={(e) =>
                                                    setSearchQuery((q) => ({
                                                        ...q,
                                                        brand: e.target.value,
                                                    }))
                                                }
                                            />
                                            {String(searchQuery.brand ?? '').trim() !== '' && (
                                                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('brand_id', null);
                                                            setSearchQuery((q) => ({
                                                                ...q,
                                                                brand: '',
                                                            }));
                                                        }}
                                                        className="block w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                                                    >
                                                        Clear brand
                                                    </button>
                                                    {filteredBrands.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                            No brand found
                                                        </div>
                                                    ) : (
                                                        filteredBrands.map((b) => (
                                                            <button
                                                                key={b.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('brand_id', Number(b.id));
                                                                    setSearchQuery((q) => ({
                                                                        ...q,
                                                                        brand: '',
                                                                    }));
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {b.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <InputError className="mt-2" message={errors.brand_id} />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    Product Type & Settings
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            Product Type
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-4 text-sm">
                                            {[
                                                ['simple', 'Simple'],
                                                ['variable', 'Variable'],
                                            ].map(([value, label]) => (
                                                <label key={value} className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value={value}
                                                        checked={data.type === value}
                                                        onChange={() => setData('type', value)}
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError className="mt-2" message={errors.type} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Sale Type</p>
                                        <div className="mt-1 flex flex-wrap gap-4 text-sm">
                                            {[
                                                ['quantity', 'Quantity'],
                                                ['weight', 'Weight'],
                                            ].map(([value, label]) => (
                                                <label key={value} className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="sale_type"
                                                        value={value}
                                                        checked={data.sale_type === value}
                                                        onChange={() => setData('sale_type', value)}
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError className="mt-2" message={errors.sale_type} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="status" value="Status" />
                                        <select
                                            id="status"
                                            className={selectClass}
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <InputError className="mt-2" message={errors.status} />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={data.alert}
                                                onChange={(e) => setData('alert', e.target.checked)}
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            Enable alerts
                                        </label>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="alert_message" value="Alert Message" />
                                        <TextInput
                                            id="alert_message"
                                            className="mt-1 block w-full"
                                            value={data.alert_message}
                                            onChange={(e) => setData('alert_message', e.target.value)}
                                        />
                                        <InputError className="mt-2" message={errors.alert_message} />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="expiry_alert" value="Expiry Alert (days)" />
                                            <TextInput
                                                id="expiry_alert"
                                                type="number"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.expiry_alert}
                                                onChange={(e) => setData('expiry_alert', e.target.value)}
                                            />
                                            <InputError className="mt-2" message={errors.expiry_alert} />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="quantity_alert" value="Quantity Alert" />
                                            <TextInput
                                                id="quantity_alert"
                                                type="number"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.quantity_alert}
                                                onChange={(e) => setData('quantity_alert', e.target.value)}
                                            />
                                            <InputError className="mt-2" message={errors.quantity_alert} />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Leave empty to use the default threshold (
                                                {Number(lowStockThreshold).toLocaleString()}) from
                                                Settings → Stock.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {data.type === 'simple' && (
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                                        SKU & pricing
                                    </h2>
                                    <p className="mb-3 text-sm text-gray-500">
                                        A unique 12-digit barcode is assigned automatically when you save.
                                        SKU, cost, and selling price are stored on the default product
                                        variant (same table as variable SKUs).
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="sku" value="SKU" />
                                            <TextInput
                                                id="sku"
                                                className="mt-1 block w-full font-mono"
                                                value={data.sku}
                                                onChange={(e) =>
                                                    setData('sku', e.target.value)
                                                }
                                            />
                                            <InputError className="mt-2" message={errors.sku} />
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="purchase_price" value="Cost" />
                                            <TextInput
                                                id="purchase_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.purchase_price}
                                                onChange={(e) =>
                                                    setData('purchase_price', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.purchase_price}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="sale_price"
                                                value="Selling price"
                                            />
                                            <TextInput
                                                id="sale_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.sale_price}
                                                onChange={(e) =>
                                                    setData('sale_price', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.sale_price}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {data.type === 'variable' && (
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                                        Product Variants
                                    </h2>
                                    <p className="mb-3 text-sm text-gray-500">
                                        Global attribute configuration
                                    </p>
                                    {configRows.map((row, idx) => (
                                        <div
                                            key={idx}
                                            className="mb-3 rounded-md border border-gray-100 p-3"
                                        >
                                            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <InputLabel value="Attribute Name" />
                                                        <button
                                                            type="button"
                                                            onClick={() => openAttributeModal(idx)}
                                                            className="text-xs font-semibold text-brand hover:text-brand-dark"
                                                        >
                                                            + New
                                                        </button>
                                                    </div>
                                                    <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                                        <input
                                                            type="text"
                                                            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                            placeholder="Search attribute..."
                                                            value={
                                                                String(
                                                                    row.attribute_query ?? '',
                                                                ).trim() !== ''
                                                                    ? row.attribute_query
                                                                    : row.attribute_id
                                                                      ? row.attributeName
                                                                      : ''
                                                            }
                                                            onChange={(e) =>
                                                                updateAttributeConfig(idx, {
                                                                    attribute_query:
                                                                        e.target.value,
                                                                })
                                                            }
                                                        />
                                                        {String(row.attribute_query ?? '').trim() !==
                                                            '' && (
                                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateAttributeConfig(idx, {
                                                                            attribute_id: '',
                                                                            value_ids: [],
                                                                            custom_values: '',
                                                                            attribute_query: '',
                                                                            value_query: '',
                                                                        })
                                                                    }
                                                                    className="block w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                                                                >
                                                                    Select attribute
                                                                </button>
                                                                {row.filteredAttributes.length ===
                                                                0 ? (
                                                                    <div className="px-3 py-2 text-sm text-gray-400">
                                                                        No attribute found
                                                                    </div>
                                                                ) : (
                                                                    row.filteredAttributes.map(
                                                                        (a) => (
                                                                            <button
                                                                                key={a.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const selectedAttribute =
                                                                                        (
                                                                                            attributeOptions ??
                                                                                            []
                                                                                        ).find(
                                                                                            (
                                                                                                item,
                                                                                            ) =>
                                                                                                String(
                                                                                                    item.id,
                                                                                                ) ===
                                                                                                String(
                                                                                                    a.id,
                                                                                                ),
                                                                                        );
                                                                                    updateAttributeConfig(
                                                                                        idx,
                                                                                        {
                                                                                            attribute_id:
                                                                                                String(
                                                                                                    a.id,
                                                                                                ),
                                                                                            // Keep value selection manual after attribute selection.
                                                                                            value_ids:
                                                                                                [],
                                                                                            custom_values:
                                                                                                '',
                                                                                            attribute_query:
                                                                                                '',
                                                                                            value_query:
                                                                                                '',
                                                                                        },
                                                                                    );
                                                                                }}
                                                                                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                                                                    String(
                                                                                        row.attribute_id,
                                                                                    ) ===
                                                                                    String(a.id)
                                                                                        ? 'bg-brand-muted text-brand-on-muted'
                                                                                        : 'text-gray-700'
                                                                                }`}
                                                                            >
                                                                                {a.name}
                                                                            </button>
                                                                        ),
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <InputLabel value="Values" />
                                                        <button
                                                            type="button"
                                                            disabled={!row.attribute_id}
                                                            title={
                                                                row.attribute_id
                                                                    ? 'Add a catalogue value'
                                                                    : 'Select an attribute first'
                                                            }
                                                            onClick={() =>
                                                                openAttributeValueModal(idx)
                                                            }
                                                            className="text-xs font-semibold text-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            + New
                                                        </button>
                                                    </div>
                                                    <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                                        <input
                                                            type="text"
                                                            disabled={!row.attribute_id}
                                                            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                                                            placeholder={
                                                                row.attribute_id
                                                                    ? 'Search value...'
                                                                    : 'Select attribute first'
                                                            }
                                                            value={row.value_query ?? ''}
                                                            onChange={(e) =>
                                                                updateAttributeConfig(idx, {
                                                                    value_query:
                                                                        e.target.value,
                                                                })
                                                            }
                                                        />
                                                        {String(row.value_query ?? '').trim() !==
                                                            '' && (
                                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                                {row.filteredValues.length ===
                                                                0 ? (
                                                                    <div className="px-3 py-2 text-sm text-gray-400">
                                                                        No value found
                                                                    </div>
                                                                ) : (
                                                                    row.filteredValues.map((v) => {
                                                                        const checked =
                                                                            row.value_ids.includes(
                                                                                String(v.id),
                                                                            );
                                                                        return (
                                                                            <button
                                                                                key={v.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const current =
                                                                                        new Set(
                                                                                            row.value_ids,
                                                                                        );
                                                                                    if (checked) {
                                                                                        current.delete(
                                                                                            String(
                                                                                                v.id,
                                                                                            ),
                                                                                        );
                                                                                    } else {
                                                                                        current.add(
                                                                                            String(
                                                                                                v.id,
                                                                                            ),
                                                                                        );
                                                                                    }
                                                                                    updateAttributeConfig(
                                                                                        idx,
                                                                                        {
                                                                                            value_ids:
                                                                                                [
                                                                                                    ...current,
                                                                                                ],
                                                                                            value_query:
                                                                                                '',
                                                                                        },
                                                                                    );
                                                                                }}
                                                                                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                                                                    checked
                                                                                        ? 'bg-brand-muted text-brand-on-muted'
                                                                                        : 'text-gray-700'
                                                                                }`}
                                                                            >
                                                                                {v.value}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-2 rounded-md border border-gray-300 p-2">
                                                        {row.availableValues.filter((v) =>
                                                            row.value_ids.includes(String(v.id)),
                                                        ).length === 0 ? (
                                                            <span className="text-xs text-gray-400">
                                                                No value selected
                                                            </span>
                                                        ) : (
                                                            row.availableValues
                                                                .filter((v) =>
                                                                    row.value_ids.includes(
                                                                        String(v.id),
                                                                    ),
                                                                )
                                                                .map((v) => (
                                                                    <button
                                                                        key={v.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = new Set(
                                                                                row.value_ids,
                                                                            );
                                                                            current.delete(
                                                                                String(v.id),
                                                                            );
                                                                            updateAttributeConfig(
                                                                                idx,
                                                                                {
                                                                                    value_ids: [
                                                                                        ...current,
                                                                                    ],
                                                                                },
                                                                            );
                                                                        }}
                                                                        className="inline-flex items-center gap-1 rounded bg-brand-muted px-2 py-1 text-xs text-brand-on-muted"
                                                                    >
                                                                        {v.value}
                                                                        <span aria-hidden>×</span>
                                                                    </button>
                                                                ))
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="lg:pt-6">
                                                    <button
                                                        type="button"
                                                        disabled={!row.attribute_id}
                                                        title={
                                                            row.attribute_id
                                                                ? 'Add a custom value in a dialog'
                                                                : 'Select an attribute first'
                                                        }
                                                        onClick={() => {
                                                            setCustomValueModal({
                                                                rowIndex: idx,
                                                            });
                                                            setCustomValueDraft('');
                                                        }}
                                                        className="inline-flex items-center rounded-lg border border-brand/40 bg-brand-muted px-3 py-2 text-xs font-semibold text-brand shadow-sm transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-muted"
                                                    >
                                                        +Add
                                                    </button>
                                                </div>
                                            </div>
                                            {variantConfig.length > 1 && (
                                                <div className="mt-2 text-right">
                                                    <button
                                                        type="button"
                                                        className="text-xs text-red-600 hover:text-red-700"
                                                        onClick={() => removeAttributeConfig(idx)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={addAttributeConfig}
                                            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Add attribute
                                        </button>
                                        <button
                                            type="button"
                                            onClick={generateVariants}
                                            className="rounded border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                        >
                                            Generate variants
                                        </button>
                                    </div>

                                    <div className="mt-4 overflow-x-auto">
                                        <p className="mb-2 text-sm font-medium text-gray-700">
                                            Generated Variants
                                        </p>
                                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-2 text-left">Name</th>
                                                    <th className="px-2 py-2 text-left">SKU</th>
                                                    <th className="px-2 py-2 text-left">Cost</th>
                                                    <th className="px-2 py-2 text-left">Selling</th>
                                                    <th className="px-2 py-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.variants.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-2 py-3 text-center text-gray-500">
                                                            No variants generated yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.variants.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    className="w-full"
                                                                    value={row.name}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, { name: e.target.value })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    className="w-full"
                                                                    value={row.sku}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, { sku: e.target.value })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full"
                                                                    value={row.cost_price}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, { cost_price: e.target.value })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full"
                                                                    value={row.selling_price}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, { selling_price: e.target.value })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVariantRow(idx)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <InputError className="mt-2" message={errors.variants} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 lg:col-span-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">Product Media</h2>
                                <BranchLogoDropzone
                                    id="image"
                                    label="Upload image"
                                    file={data.image}
                                    onFileChange={(file) => setData('image', file)}
                                    error={errors.image}
                                    disabled={processing}
                                />
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">Stock & Packaging</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="quantity_in_pack" value="Quantity in Pack" />
                                        <TextInput
                                            id="quantity_in_pack"
                                            type="number"
                                            min="1"
                                            className="mt-1 block w-full"
                                            value={data.quantity_in_pack}
                                            onChange={(e) => setData('quantity_in_pack', Number(e.target.value) || 1)}
                                        />
                                        <InputError className="mt-2" message={errors.quantity_in_pack} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="pack_in_carton" value="Pack in Carton" />
                                        <TextInput
                                            id="pack_in_carton"
                                            type="number"
                                            min="1"
                                            className="mt-1 block w-full"
                                            value={data.pack_in_carton}
                                            onChange={(e) => setData('pack_in_carton', Number(e.target.value) || 1)}
                                        />
                                        <InputError className="mt-2" message={errors.pack_in_carton} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel htmlFor="unit_id" value="Unit" />
                                            <button
                                                type="button"
                                                onClick={() => setUnitModalOpen(true)}
                                                className="text-xs font-semibold text-brand hover:text-brand-dark"
                                            >
                                                + New
                                            </button>
                                        </div>
                                        <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                            <input
                                                id="unit_id"
                                                type="text"
                                                className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Search unit..."
                                                value={
                                                    String(searchQuery.unit ?? '').trim() !== ''
                                                        ? searchQuery.unit
                                                        : selectedUnit
                                                          ? selectedUnit.symbol
                                                              ? `${selectedUnit.name} (${selectedUnit.symbol})`
                                                              : selectedUnit.name
                                                          : ''
                                                }
                                                onChange={(e) =>
                                                    setSearchQuery((q) => ({
                                                        ...q,
                                                        unit: e.target.value,
                                                    }))
                                                }
                                            />
                                            {String(searchQuery.unit ?? '').trim() !== '' && (
                                                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    {filteredUnits.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                            No unit found
                                                        </div>
                                                    ) : (
                                                        filteredUnits.map((u) => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('unit_id', u.id);
                                                                    setSearchQuery((q) => ({
                                                                        ...q,
                                                                        unit: '',
                                                                    }));
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {u.symbol
                                                                    ? `${u.name} (${u.symbol})`
                                                                    : u.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <InputError className="mt-2" message={errors.unit_id} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="tax_id" value="Tax (optional)" />
                                        <div className="relative mt-1 rounded-md border border-gray-300 bg-white">
                                            <input
                                                id="tax_id"
                                                type="text"
                                                className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Search tax..."
                                                value={
                                                    String(searchQuery.tax ?? '').trim() !== ''
                                                        ? searchQuery.tax
                                                        : selectedTax
                                                          ? `${selectedTax.name} (${selectedTax.code})`
                                                          : ''
                                                }
                                                onChange={(e) =>
                                                    setSearchQuery((q) => ({
                                                        ...q,
                                                        tax: e.target.value,
                                                    }))
                                                }
                                            />
                                            {String(searchQuery.tax ?? '').trim() !== '' && (
                                                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('tax_id', null);
                                                            setSearchQuery((q) => ({
                                                                ...q,
                                                                tax: '',
                                                            }));
                                                        }}
                                                        className="block w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                                                    >
                                                        Clear tax
                                                    </button>
                                                    {filteredTaxes.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                            No tax found
                                                        </div>
                                                    ) : (
                                                        filteredTaxes.map((t) => (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('tax_id', Number(t.id));
                                                                    setSearchQuery((q) => ({
                                                                        ...q,
                                                                        tax: '',
                                                                    }));
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {t.name} ({t.code})
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <InputError className="mt-2" message={errors.tax_id} />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Settings → Tax default is{' '}
                                            <span className="font-semibold text-gray-700">
                                                {Number(defaultTaxPercentage).toLocaleString()}%
                                            </span>
                                            . A matching catalog tax is pre-selected when it exists;
                                            add a tax under Catalog with the same rate otherwise.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                                    <Link
                                        href={route('products.index')}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 sm:min-w-[8rem]"
                                    >
                                        Cancel
                                    </Link>
                                    <PrimaryButton
                                        disabled={processing || subOptions.length === 0}
                                        className="justify-center bg-brand hover:bg-brand-dark sm:min-w-[10rem]"
                                    >
                                        Save Product
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}
            <Modal show={categoryModalOpen} onClose={closeCategoryModal} maxWidth="md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add category</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Add a category without leaving product form.
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="quick_category_name" value="Category name" />
                    <TextInput
                        id="quick_category_name"
                        className="mt-2 block w-full"
                        value={categoryCreateName}
                        onChange={(e) => setCategoryCreateName(e.target.value)}
                        placeholder="e.g. Electronics"
                        autoFocus
                    />
                    {categoryCreateError && (
                        <p className="mt-2 text-xs text-red-600">{categoryCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeCategoryModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={categoryCreateBusy}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createCategoryInline}
                        >
                            {categoryCreateBusy ? 'Creating...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={subCategoryModalOpen} onClose={closeSubCategoryModal} maxWidth="md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add sub category</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Current category:{' '}
                        <span className="font-medium text-gray-900">
                            {selectedCategory?.name ?? '—'}
                        </span>
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="quick_sub_category_name" value="Sub category name" />
                    <TextInput
                        id="quick_sub_category_name"
                        className="mt-2 block w-full"
                        value={subCategoryCreateName}
                        onChange={(e) => setSubCategoryCreateName(e.target.value)}
                        placeholder="e.g. Mobile Accessories"
                        autoFocus
                    />
                    {subCategoryCreateError && (
                        <p className="mt-2 text-xs text-red-600">{subCategoryCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeSubCategoryModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={subCategoryCreateBusy || !data.category_id}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createSubCategoryInline}
                        >
                            {subCategoryCreateBusy ? 'Creating...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={brandModalOpen} onClose={closeBrandModal} maxWidth="md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add brand</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Add a brand without leaving product form.
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="quick_brand_name" value="Brand name" />
                    <TextInput
                        id="quick_brand_name"
                        className="mt-2 block w-full"
                        value={brandCreateName}
                        onChange={(e) => setBrandCreateName(e.target.value)}
                        placeholder="e.g. Samsung"
                        autoFocus
                    />
                    {brandCreateError && (
                        <p className="mt-2 text-xs text-red-600">{brandCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeBrandModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={brandCreateBusy}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createBrandInline}
                        >
                            {brandCreateBusy ? 'Creating...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={unitModalOpen} onClose={closeUnitModal} maxWidth="md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add unit</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Add a unit without leaving product form.
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="quick_unit_name" value="Unit name" />
                    <TextInput
                        id="quick_unit_name"
                        className="mt-2 block w-full"
                        value={unitCreateName}
                        onChange={(e) => setUnitCreateName(e.target.value)}
                        placeholder="e.g. Piece"
                        autoFocus
                    />
                    <div className="mt-4">
                        <InputLabel htmlFor="quick_unit_symbol" value="Symbol (optional)" />
                        <TextInput
                            id="quick_unit_symbol"
                            className="mt-2 block w-full"
                            value={unitCreateSymbol}
                            onChange={(e) => setUnitCreateSymbol(e.target.value)}
                            placeholder="e.g. pc"
                        />
                    </div>
                    {unitCreateError && (
                        <p className="mt-2 text-xs text-red-600">{unitCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeUnitModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={unitCreateBusy}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createUnitInline}
                        >
                            {unitCreateBusy ? 'Creating...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={attributeModalOpen} onClose={closeAttributeModal} maxWidth="md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add attribute</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Create an attribute without leaving the product form. Add values later under
                        Catalog → Attributes.
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="quick_attribute_name" value="Attribute name" />
                    <TextInput
                        id="quick_attribute_name"
                        className="mt-2 block w-full"
                        value={attributeCreateName}
                        onChange={(e) => setAttributeCreateName(e.target.value)}
                        placeholder="e.g. Color"
                        autoFocus
                    />
                    {attributeCreateError && (
                        <p className="mt-2 text-xs text-red-600">{attributeCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeAttributeModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={attributeCreateBusy}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createAttributeInline}
                        >
                            {attributeCreateBusy ? 'Creating...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal
                show={attributeValueModalOpen}
                onClose={closeAttributeValueModal}
                maxWidth="md"
            >
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add attribute value</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        For attribute:{' '}
                        <span className="font-medium text-gray-900">
                            {attributeValueModalRowIndex != null
                                ? configRows[attributeValueModalRowIndex]?.attributeName || '—'
                                : '—'}
                        </span>
                        . Saved to the catalog for this attribute.
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="quick_attribute_value" value="Value" />
                    <TextInput
                        id="quick_attribute_value"
                        className="mt-2 block w-full"
                        value={attributeValueCreateText}
                        onChange={(e) => setAttributeValueCreateText(e.target.value)}
                        placeholder="e.g. Red, Large"
                        autoFocus
                    />
                    {attributeValueCreateError && (
                        <p className="mt-2 text-xs text-red-600">{attributeValueCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeAttributeValueModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={attributeValueCreateBusy}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createAttributeValueInline}
                        >
                            {attributeValueCreateBusy ? 'Saving...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal
                show={customValueModal != null}
                onClose={closeCustomValueModal}
                maxWidth="md"
            >
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Add custom value
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Attribute:{' '}
                        <span className="font-medium text-gray-900">
                            {customValueModal != null
                                ? configRows[customValueModal.rowIndex]?.attributeName || '—'
                                : '—'}
                        </span>
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="custom_value_modal" value="Value" />
                    <TextInput
                        id="custom_value_modal"
                        className="mt-2 block w-full"
                        placeholder="e.g. XXL, Navy Blue, 500ml"
                        value={customValueDraft}
                        onChange={(e) => setCustomValueDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                confirmAddCustomValue();
                            }
                        }}
                        autoFocus
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        Duplicates are ignored. Press Enter or click Add to append to the list below.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeCustomValueModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            className="bg-brand hover:bg-brand-dark"
                            onClick={confirmAddCustomValue}
                        >
                            Add value
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
