import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi2';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

function SectionCard({ title, children }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-base mb-4 dark:text-white">{title}</h2>
            {children}
        </div>
    );
}

function TagList({ items, onRemove, colorClass = 'bg-[#3498db]/10 text-[#2980b9] dark:bg-[#3498db]/10 dark:text-[#5dade2]' }) {
    return (
        <div className="flex flex-wrap gap-2">
            {(items || []).map((item, i) => (
                <span key={i} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${colorClass}`}>
                    {item}
                    {onRemove && (
                        <button onClick={() => onRemove(item)} className="ml-1 hover:opacity-70">
                            <HiOutlineTrash className="w-3 h-3" />
                        </button>
                    )}
                </span>
            ))}
        </div>
    );
}

export default function SettingsPage() {
    const { data: settings, loading, refetch } = useApi('/admin/settings', {}, []);

    // Languages
    const lang = settings?.languages;
    const cur = settings?.currencies;
    const tz = settings?.timezones;
    const df = settings?.date_formats;

    const addItem = async (type, body) => {
        try {
            await api.post(`/admin/settings/${type}`, body);
            toast.success('Added!');
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add');
        }
    };

    const setDefault = async (type, body) => {
        try {
            await api.put(`/admin/settings/${type}/default`, body);
            toast.success('Default updated!');
            refetch();
        } catch {
            toast.error('Failed to update default');
        }
    };

    const setActive = async (type, currentActive, item) => {
        const newActive = currentActive?.includes(item)
            ? currentActive.filter((a) => a !== item)
            : [...(currentActive || []), item];
        try {
            const bodyKey = type === 'languages' ? 'active' : type === 'currencies' ? 'active' : 'active';
            await api.put(`/admin/settings/${type}/active`, { [bodyKey]: newActive });
            toast.success('Active list updated!');
            refetch();
        } catch {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-40 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Settings</h1>

            {/* Languages */}
            <SectionCard title="Languages">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Default: <strong>{lang?.default}</strong></p>
                        <p className="text-xs text-gray-500 mb-2">Active:</p>
                        <TagList
                            items={lang?.active}
                            onRemove={(code) => setActive('languages', lang?.active, code)}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Available — click to toggle active</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {(lang?.available || []).map((l) => {
                                const isActive = lang?.active?.includes(l.code);
                                return (
                                    <button
                                        key={l.code}
                                        onClick={() => setActive('languages', lang?.active, l.code)}
                                        className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${isActive
                                                ? 'border-[#3498db]/30 bg-[#3498db]/10 dark:bg-[#3498db]/10 text-[#2980b9]'
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <span className="font-mono text-xs mr-1">{l.code}</span>
                                        {l.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <AddLanguageForm onAdd={(data) => addItem('languages', data)} />
                </div>
            </SectionCard>

            {/* Currencies */}
            <SectionCard title="Currencies">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Default: <strong>{cur?.default}</strong></p>
                        <p className="text-xs text-gray-500 mb-2">Active:</p>
                        <TagList items={cur?.active} colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {(cur?.available || []).map((c) => {
                            const isActive = cur?.active?.includes(c.code);
                            return (
                                <button
                                    key={c.code}
                                    onClick={() => setActive('currencies', cur?.active, c.code)}
                                    className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${isActive
                                            ? 'border-green-300 bg-green-50 dark:bg-green-900/30 text-green-700'
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <span className="font-mono text-xs mr-1">{c.symbol}</span>
                                    {c.code} — {c.name}
                                </button>
                            );
                        })}
                    </div>
                    <AddCurrencyForm onAdd={(data) => addItem('currencies', data)} />
                </div>
            </SectionCard>

            {/* Timezones */}
            <SectionCard title="Timezones">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Default: <strong>{tz?.default}</strong></p>
                        <TagList items={tz?.active} colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {(tz?.available || []).map((t, i) => {
                            const isActive = tz?.active?.includes(t.value);
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActive('timezones', tz?.active, t.value)}
                                    className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${isActive
                                            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </SectionCard>

            {/* Date Formats */}
            <SectionCard title="Date Formats">
                <div>
                    <p className="text-xs text-gray-500 mb-3">Click a format to set it as default</p>
                    <div className="flex flex-wrap gap-2">
                        {(df?.available || []).map((f, i) => (
                            <button
                                key={i}
                                onClick={() => setDefault('date-formats', { format: f.value })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-mono transition-colors ${df?.default === f.value
                                        ? 'border-[#3498db]/30 bg-[#3498db]/10 dark:bg-[#3498db]/10 text-[#2980b9]'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {df?.default === f.value && <HiOutlineCheck className="w-3 h-3" />}
                                {f.value}
                            </button>
                        ))}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

function AddLanguageForm({ onAdd }) {
    const { register, handleSubmit, reset } = useForm();
    const onSubmit = (data) => { onAdd(data); reset(); };
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 flex-wrap">
            <input {...register('code', { required: true })} placeholder="Code (e.g. es)" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-transparent w-28 dark:text-white" />
            <input {...register('name', { required: true })} placeholder="Name (e.g. Spanish)" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-transparent w-40 dark:text-white" />
            <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm">
                <HiOutlinePlus className="w-4 h-4" /> Add
            </button>
        </form>
    );
}

function AddCurrencyForm({ onAdd }) {
    const { register, handleSubmit, reset } = useForm();
    const onSubmit = (data) => { onAdd(data); reset(); };
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 flex-wrap">
            <input {...register('code', { required: true })} placeholder="Code (e.g. GBP)" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-transparent w-24 dark:text-white" />
            <input {...register('symbol', { required: true })} placeholder="Symbol (e.g. £)" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-transparent w-24 dark:text-white" />
            <input {...register('name', { required: true })} placeholder="Name (e.g. British Pound)" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-transparent w-44 dark:text-white" />
            <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm">
                <HiOutlinePlus className="w-4 h-4" /> Add
            </button>
        </form>
    );
}
