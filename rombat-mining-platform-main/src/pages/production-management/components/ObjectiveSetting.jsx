import React, { useState, useEffect } from "react";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { supabase } from "../../../config/supabase";
import { DIMENSIONS_LIST, PERIOD_TYPES, parseExtendedObjective, formatPeriodObjective, upsertObjective, getObjectivesBySite } from "../../../utils/objectiveHelpers";

export default function ObjectiveSetting({ siteId = 'default', onObjectivesChange }) {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newObjective, setNewObjective] = useState({ text: '', dimension: '', period: 'daily' });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadObjectives();
  }, [siteId]);

  const loadObjectives = async () => {
    try {
      const { data } = await getObjectivesBySite(siteId);
      setObjectives(data || []);
    } catch (error) {
      console.error('Load objectives error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setNewObjective({ ...newObjective, text });
    const parsed = parseExtendedObjective(text);
    setPreview(parsed);
  };

  const handleAdd = async () => {
    if (!preview) return;
    try {
      await upsertObjective({ ...preview, siteId });
      await loadObjectives();
      setNewObjective({ text: '', dimension: '', period: 'daily' });
      setPreview(null);
      onObjectivesChange?.();
    } catch (error) {
      console.error('Add objective error:', error);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('objectives').update({ active: false }).eq('id', id);
    await loadObjectives();
  };

  if (loading) {
    return <div>Loading objectives...</div>;
  }

  return (
    <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "rgba(128,90,213,0.12)" }}>
            <Icon name="Target" size={18} color="#805AD5" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              Objectifs par Dimension
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Ex: "500 tonne 0/4" pour objectif journalier 0/4
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" iconName="Plus" iconPosition="left" onClick={() => setEditing(true)}>
          Ajouter
        </Button>
      </div>

      {objectives.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Aucun objectif défini. Ajoutez le premier !
        </div>
      ) : (
        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
          {objectives.map((obj) => (
            <div key={obj.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(128,90,213,0.2)", color: "#805AD5" }}>
                  {obj.dimension.name}
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--color-foreground)" }}>{formatPeriodObjective(obj)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" iconName="Trash2" onClick={() => handleDelete(obj.id)} />
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--color-muted)", borderColor: "var(--color-border)" }}>
          <Input
            label="Objectif libre (ex: 500 tonne 0/4)"
            value={newObjective.text}
            onChange={handleTextChange}
            placeholder="500 tonne pour 0/4 journalier"
          />
          {preview && (
            <div className="p-3 rounded-lg bg-primary/10 text-sm">
              Aperçu: {preview.dimension} - {preview.value} {preview.unit} (auto: daily)
              <Select
                label="Période"
                value={newObjective.period}
                onChange={(e) => setNewObjective({...newObjective, period: e.target.value})}
                options={PERIOD_TYPES.map(p => ({value: p, label: p.charAt(0).toUpperCase() + p.slice(1)}))}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Enregistrer</Button>
            <Button variant="outline" onClick={() => {setEditing(false); setPreview(null); setNewObjective({text:'', dimension:'', period:'daily'});}}>Annuler</Button>
          </div>
        </div>
      )}
    </div>
  );
}

