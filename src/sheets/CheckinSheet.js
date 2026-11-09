import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { store, useLedger } from '../lib/store';
import { newId, toLocalInput } from '../lib/format';
import { EFFECTS, RED_FLAGS, SCALES } from '../data/options';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
const toggle = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
export function CheckinSheet({ onClose, onBackfill }) {
    const toast = useToast();
    const { checkins } = useLedger();
    const [vals, setVals] = useState({});
    const [effects, setEffects] = useState([]);
    const [flags, setFlags] = useState([]);
    const [weight, setWeight] = useState('');
    const [wUnit, setWUnit] = useState(() => checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb');
    const [notes, setNotes] = useState('');
    const [when, setWhen] = useState(() => toLocalInput(new Date()));
    const submit = (e) => {
        e.preventDefault();
        const at = when ? new Date(when) : new Date();
        if (isNaN(at.getTime())) {
            toast('Enter a valid date and time.');
            return;
        }
        if (at.getTime() > Date.now() + 5 * 60e3) {
            toast("That's in the future. Pick today or an earlier day.");
            return;
        }
        const entry = { id: newId(), at: at.toISOString(), effects, flags, notes: notes.trim(), ...vals };
        if (Number(weight) > 0) {
            entry.weight = Number(weight);
            entry.weightUnit = wUnit;
        }
        store.addCheckin(entry);
        toast(flags.length ? 'Saved. Please get medical help now.' : 'Check-in saved.');
        onClose();
    };
    return (_jsx(Sheet, { onClose: onClose, label: "Daily check-in", children: _jsxs("form", { className: "stack gap-4", onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { children: [_jsx("h2", { children: "Daily check-in" }), _jsx("p", { className: "small muted mt-1", children: "1 is poor, 5 is great. Skip anything you like." }), onBackfill && _jsxs("p", { className: "small mt-2", children: ["Catching up from paper? ", _jsx("button", { type: "button", className: "linkish", onClick: onBackfill, children: "Fill in past days" })] })] }), _jsx("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "Close", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }) })] }), SCALES.map(([k, l]) => (_jsxs("div", { className: "field", children: [_jsx("span", { children: l }), _jsx("div", { className: "scale", role: "group", "aria-label": l, children: [1, 2, 3, 4, 5].map(n => (_jsx("button", { type: "button", "aria-pressed": vals[k] === n, onClick: () => setVals({ ...vals, [k]: vals[k] === n ? undefined : n }), children: n }, n))) })] }, k))), _jsxs("label", { className: "field", children: [_jsx("span", { children: "When" }), _jsx("input", { type: "datetime-local", id: "c-at", value: when, max: toLocalInput(new Date()), onChange: e => setWhen(e.target.value) })] }), _jsxs("div", { className: "grid-2", children: [_jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Weight ", _jsx("small", { children: "(optional)" })] }), _jsx("input", { type: "number", id: "c-weight", step: "any", min: "0", inputMode: "decimal", value: weight, onChange: e => setWeight(e.target.value) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Unit" }), _jsxs("select", { id: "c-wunit", value: wUnit, onChange: e => setWUnit(e.target.value), children: [_jsx("option", { children: "lb" }), _jsx("option", { children: "kg" })] })] })] }), _jsxs("fieldset", { className: "field", style: { border: 0, padding: 0, margin: 0 }, children: [_jsx("legend", { style: { fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 6 }, children: "Side effects today" }), _jsx("div", { className: "checks peachy", children: EFFECTS.map(x => _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: effects.includes(x), onChange: () => setEffects(toggle(effects, x)) }), x] }, x)) })] }), _jsxs("fieldset", { className: "field", style: { border: 0, padding: 0, margin: 0 }, children: [_jsx("legend", { style: { fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 6, color: 'var(--danger)' }, children: "Emergency symptoms" }), _jsx("div", { className: "checks red", children: RED_FLAGS.map(x => _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: flags.includes(x), onChange: () => setFlags(toggle(flags, x)) }), x] }, x)) })] }), flags.length > 0 && (_jsxs("div", { className: "alert danger", role: "alert", children: [_jsx("b", { children: "These symptoms need medical care now." }), _jsx("span", { children: "Call 911 or go to the nearest emergency room. Don't wait to finish this form. For a possible overdose or poisoning, call Poison Control at 1-800-222-1222. If you're having thoughts of harming yourself, call or text 988." })] })), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Notes ", _jsx("small", { children: "(optional)" })] }), _jsx("textarea", { id: "c-notes", maxLength: 500, value: notes, onChange: e => setNotes(e.target.value) })] }), _jsxs("div", { className: "sheet-foot", children: [_jsx("button", { type: "button", className: "btn ghost", onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn", children: "Save check-in" })] })] }) }));
}
