import React from 'react';
import Input from 'components/ui/Input';
import Button from 'components/ui/Button';

const ObjectiveSettings = ({ objectives = {}, onSave = () => {} }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    onSave({ daily: Number(f.get('daily')), monthly: Number(f.get('monthly')) });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <h3 className="text-sm font-semibold mb-3">Objectifs</h3>
      <div className="space-y-2">
        <Input name="daily" defaultValue={objectives?.daily} placeholder="Objectif journalier" />
        <Input name="monthly" defaultValue={objectives?.monthly} placeholder="Objectif mensuel" />
        <div className="pt-2">
          <Button type="submit">Enregistrer</Button>
        </div>
      </div>
    </form>
  );
};

export default ObjectiveSettings;
