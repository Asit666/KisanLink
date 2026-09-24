import React, { useState } from 'react';
import { AGRI_INPUT_SPECS } from '../../data/mockData';

/**
 * AgriInputsView — Fertilizers, Pesticides, Bio-Inputs & Equipment Procurement
 */
export default function AgriInputsView({
  text = {},
  crops = [],
  onSellInput,
  inputCategoryFilter: controlledFilter,
  setInputCategoryFilter: controlledSetFilter,
  quickProcureInputModal: controlledModal,
  setQuickProcureInputModal: controlledSetModal,
  onSubmitProcure,
  onProcureInput
}) {
  const [localCategoryFilter, setLocalCategoryFilter] = useState('ALL');
  const [localModal, setLocalModal] = useState(null);

  const inputCategoryFilter = controlledFilter !== undefined ? controlledFilter : localCategoryFilter;
  const setInputCategoryFilter = controlledSetFilter || setLocalCategoryFilter;
  const quickProcureInputModal = controlledModal !== undefined ? controlledModal : localModal;
  const setQuickProcureInputModal = controlledSetModal || setLocalModal;

  function handleQuickProcureInputSubmit(e) {
    e.preventDefault();
    if (onSubmitProcure) {
      onSubmitProcure(e);
      return;
    }
    if (onProcureInput && quickProcureInputModal) {
      onProcureInput(quickProcureInputModal);
    }
    setQuickProcureInputModal(null);
  }

  return (
    <div className="view-container">
      <section className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p className="eyebrow">{text.inputsSectionTitle || 'FARM INPUTS & CERTIFIED AGRO-CHEMICALS'}</p>
            <h2>{text.inputsSectionTitle || 'Farm Inputs & Certified Agro-Chemicals'}</h2>
          </div>
          <span className="count">
            {crops.filter(c => ['FERTILIZER', 'PESTICIDE', 'BIO_INPUT', 'FARM_EQUIPMENT'].includes(c.category)).length} {text.inputsAvailable || 'Products Available'}
          </span>
        </div>
        <p className="muted" style={{ margin: '4px 0 14px', fontSize: '13px' }}>
          {text.inputsSectionSubtitle || 'Source verified seeds, water-soluble fertilizers, and bio-protection inputs directly from authorized distributors.'}
        </p>

        <div className="marketplace-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="category-filter-bar" style={{ margin: 0 }}>
            {[
              { value: 'ALL', label: text.inputsCategoryAll || 'All' },
              { value: 'FERTILIZER', label: text.inputsCategoryFertilizers || 'Fertilizers' },
              { value: 'PESTICIDE', label: text.inputsCategoryPesticides || 'Pesticides' },
              { value: 'BIO_INPUT', label: text.inputsCategoryBioInputs || 'Bio-Inputs' },
              { value: 'FARM_EQUIPMENT', label: 'Farm Equipment' },
            ].map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`filter-chip ${inputCategoryFilter === cat.value ? 'active' : ''}`}
                onClick={() => setInputCategoryFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="agri-inputs-grid" style={{ marginTop: '16px' }}>
          {crops
            .filter((c) => {
              const isInput = ['FERTILIZER', 'PESTICIDE', 'BIO_INPUT', 'FARM_EQUIPMENT'].includes(c.category);
              if (!isInput) return false;
              if (inputCategoryFilter === 'ALL') return true;
              return c.category === inputCategoryFilter;
            })
            .map((item) => {
              const spec = AGRI_INPUT_SPECS[item.name] || {
                category: item.category,
                composition: 'Certified agricultural grade formulation',
                dosage: 'As recommended by agronomic officer',
                type: item.category,
                subsidized: false,
                indicativePrice: `Per ${item.unit || 'unit'}`,
                rating: '4.8/5',
                dealers: 'Authorized Agro-Dealers Network',
              };

              return (
                <div key={item.id} className="agri-input-card">
                  <div className="agri-input-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span className={`category-badge category-${item.category?.toLowerCase()}`}>
                          {item.category}
                        </span>
                        {spec.subsidized && (
                          <span className="subsidized-pill">{text.inputsGovtSubsidized || 'Govt Subsidized'}</span>
                        )}
                      </div>
                      <h3 style={{ margin: '4px 0 2px', fontSize: '15px' }}>{item.name}</h3>
                      <span style={{ font: "9px 'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>
                        {text.inputsStandardUnit || 'Unit:'} {item.unit}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ font: "9px 'DM Mono', monospace", color: '#778078', textTransform: 'uppercase', display: 'block' }}>{text.inputsIndicativeRate || 'Indicative Rate'}</span>
                      <strong style={{ fontSize: '15px', color: '#202a27' }}>{spec.indicativePrice}</strong>
                    </div>
                  </div>

                  <div className="agri-input-specs">
                    <div className="spec-row">
                      <span className="spec-label">{text.inputsComposition || 'Composition'}</span>
                      <span className="spec-value">{spec.composition}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">{text.inputsDosage || 'Dosage'}</span>
                      <span className="spec-value">{spec.dosage}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">{text.inputsDistributorHubs || 'Distributors'}</span>
                      <span className="spec-value">{spec.dealers} ({spec.rating})</span>
                    </div>
                  </div>

                  <div className="agri-input-actions">
                    <button
                      type="button"
                      className="trade-btn trade-btn-primary"
                      onClick={() => setQuickProcureInputModal({
                        item,
                        spec,
                        quantity: 5,
                        deliveryDistrict: 'Local Farm Depot'
                      })}
                    >
                      {text.inputsProcure || 'Procure for Farm'}
                    </button>
                    <button
                      type="button"
                      className="trade-btn trade-btn-secondary"
                      onClick={() => onSellInput && onSellInput(item, spec)}
                    >
                      {text.inputsListStock || 'List Dealer Stock'}
                    </button>
                  </div>
                </div>
              );
            })}
          {crops.filter(c => ['FERTILIZER', 'PESTICIDE', 'BIO_INPUT', 'FARM_EQUIPMENT'].includes(c.category)).length === 0 && (
            <p className="muted" style={{ padding: '16px 0' }}>{text.inputsConnectingCatalog || 'Connecting to regional agro-input dealers catalog...'}</p>
          )}
        </div>
      </section>

      {quickProcureInputModal && (
        <div className="modal-backdrop" onClick={() => setQuickProcureInputModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{text.inputProcurementTitle || 'DIRECT PROCUREMENT ORDER'}</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '16px' }}>
                  {(text.inputProcureItem || 'Procure {item}').replace('{item}', quickProcureInputModal.item.name)}
                </h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setQuickProcureInputModal(null)}>&times;</button>
            </div>

            <form onSubmit={handleQuickProcureInputSubmit} style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#faf9f5', border: '1px solid #d9d6cc', borderRadius: '4px', padding: '10px 12px' }}>
                <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>{text.inputUnitRate || 'Unit Rate:'}</span>
                <strong style={{ marginLeft: '8px', fontSize: '13px' }}>{quickProcureInputModal.spec.indicativePrice}</strong>
                <div style={{ fontSize: '11px', color: '#566057', marginTop: '4px' }}>
                  {text.inputDistributors || 'Fulfillment Centers:'} {quickProcureInputModal.spec.dealers}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field-group">
                  <label className="field-label">{text.inputOrderQuantity || 'Quantity'}</label>
                  <input
                    type="number"
                    className="field-input"
                    min="1"
                    value={quickProcureInputModal.quantity}
                    onChange={(e) => setQuickProcureInputModal(p => ({ ...p, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">{text.inputCalculatedTotal || 'Estimated Total'}</label>
                  <input
                    type="text"
                    className="field-input"
                    disabled
                    value={`₹${(Number(quickProcureInputModal.spec.indicativePrice.replace(/[^0-9.]/g, '')) || 450) * Number(quickProcureInputModal.quantity || 1)}`}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">{text.inputDeliveryDistrict || 'Delivery Location / Hub'}</label>
                <input
                  type="text"
                  className="field-input"
                  value={quickProcureInputModal.deliveryDistrict}
                  onChange={(e) => setQuickProcureInputModal(p => ({ ...p, deliveryDistrict: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" onClick={() => setQuickProcureInputModal(null)}>
                  {text.inputCancel || 'Cancel'}
                </button>
                <button type="submit" className="trade-btn trade-btn-primary">
                  {text.inputConfirmProcurement || 'Confirm Procurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
