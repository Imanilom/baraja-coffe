import React from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import { IconSelect } from "../../../components/iconSelect";

const SidebarMenuForm = ({ formData, setFormData, onSubmit, isSubmitting, parentOptions = [] }) => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: "#d1d5db",
            minHeight: "34px",
            fontSize: "13px",
            color: "#6b7280",
            boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
            "&:hover": {
                borderColor: "#9ca3af",
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        input: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "13px",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "13px",
            color: "#374151",
            backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    const badgeOptions = [
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "success", label: "Success" },
        { value: "danger", label: "Danger" },
        { value: "warning", label: "Warning" },
        { value: "info", label: "Info" },
    ];

    const permissions = [
        "manage_users",
        "manage_roles",
        "manage_products",
        "view_reports",
        "manage_outlets",
        "manage_inventory",
        "manage_vouchers",
        "manage_promo",
        "manage_orders",
        "manage_shifts",
        "manage_operational",
        "manage_loyalty",
        "manage_finance",
        "superadmin"
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            if (name === "requiredPermissions") {
                if (checked) {
                    setFormData((prev) => ({
                        ...prev,
                        requiredPermissions: [...prev.requiredPermissions, value],
                    }));
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        requiredPermissions: prev.requiredPermissions.filter((p) => p !== value),
                    }));
                }
            } else {
                // untuk checkbox boolean (isActive, isSubmenu)
                setFormData((prev) => ({ ...prev, [name]: checked }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    return (
        <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow space-y-4">
            {/* Nama */}
            <div>
                <label className="block mb-1 font-medium">Nama</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                />
            </div>

            {/* Icon */}
            <IconSelect
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                label="Icon"
                showPreview={true}
            />

            {/* Path */}
            <div>
                <label className="block mb-1 font-medium">Path</label>
                <input
                    type="text"
                    name="path"
                    value={formData.path}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            {/* Urutan */}
            <div>
                <label className="block mb-1 font-medium">Urutan</label>
                <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            {/* Parent Menu */}
            <div>
                <label className="block mb-1 font-medium">Parent Menu</label>
                <Select
                    name="parentId"
                    value={
                        formData.parentId
                            ? parentOptions.find((p) => p._id === formData.parentId)
                            : null
                    }
                    onChange={(selected) =>
                        setFormData((prev) => ({
                            ...prev,
                            parentId: selected ? selected._id : null,
                        }))
                    }
                    options={parentOptions}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option._id}
                    placeholder="-- Tidak ada --"
                    isClearable
                    className="w-full"
                    styles={customSelectStyles}
                />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                />
                <label className="font-medium">Aktif</label>
            </div>

            {/* Is Submenu */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="isSubmenu"
                    checked={formData.isSubmenu}
                    onChange={handleChange}
                />
                <label className="font-medium">Submenu</label>
            </div>

            {/* Permissions */}
            <div>
                <label className="block mb-1 font-medium">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                    {permissions.map((perm) => (
                        <label key={perm} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="requiredPermissions"
                                value={perm}
                                checked={formData.requiredPermissions.includes(perm)}
                                onChange={handleChange}
                            />
                            {perm}
                        </label>
                    ))}
                </div>
            </div>

            {/* Badge */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-medium">Badge Text</label>
                    <input
                        type="text"
                        name="badgeText"
                        value={formData.badge?.text || ""}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                badge: { ...prev.badge, text: e.target.value },
                            }))
                        }
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Badge Color</label>
                    <Select
                        name="badgeColor"
                        options={badgeOptions}
                        value={badgeOptions.find(
                            (option) => option.value === formData.badge?.color
                        ) || null}
                        onChange={(selected) =>
                            setFormData((prev) => ({
                                ...prev,
                                badge: { ...prev.badge, color: selected ? selected.value : "" },
                            }))
                        }
                        placeholder="Pilih badge color..."
                        className="w-full"
                        styles={customSelectStyles}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Link
                    to={"/admin/access-settings/bar-menu"}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-white border text-green-900 rounded"
                >
                    Kembali
                </Link>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-900 border text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
        </form>
    );
};

export default SidebarMenuForm;
