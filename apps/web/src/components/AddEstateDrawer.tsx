"use client";

import { formatCurrency } from "@/lib/utils";
import { Save, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type EstateType = "gold" | "stock" | "keyboard";

interface EstateItem {
	_id: string;
	type: EstateType;
	name: string;
	boughtAt: string;
	price: number;
	source: string;
	quantityUnit?: string;
	quantity?: number;
}

interface AddEstateDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSaved: (estate: EstateItem) => void;
}

const TYPE_OPTIONS = [
	{ id: "gold" as EstateType, label: "Vàng", icon: "/icons/golds.png" },
	{ id: "stock" as EstateType, label: "Cổ phiếu", icon: "/icons/stocks.png" },
	{
		id: "keyboard" as EstateType,
		label: "Bàn phím",
		icon: "/icons/keyboards.png",
	},
];

const GOLD_TYPE_OPTIONS = [
	{ value: "Nhẫn 9999", label: "Nhẫn 9999" },
	{ value: "Vàng miếng SJC", label: "Vàng miếng SJC" },
	{ value: "Vàng trang sức 24K", label: "Vàng trang sức 24K" },
];

const GOLD_UNIT_OPTIONS = [
	{ value: "chỉ", label: "Chỉ" },
	{ value: "lượng", label: "Lượng" },
];

const STOCK_SOURCE_OPTIONS = [
	{ value: "Bank", label: "Bank" },
	{ value: "SSI", label: "SSI" },
];

