import React, { useState } from "react";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { supabase } from "../../../config/supabase";
import { DIMENSIONS_LIST } from "../../../utils/objectiveHelpers";

const SITES = [
  { value: "kamoto", label: "Site Kamoto" },
  { value: "kolwezi", label: "Site Kolwezi" },
  { value: "tenke", label: "Site Tenke Fungurume" },
  { value: "mutanda", label: "Site Mutanda" },
];

const TEAMS = [
  { value: "equipe_a", label: "Équipe A - Matin (06h-14h)" },
  { value: "equipe_b", label: "Équipe B - Après-midi (14h-22h)" },
  { value: "equipe_c", label: "Équipe C - Nuit (22h-06h)" },
];

const EQUIPMENT_LIST = [
  { id: "EX-001", label: "Excavatrice EX-001 (Caterpillar 390F)" },
  { id: "EX-002", label: "Excavatrice EX-002 (Komatsu PC800)" },
  { id: "EX-003", label: "Excavatrice EX-003 (Liebherr R9250)" },
  { id: "BU-001", label: "Bulldozer BU-001 (CAT D10T)" },
  { id: "BU-002", label: "Bulldozer BU-002 (Komatsu D375A)" },
  { id: "CA-001", label: "Camion CA-001 (Caterpillar 793F)" },
  { id: "CA-002", label: "Camion CA-002 (Komatsu 930E)" },
  { id: "FO-001", label: "Foreuse FO-001 (Atlas Copco)" },
];

export default function ProductionEntry({ objectives = {}, siteId, onSuccess }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    site: siteId || "",
    quantity: { }, // per dim
    team: "",
    equipment: [],
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleQuantityChange = (dim, value) => {
    const newQuantity = {...form.quantity, [dim]: value };
    setForm({...form, quantity: newQuantity });
  };

  const toggleEquipment = (id) => {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment?.includes(id)
        ? prev.equipment.filter((e) => e !== id)
        : [...prev.equipment, id],
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.site) newErrors.site = "Sélectionnez un site.";
    const hasQuantity = Object.values(form.quantity).some(q => q && Number(q) > 0);
    if (!hasQuantity) newErrors.quantity = "Saisissez au moins une quantité.";
    if (!form.team) newErrors.team = "Sélectionnez une équipe.";
    if (form.equipment.length === 0) newErrors.equipment = "Sélectionnez au moins un engin.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Create entry
      const { data: entry } = await supabase
        .from('stock_entries')
        .insert({
          entry_date: form.date,
          source: form.site,
        })
        .select()
        .single();

      // Add details per dim
      const details = DIMENSIONS_LIST.map(dim => ({
        stock_entry_id: entry.id,
        dimension_name: dim, // temp, map to id later
        quantity: Number(form.quantity[dim]) || 0,
      })).filter(d => d.quantity > 0);

      await supabase.from('stock_entry_details').insert(details);

      onSuccess?.(form);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ date: new Date().toISOString().split('T')[0], site: siteId || "", quantity: {}, team: "", equipment: [], notes: "" });
      }, 2500);
    } catch (error) {
      console.error(error);
      setErrors({submit: 'Erreur sauvegarde'});
    }
  };

  const totalQuantity = Object.values(form.quantity).reduce((sum, q) => sum + (Number(q) || 0), 0);

  return (
    <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "rgba(44,85,48,0.12)" }}>
          <Icon name="ClipboardList" size={18} color="var(--color-primary)" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            Saisie Production par Dimension
          </h2>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Total: {totalQuantity.toFixed(1)} tonnes
          </p>
        </div>
      </div>

      {submitted && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ background: "rgba(56,161,105,0.1)", border: "1px solid var(--color-success)" }}>
          <Icon name="CheckCircle" size={16} color="var(--color-success)" />
          <span>Production enregistrée !</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
          <div>
            <label className="block text-sm font-medium mb-1">Site</label>
            <input type="text" value="Koro" disabled className="w-full px-3 py-2 rounded border" style={{ background: "var(--color-background)" }} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {DIMENSIONS_LIST.map((dim) => {
            const objDaily = objectives.find(o => o.dimension?.name === dim && o.period_type === 'daily');
            const progress = objDaily ? ((Number(form.quantity[dim]) || 0) / objDaily.value * 100) : 0;
            return (
              <div key={dim} className="space-y-1">
                <label className="block text-xs font-medium">{dim}</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.quantity[dim] || ''}
                  onChange={(e) => handleQuantityChange(dim, e.target.value)}
                  className="text-xs h-8"
                />
                {objDaily && (
                  <div className="h-1.5 rounded-full overflow-hidden bg-muted/50">
                    <div className="h-full rounded-full transition-all" style={{ 
                      width: `${Math.min(100, progress)}%`, 
                      background: progress >= 100 ? 'var(--color-success)' : 'var(--color-accent)' 
                    }} />
                  </div>
                )}
                {objDaily && <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{progress.toFixed(0)}% obj</span>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Équipe *</label>
            <select value={form.team} onChange={(e) => setForm({...form, team: e.target.value)} className="w-full px-3 py-2 rounded border" style={{ background: "var(--color-background)" }}>
              <option value="">Choisir...</option>
              {TEAMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Engins Utilisés *</label>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_LIST.map((eq) => (
              <label key={eq.id} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer" style={{ borderColor: form.equipment.includes(eq.id) ? 'var(--color-primary)' : 'var(--color-border)' }}>
                <input type="checkbox" checked={form.equipment.includes(eq.id)} onChange={() => toggleEquipment(eq.id)} className="w-4 h-4 rounded" style={{ accentColor: "var(--color-primary)" }} />
                <span className="text-xs">{eq.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="default" type="submit" iconName="Save">
            Enregistrer ({totalQuantity.toFixed(1)} t)
          </Button>
          <Button variant="outline" type="reset" iconName="RotateCcw">
            Réinitialiser
          </Button>
        </div>
      </form>
    </div>
  );
}

