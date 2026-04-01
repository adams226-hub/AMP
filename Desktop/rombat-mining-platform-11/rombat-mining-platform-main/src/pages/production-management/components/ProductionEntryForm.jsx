import React from 'react';
import Input from 'components/ui/Input';
import Button from 'components/ui/Button';

const ProductionEntryForm = ({ onSubmit = () => {}, objectives = {} }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    onSubmit({
      site: form.get('site'),
      quantity: form.get('quantity'),
      team: form.get('team'),
      equipment: form.get('equipment') ? [form.get('equipment')] : [],
      notes: form.get('notes'),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <h3 className="text-sm font-semibold mb-3">Saisie Production</h3>
      <div className="space-y-2">
        <Input name="site" placeholder="Site" />
        <Input name="quantity" type="number" placeholder="Quantité (t)" />
        <Input name="team" placeholder="Équipe" />
        <Input name="equipment" placeholder="Engin (ex: EX-001)" />
        <Input name="notes" placeholder="Notes" />
        <div className="pt-2">
          <Button type="submit">Enregistrer</Button>
        </div>
      </div>
    </form>
  );
};

export default ProductionEntryForm;
