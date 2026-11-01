import { UNITS } from '../data/options';
import { measuresFor } from '../data/measures';
import { PEP } from '../data/peptides';

/** Options for a unit <select>: the compound's usual units first, then the rest. */
export function UnitOptions({ compoundId }: { compoundId?: string }) {
  const usual = measuresFor(compoundId).map(m => m.u);
  if (!usual.length) return <>{UNITS.map(u => <option key={u}>{u}</option>)}</>;
  return (
    <>
      <optgroup label={`Usual for ${PEP[compoundId!]?.name ?? 'this'}`}>{usual.map(u => <option key={u}>{u}</option>)}</optgroup>
      <optgroup label="Other units">{UNITS.filter(u => !usual.includes(u)).map(u => <option key={u}>{u}</option>)}</optgroup>
    </>
  );
}

/** One-tap choices showing how a compound is usually measured, and which product form each goes with. */
export function UsualUnits({ compoundId, value, onPick }: { compoundId?: string; value: string; onPick: (u: string) => void }) {
  const usual = measuresFor(compoundId);
  if (!usual.length) return null;
  return (
    <div className="usual-units">
      <span className="xsmall muted" id="usual-units-h">How {PEP[compoundId!]?.name ?? 'it'} is usually measured</span>
      <div className="row-wrap" role="group" aria-labelledby="usual-units-h">
        {usual.map(m => (
          <button key={m.u} type="button" className="fchip" aria-pressed={value === m.u} onClick={() => onPick(m.u)}>
            <b>{m.u}</b><small>{m.how}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
