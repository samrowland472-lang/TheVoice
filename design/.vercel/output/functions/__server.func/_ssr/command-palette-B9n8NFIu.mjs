import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { m as useRouterState, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { T as Layers, o as SwatchBook } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/command-palette-B9n8NFIu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function AppShell({ children }) {
	const inStudio = useRouterState({ select: (s) => s.location.pathname }).startsWith("/studio");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh overflow-hidden bg-ground text-ink",
		children: [!inStudio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "hidden w-[220px] shrink-0 flex-col border-r border-border bg-surface/60 md:flex",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2 px-5 py-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-phosphor shadow-[0_0_12px_var(--color-phosphor)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold tracking-[0.18em] uppercase",
						children: "The Voice"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "flex flex-1 flex-col gap-0.5 px-3",
					"aria-label": "Sections",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: !inStudio,
						to: "/",
						icon: Layers,
						label: "Design"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/#brand",
						className: "flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-ink-dim transition-colors duration-150 hover:bg-surface-alt hover:text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwatchBook, {
							className: "size-4",
							strokeWidth: 1.75
						}), "Brand"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-5 py-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-ink-faint uppercase",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-phosphor" }), "Loop live"]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-0 min-w-0 flex-1 flex-col",
			children
		})]
	});
}
function NavItem({ to, icon: Icon, label, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: cn("flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm transition-colors duration-150", active ? "bg-phosphor/10 text-phosphor" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4",
			strokeWidth: 1.75
		}), label]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor/70", {
	variants: {
		variant: {
			primary: "bg-phosphor text-phosphor-ink hover:bg-phosphor/90",
			secondary: "border border-border bg-glass text-ink hover:border-phosphor hover:bg-surface-alt",
			ghost: "text-ink-dim hover:bg-surface-alt hover:text-ink",
			danger: "border border-alert/40 text-alert hover:bg-alert/10"
		},
		size: {
			sm: "h-8 px-3 text-xs rounded-[8px]",
			md: "h-10 px-4 text-sm rounded-[12px]",
			icon: "size-10 rounded-[12px]",
			"icon-sm": "size-8 rounded-[8px]"
		}
	},
	defaultVariants: {
		variant: "secondary",
		size: "md"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		...props
	});
});
Button.displayName = "Button";
function CommandPalette({ open, onClose, commands, placeholder = "Search tools, actions, templates…" }) {
	const [q, setQ] = (0, import_react.useState)("");
	const [i, setI] = (0, import_react.useState)(0);
	const inputRef = (0, import_react.useRef)(null);
	const filtered = (0, import_react.useMemo)(() => {
		const s = q.trim().toLowerCase();
		if (!s) return commands;
		return commands.filter((c) => `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(s));
	}, [commands, q]);
	(0, import_react.useEffect)(() => {
		if (open) {
			setQ("");
			setI(0);
			const t = window.setTimeout(() => inputRef.current?.focus(), 20);
			return () => window.clearTimeout(t);
		}
	}, [open]);
	(0, import_react.useEffect)(() => {
		setI(0);
	}, [q]);
	if (!open) return null;
	const active = filtered[i];
	function run(cmd) {
		if (!cmd) return;
		onClose();
		cmd.run();
	}
	const groups = [...new Set(filtered.map((c) => c.group))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center bg-ground/70 px-3 pt-[12vh] backdrop-blur-[2px]",
		onMouseDown: (e) => {
			if (e.target === e.currentTarget) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-label": "Command palette",
			className: "w-full max-w-lg overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder,
					className: "h-12 w-full border-b border-border bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-faint",
					onKeyDown: (e) => {
						if (e.key === "Escape") {
							e.preventDefault();
							onClose();
						} else if (e.key === "ArrowDown") {
							e.preventDefault();
							setI((n) => Math.min(filtered.length - 1, n + 1));
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							setI((n) => Math.max(0, n - 1));
						} else if (e.key === "Enter") {
							e.preventDefault();
							run(active);
						}
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-[min(52vh,420px)] overflow-auto py-2 scrollbar-thin",
					children: [groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-ink-faint uppercase",
							children: g
						}), filtered.filter((c) => c.group === g).map((c) => {
							const idx = filtered.indexOf(c);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onMouseEnter: () => setI(idx),
								onClick: () => run(c),
								className: cn("flex h-9 w-full items-center justify-between rounded-[10px] px-3 text-left text-sm", idx === i ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.label }), c.hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[10px] text-ink-faint",
									children: c.hint
								})]
							}, c.id);
						})]
					}, g)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-center text-sm text-ink-faint",
						children: "Nothing matches."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-ink-faint uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "↑↓ Move · Enter run" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Esc close" })]
				})
			]
		})
	});
}
//#endregion
export { cn as i, Button as n, CommandPalette as r, AppShell as t };
