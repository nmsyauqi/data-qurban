import React, { useState, useEffect } from 'react';
import { AnimalType, Qurban } from '../types';
import { X, Plus, Trash2, ShieldCheck, Scale, FileText, Sparkles } from 'lucide-react';

interface AnimalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (animalType: AnimalType, owners: string[], weight: number | undefined, notes: string | undefined) => Promise<void>;
  editingAnimal?: Qurban | null;
}

export default function AnimalFormModal({
  isOpen,
  onClose,
  onSave,
  editingAnimal
}: AnimalFormModalProps) {
  const [animalType, setAnimalType] = useState<AnimalType>('sapi');
  const [owners, setOwners] = useState<string[]>(['']);
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (editingAnimal) {
      setAnimalType(editingAnimal.animalType);
      setOwners(editingAnimal.owners.length > 0 ? [...editingAnimal.owners] : ['']);
      setWeight(editingAnimal.weight ? String(editingAnimal.weight) : '');
      setNotes(editingAnimal.notes || '');
    } else {
      setAnimalType('sapi');
      setOwners(['']);
      setWeight('');
      setNotes('');
    }
    setErrorText(null);
  }, [editingAnimal, isOpen]);

  // Handle owner changes when switching animal type
  useEffect(() => {
    if (!editingAnimal) {
      if (animalType === 'sapi') {
        // Default 1 but allow up to 7
        if (owners.length > 7) {
          setOwners(owners.slice(0, 7));
        }
      } else {
        // Kambing & Domba only have 1 owner
        if (owners.length > 1) {
          setOwners([owners[0] || '']);
        }
      }
    }
  }, [animalType, editingAnimal]);

  if (!isOpen) return null;

  const handleAddOwnerField = () => {
    if (animalType === 'sapi' && owners.length < 7) {
      setOwners([...owners, '']);
    }
  };

  const handleRemoveOwnerField = (idx: number) => {
    if (owners.length > 1) {
      const updated = owners.filter((_, i) => i !== idx);
      setOwners(updated);
    } else {
      setOwners(['']);
    }
  };

  const handleOwnerValueChange = (idx: number, val: string) => {
    const updated = [...owners];
    updated[idx] = val;
    setOwners(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setIsLoading(true);

    const filteredOwners = owners.map(o => o.trim()).filter(o => o !== '');

    try {
      if (filteredOwners.length === 0) {
        throw new Error("Minimal harus ada satu nama pemilik qurban (Shohibul Qurban) yang terisi.");
      }

      if (animalType !== 'sapi' && filteredOwners.length > 1) {
        throw new Error("Kambing atau Domba hanya diperbolehkan memiliki 1 orang pemilik.");
      }

      if (animalType === 'sapi' && filteredOwners.length > 7) {
        throw new Error("Satu ekor sapi maksimal dihuni oleh 7 orang pemilik qurban.");
      }

      const parsedWeight = weight ? parseFloat(weight) : undefined;
      if (parsedWeight !== undefined && (isNaN(parsedWeight) || parsedWeight <= 0)) {
        throw new Error("Berat hewan harus bernilai angka positif.");
      }

      await onSave(animalType, filteredOwners, parsedWeight, notes.trim());
      onClose();
    } catch (err: any) {
      setErrorText(err?.message || "Gagal menyimpan data hewan qurban.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-905">
                {editingAnimal ? 'Edit Data Hewan Qurban' : 'Registrasi Hewan Qurban'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingAnimal ? `Mengubah detail nomor ${editingAnimal.animalNumber}` : 'Masukkan data baru ke antrean pencatatan'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorText && (
            <div className="p-3.5 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-xl text-xs font-medium">
              {errorText}
            </div>
          )}

          {/* Species Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Jenis Hewan Qurban
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['sapi', 'kambing', 'domba'] as AnimalType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => !editingAnimal && setAnimalType(type)}
                  disabled={!!editingAnimal}
                  className={`py-3 px-4 rounded-xl border-2 text-center capitalize font-bold text-xs transition-all flex flex-col items-center gap-1.5 outline-none ${
                    animalType === type
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  } ${editingAnimal ? 'opacity-65 cursor-not-allowed' : ''}`}
                >
                  <span className="text-lg">
                    {type === 'sapi' ? '🐂' : type === 'kambing' ? '🐐' : '🐏'}
                  </span>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shohibul Qurban (Owners) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pemilik Qurban (Shohibul Qurban)
                </label>
                <p className="text-[10px] text-slate-500">
                  {animalType === 'sapi' 
                    ? 'Maksimal 7 jiwa (Silakan tambah nama shohibul)' 
                    : 'Kambing/Domba terbatas untuk 1 jiwa'}
                </p>
              </div>
              
              {animalType === 'sapi' && owners.length < 7 && (
                <button
                  type="button"
                  onClick={handleAddOwnerField}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  <Plus size={12} /> Tambah
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {owners.map((owner, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="bg-slate-100 h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={`Nama Shohibul Qurban ${idx + 1}`}
                    value={owner}
                    onChange={(e) => handleOwnerValueChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  {owners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOwnerField(idx)}
                      className="p-2 bg-slate-50 border border-slate-100 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all outline-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              <Scale size={14} className="text-slate-400" />
              <span>Berat Hewan (Kg - Opsional)</span>
            </label>
            <input
              type="number"
              placeholder="Contoh: 350"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              <FileText size={14} className="text-slate-400" />
              <span>Keterangan Tambahan / Catatan Fisik</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Sapi gemuk sehat, bulu coklat, warna cerah..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition-all resize-none"
            />
          </div>

          {/* Save panel */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all outline-none"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-emerald-600/10 outline-none flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Hewan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