export default function AddEstateDrawer({
	isOpen,
	onClose,
	onSaved,
}: AddEstateDrawerProps) {
	const [type, setType] = useState<EstateType>("gold");
	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState("");
	const [quantityUnit, setQuantityUnit] = useState("chỉ");
	const [goldType, setGoldType] = useState("Nhẫn 9999");
	const [stockCode, setStockCode] = useState("");
	const [stockSource, setStockSource] = useState("Bank");
	const [keyboardName, setKeyboardName] = useState("");
	const [price, setPrice] = useState("");
	const [source, setSource] = useState("");
	const [boughtAt, setBoughtAt] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const resetForm = () => {
		setType("gold");
		setName("");
		setQuantity("");
		setQuantityUnit("chỉ");
		setGoldType("Nhẫn 9999");
		setStockCode("");
		setStockSource("Bank");
		setKeyboardName("");
		setPrice("");
		setSource("");
		setBoughtAt(new Date().toISOString().split("T")[0]);
		setError("");
	};

	const handleTypeChange = (newType: EstateType) => {
		setType(newType);
		setError("");
	};

	const validate = (): string | null => {
		if (!price || !boughtAt) return "Vui lòng điền đầy đủ thông tin";

		switch (type) {
			case "gold":
				if (!quantity) return "Vui lòng nhập số lượng";
				break;
			case "stock":
				if (!stockCode.trim()) return "Vui lòng nhập mã cổ phiếu";
				if (!quantity) return "Vui lòng nhập số lượng";
				break;
			case "keyboard":
				if (!keyboardName.trim()) return "Vui lòng nhập tên bàn phím";
				if (!source.trim()) return "Vui lòng nhập nguồn gốc";
				break;
		}
		return null;
	};

	const buildPayload = () => {
		const base = {
			type,
			boughtAt,
			price: Number(price),
		};

		switch (type) {
			case "gold":
				return {
					...base,
					name: goldType,
					quantity: Number(quantity),
					quantityUnit,
					source: source.trim(),
				};
			case "stock":
				return {
					...base,
					name: stockCode.trim().toUpperCase(),
					quantity: Number(quantity),
					quantityUnit: "cổ phiếu",
					source: stockSource,
				};
			case "keyboard":
				return {
					...base,
					name: keyboardName.trim(),
					source: source.trim(),
				};
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		setSaving(true);
		setError("");
		try {
			const res = await fetch("/api/estates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildPayload()),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Lưu thất bại");
				return;
			}

			const data = await res.json();
			onSaved(data.estate);
			resetForm();
			onClose();
		} catch {
			setError("Lỗi kết nối. Vui lòng thử lại.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			{isOpen && (
				<div
					className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
					onClick={onClose}
				/>
			)}

			<div
				className={`fixed bottom-0 left-0 right-0 z-[70] glass-panel-elevated rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[92dvh] flex flex-col ${isOpen ? "top-[10dvh]" : "top-[100dvh]"}`}>
				<div className="shrink-0">
					<div className="flex justify-center pt-3 pb-1">
						<div className="w-10 h-1 rounded-md bg-[rgba(125,211,252,0.2)]" />
					</div>
					<div className="flex justify-between items-center px-6 pb-3">
						<h2 className="text-xl font-bold text-glacier-on-surface">
							Thêm tài sản
						</h2>
						<button
							onClick={onClose}
							className="w-9 h-9 rounded-md bg-[rgba(125,211,252,0.1)] flex items-center justify-center text-glacier-on-surface-variant hover:text-glacier-on-surface transition-colors">
							<X size={16} />
						</button>
					</div>
				</div>

				<div className="overflow-y-auto flex-1 px-6">
					<form
						id="add-estate-form"
						onSubmit={handleSubmit}
						className="space-y-5">
						{/* Type selector */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-glacier-on-surface">
								Loại tài sản
							</label>
							<div className="grid grid-cols-3 gap-2">
								{TYPE_OPTIONS.map((option) => {
									return (
										<button
											key={option.id}
											type="button"
											onClick={() =>
												handleTypeChange(option.id)
											}
											className={`flex flex-col items-center gap-1 py-3 rounded-md border transition-all active:scale-95 ${
												type === option.id
													? "border-[rgba(125,211,252,0.5)] bg-[rgba(125,211,252,0.1)] text-glacier-primary"
													: "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] text-glacier-on-surface-variant hover:border-[rgba(125,211,252,0.25)]"
											}`}>
											<Image
												unoptimized
												src={option?.icon}
												alt="estate-icon"
												className=""
												width={32}
												height={32}
											/>
											<span className="text-[9px] font-bold uppercase tracking-wide">
												{option.label}
											</span>
										</button>
									);
								})}
							</div>
						</div>

						{/* Gold fields */}
						{type === "gold" && (
							<>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Loại vàng
									</label>
									<select
										value={goldType}
										onChange={(e) => {
											setGoldType(e.target.value);
											setError("");
										}}
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface appearance-none">
										{GOLD_TYPE_OPTIONS.map((opt) => (
											<option
												key={opt.value}
												value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<label className="block text-sm font-medium text-glacier-on-surface">
											Số lượng
										</label>
										<input
											type="number"
											value={quantity}
											onChange={(e) => {
												setQuantity(e.target.value);
												setError("");
											}}
											placeholder="0.1"
											className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070] no-spinner"
											min="0"
											step="any"
										/>
									</div>
									<div className="space-y-2">
										<label className="block text-sm font-medium text-glacier-on-surface">
											Đơn vị
										</label>
										<select
											value={quantityUnit}
											onChange={(e) => {
												setQuantityUnit(e.target.value);
												setError("");
											}}
											className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface appearance-none">
											{GOLD_UNIT_OPTIONS.map((opt) => (
												<option
													key={opt.value}
													value={opt.value}>
													{opt.label}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="space-y-2 relative">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Giá mua (VNĐ)
									</label>
									<input
										type="number"
										value={price}
										onChange={(e) => {
											setPrice(e.target.value);
											setError("");
										}}
										placeholder="0"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										min="0"
										step="1000"
									/>
									{price && (
										<small className="absolute -bottom-4 right-0 text-orange-400 text-xs">
											{formatCurrency(Number(price))}
										</small>
									)}
								</div>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Nguồn gốc
									</label>
									<input
										type="text"
										value={source}
										onChange={(e) => {
											setSource(e.target.value);
											setError("");
										}}
										placeholder="vd. PNJ, tiệm vàng"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										maxLength={100}
									/>
								</div>
							</>
						)}

						{/* Stock fields */}
						{type === "stock" && (
							<>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Mã cổ phiếu
									</label>
									<input
										type="text"
										value={stockCode}
										onChange={(e) => {
											setStockCode(
												e.target.value.toUpperCase(),
											);
											setError("");
										}}
										placeholder="vd. VCB, FPT, MWG"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070] uppercase"
										maxLength={10}
									/>
								</div>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Số lượng
									</label>
									<input
										type="number"
										value={quantity}
										onChange={(e) => {
											setQuantity(e.target.value);
											setError("");
										}}
										placeholder="100"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										min="0"
										step="1"
									/>
								</div>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Nguồn
									</label>
									<select
										value={stockSource}
										onChange={(e) => {
											setStockSource(e.target.value);
											setError("");
										}}
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface appearance-none">
										{STOCK_SOURCE_OPTIONS.map((opt) => (
											<option
												key={opt.value}
												value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-2 relative">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Giá mua (VNĐ)
									</label>
									<input
										type="number"
										value={price}
										onChange={(e) => {
											setPrice(e.target.value);
											setError("");
										}}
										placeholder="0"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										min="0"
										step="1000"
									/>
									{price && (
										<small className="absolute -bottom-4 right-0 text-orange-400 text-xs">
											{formatCurrency(Number(price))}
										</small>
									)}
								</div>
							</>
						)}

						{/* Keyboard fields */}
						{type === "keyboard" && (
							<>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Tên bàn phím
									</label>
									<input
										type="text"
										value={keyboardName}
										onChange={(e) => {
											setKeyboardName(e.target.value);
											setError("");
										}}
										placeholder="vd. Filco Majestouch 2"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										maxLength={100}
									/>
								</div>

								<div className="space-y-2 relative">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Giá mua (VNĐ)
									</label>
									<input
										type="number"
										value={price}
										onChange={(e) => {
											setPrice(e.target.value);
											setError("");
										}}
										placeholder="0"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										min="0"
										step="1000"
									/>
									{price && (
										<small className="absolute -bottom-4 right-0 text-orange-400 text-xs">
											{formatCurrency(Number(price))}
										</small>
									)}
								</div>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-glacier-on-surface">
										Nguồn gốc
									</label>
									<input
										type="text"
										value={source}
										onChange={(e) => {
											setSource(e.target.value);
											setError("");
										}}
										placeholder="vd. GearVN, Taobao"
										className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface placeholder:text-[#4a6070]"
										maxLength={100}
									/>
								</div>
							</>
						)}

						{/* Common: Bought At */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-glacier-on-surface">
								Ngày mua
							</label>
							<input
								type="date"
								value={boughtAt}
								onChange={(e) => {
									setBoughtAt(e.target.value);
									setError("");
								}}
								className="glass-input w-full py-3 px-4 rounded-md text-glacier-on-surface"
							/>
						</div>

						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-md px-4 py-2.5">
								<p className="text-red-400 text-sm">{error}</p>
							</div>
						)}
					</form>
				</div>

				<div className="shrink-0 px-6 py-4">
					<div className="flex gap-3">
						<button
							type="submit"
							form="add-estate-form"
							disabled={saving}
							className="flex-1 py-3.5 rounded-md bg-glacier-primary text-[#001f2e] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#93d9fc] transition-colors active:scale-[0.98]">
							{saving ? (
								<span className="inline-block w-4 h-4 border-2 border-[#001f2e] border-t-transparent rounded-full animate-spin" />
							) : (
								<>
									<Save size={16} />
									Lưu lại
								</>
							)}
						</button>
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-3.5 rounded-md glass-panel text-glacier-on-surface font-bold text-sm uppercase tracking-wider hover:bg-[rgba(125,211,252,0.1)] transition-colors active:scale-[0.98]">
							Huỷ
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
