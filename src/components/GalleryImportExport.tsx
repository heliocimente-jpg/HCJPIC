import React, { useState, useRef, useMemo } from 'react';
import { Upload, Download, Film, Image as ImageIcon, Music, Trash2, Share2, Sparkles, Check, Database, RefreshCw, FileText, ArrowDownToLine, ArrowUpFromLine, Search, X, SlidersHorizontal, Cpu, Filter, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { UserProfile, CreationItem } from '../types';
import { saveCreationToFirestore, loadUserCreationsFromFirestore, deleteCreationFromFirestore, deleteMultipleCreationsFromFirestore } from '../firebase';
import { downloadMediaFile } from '../utils/downloadMedia';

interface GalleryImportExportProps {
  user: UserProfile;
  language: 'pt' | 'en' | 'es';
  creations: CreationItem[];
  onCreationsUpdate: (newCreations: CreationItem[]) => void;
}

export const GalleryImportExport: React.FC<GalleryImportExportProps> = ({
  user,
  language,
  creations,
  onCreationsUpdate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement | null>(null);

  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Extract unique models present in the user's creations for the filter dropdown
  const availableModels = useMemo(() => {
    const modelsSet = new Set<string>();
    creations.forEach((item) => {
      if (item.modelUsed && item.modelUsed.trim()) {
        modelsSet.add(item.modelUsed.trim());
      }
    });
    return Array.from(modelsSet).sort();
  }, [creations]);

  // Combined search and filtering logic: query (title, prompt, model), type, and model
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return creations.filter((item) => {
      // 1. Filter by Type
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }

      // 2. Filter by Model
      if (selectedModelFilter !== 'all' && item.modelUsed !== selectedModelFilter) {
        return false;
      }

      // 3. Search query matching title, promptOrStyle, modelUsed, or type
      if (query) {
        const titleMatch = item.title?.toLowerCase().includes(query);
        const promptMatch = item.promptOrStyle?.toLowerCase().includes(query);
        const modelMatch = item.modelUsed?.toLowerCase().includes(query);
        const typeMatch = item.type?.toLowerCase().includes(query);
        return titleMatch || promptMatch || modelMatch || typeMatch;
      }

      return true;
    });
  }, [creations, filterType, selectedModelFilter, searchQuery]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // Media Import (Images and Videos)
  // ---------------------------------------------------------------------------
  const handleMediaFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    const newItems: CreationItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');

      const type: 'image' | 'video' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      // Read file as base64 or blob URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const item: CreationItem = {
        id: `imported_${Date.now()}_${i}`,
        type,
        feature: isVideo ? 'video_animation' : isAudio ? 'music' : 'photo_editor',
        title: file.name.replace(/\.[^/.]+$/, ''),
        mediaUrl: dataUrl,
        thumbnailUrl: isVideo
          ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
          : isAudio
          ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
          : dataUrl,
        modelUsed: 'Ficheiro Importado',
        createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        promptOrStyle: `Importado: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        userId: user.id,
      };

      newItems.push(item);
      // Persist each to Firestore
      await saveCreationToFirestore(item, user.id);
    }

    const updated = [...newItems, ...creations];
    onCreationsUpdate(updated);
    try {
      localStorage.setItem('mepic_creations', JSON.stringify(updated));
    } catch (e) {}

    setIsImporting(false);
    showNotification(`${newItems.length} ficheiro(s) importado(s) e sincronizados na Cloud!`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // JSON Backup Export
  // ---------------------------------------------------------------------------
  const handleExportJSON = () => {
    if (creations.length === 0) {
      alert('Não há criações para exportar no momento.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(creations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mepic_galeria_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Backup da galeria exportado com sucesso em JSON!');
  };

  // ---------------------------------------------------------------------------
  // JSON Backup Import
  // ---------------------------------------------------------------------------
  const handleImportJSONBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          const combined = [...imported, ...creations];
          // Remove duplicates by id
          const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
          onCreationsUpdate(unique);
          localStorage.setItem('mepic_creations', JSON.stringify(unique));
          showNotification(`${imported.length} itens restaurados do backup!`);
        }
      } catch (err) {
        alert('Ficheiro de backup JSON inválido.');
      }
    };
    reader.readAsText(file);
    if (jsonBackupInputRef.current) jsonBackupInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // Cloud Sync from Firestore
  // ---------------------------------------------------------------------------
  const handleSyncFirestore = async () => {
    setIsSyncing(true);
    try {
      const cloudItems = await loadUserCreationsFromFirestore(user.id);
      if (cloudItems.length > 0) {
        const combined = [...cloudItems, ...creations];
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        onCreationsUpdate(unique);
        localStorage.setItem('mepic_creations', JSON.stringify(unique));
        showNotification(`${cloudItems.length} criações sincronizadas do Firebase Firestore!`);
      } else {
        showNotification('Nenhuma criação remota encontrada. Todas as locais estão atualizadas.');
      }
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Single and Batch Delete Handlers
  // ---------------------------------------------------------------------------
  const handleDeleteItem = async (id: string) => {
    const updated = creations.filter((c) => c.id !== id);
    onCreationsUpdate(updated);
    try {
      localStorage.setItem('mepic_creations', JSON.stringify(updated));
    } catch (e) {}
    // Delete from Firestore
    await deleteCreationFromFirestore(id).catch((err) => console.warn('Firestore single delete failed:', err));
    showNotification('Criação removida da galeria.');
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      // If all filtered are already selected, unselect all
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    const confirmMsg = `Tem a certeza que deseja eliminar as ${count} criações selecionadas?`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingMultiple(true);
    const idsToDelete = Array.from(selectedIds);
    const updated = creations.filter((c) => !selectedIds.has(c.id));
    onCreationsUpdate(updated);

    try {
      localStorage.setItem('mepic_creations', JSON.stringify(updated));
    } catch (e) {}

    // Batch delete from Firestore
    await deleteMultipleCreationsFromFirestore(idsToDelete);

    setSelectedIds(new Set());
    setIsDeletingMultiple(false);
    showNotification(`${count} criação(ões) eliminada(s) com sucesso!`);
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) return;
    const itemsToDownload = creations.filter(c => selectedIds.has(c.id));
    showNotification(`Iniciando download de ${itemsToDownload.length} item(ns)...`);

    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i];
      const ext = item.type === 'video' ? 'mp4' : item.type === 'audio' ? 'wav' : 'png';
      await downloadMediaFile(item.mediaUrl, `mepic-${item.type}-${item.id}.${ext}`);
      // Small pause between multiple downloads to avoid browser block
      if (i < itemsToDownload.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-neutral-900 p-6 rounded-3xl border border-purple-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <ArrowDownToLine className="w-4 h-4" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                Central de Importação &amp; Exportação
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Database className="w-3 h-3 text-purple-400" />
                <span>Firestore Cloud &amp; Offline</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Importe imagens e vídeos do seu computador ou telemóvel para editar e animar com IA. Exporte os seus trabalhos em alta qualidade ou descarregue um backup completo da sua galeria em formato JSON.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Import Media Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleMediaFilesSelected}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Importando...' : 'Importar Imagens / Vídeos'}</span>
            </button>

            {/* Export JSON Backup */}
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Descarregar backup de todas as criações em arquivo JSON"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Exportar Backup (JSON)</span>
            </button>

            {/* Import Backup */}
            <input
              ref={jsonBackupInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSONBackup}
              className="hidden"
            />
            <button
              onClick={() => jsonBackupInputRef.current?.click()}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Restaurar backup de criações"
            >
              <ArrowUpFromLine className="w-4 h-4 text-neutral-400" />
              <span>Restaurar Backup</span>
            </button>

            {/* Cloud Sync */}
            <button
              onClick={handleSyncFirestore}
              disabled={isSyncing}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-bold text-xs transition-all"
              title="Sincronizar com Firestore"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Selection Mode Toggle */}
            <button
              onClick={() => {
                if (isSelectionMode) {
                  setSelectedIds(new Set());
                }
                setIsSelectionMode(!isSelectionMode);
              }}
              className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                isSelectionMode
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
              }`}
              title="Ativar seleção múltipla para apagar ou organizar"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isSelectionMode ? 'Sair da Seleção' : 'Selecionar'}</span>
            </button>
          </div>
        </div>

        {/* Selection Active Floating / Top Bar */}
        {isSelectionMode && (
          <div className="mt-4 p-3 bg-neutral-950/95 border border-purple-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                {selectedIds.size}
              </span>
              <span className="text-xs font-bold text-neutral-200">
                {selectedIds.size === 1 ? '1 item selecionado' : `${selectedIds.size} itens selecionados`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Desmarcar Todos</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Selecionar Todos ({filteredItems.length})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadSelected}
                disabled={selectedIds.size === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  selectedIds.size > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Selecionados ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isDeletingMultiple}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  selectedIds.size > 0 && !isDeletingMultiple
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingMultiple ? 'A eliminar...' : `Eliminar Selecionados (${selectedIds.size})`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedIds(new Set());
                  setIsSelectionMode(false);
                }}
                className="p-1.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                title="Cancelar seleção"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="gallery-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, prompt, estilo ou modelo IA..."
                className="w-full bg-neutral-950/90 border border-neutral-800 focus:border-purple-500 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Limpar pesquisa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by AI Engine / Model */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-neutral-950/90 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-semibold text-neutral-400 hidden sm:inline">Modelo:</span>
                <select
                  id="gallery-model-filter"
                  value={selectedModelFilter}
                  onChange={(e) => setSelectedModelFilter(e.target.value)}
                  className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all" className="bg-neutral-900 text-white">Todos os Motores</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model} className="bg-neutral-900 text-white">
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || filterType !== 'all' || selectedModelFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setSelectedModelFilter('all');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1"
                  title="Limpar todos os filtros"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Type Filter Pills & Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-neutral-400 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-neutral-500" />
                <span>Tipo:</span>
              </span>
              {[
                { id: 'all', label: `Todos (${creations.length})` },
                { id: 'image', label: `Imagens (${creations.filter((c) => c.type === 'image').length})` },
                { id: 'video', label: `Vídeos (${creations.filter((c) => c.type === 'video').length})` },
                { id: 'audio', label: `Músicas (${creations.filter((c) => c.type === 'audio').length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterType === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-medium text-neutral-400">
              Exibindo <span className="text-white font-bold">{filteredItems.length}</span> de {creations.length} criações
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
            {searchQuery || selectedModelFilter !== 'all' ? (
              <Search className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          <p className="text-sm font-bold text-neutral-300">
            {searchQuery || selectedModelFilter !== 'all'
              ? 'Nenhuma criação encontrada com os filtros atuais'
              : 'Nenhum ficheiro nesta categoria'}
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || selectedModelFilter !== 'all' ? (
              <span>
                Tente ajustar os termos de busca ou{' '}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setSelectedModelFilter('all');
                  }}
                  className="text-purple-400 hover:underline font-semibold"
                >
                  limpar todos os filtros
                </button>
                .
              </span>
            ) : (
              'Gere novas fotos ou vídeos nas abas do estúdio, ou clique em "Importar Imagens / Vídeos" acima para carregar do seu dispositivo.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isSelectionMode) {
                    handleToggleSelectItem(item.id);
                  }
                }}
                className={`bg-neutral-900/90 border rounded-2xl overflow-hidden group transition-all flex flex-col shadow-lg relative ${
                  isSelectionMode ? 'cursor-pointer select-none' : ''
                } ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/50 bg-neutral-900'
                    : 'border-neutral-800 hover:border-purple-500/50'
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden">
                  {item.type === 'video' ? (
                    <video
                      src={item.mediaUrl}
                      poster={item.thumbnailUrl}
                      controls={!isSelectionMode}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'audio' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-emerald-950/40 to-neutral-950 space-y-3">
                      <Music className="w-12 h-12 text-emerald-400 animate-pulse" />
                      <audio src={item.mediaUrl} controls={!isSelectionMode} className="w-full max-w-[200px] h-8" />
                    </div>
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Badge Type */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase flex items-center gap-1 pointer-events-none">
                    {item.type === 'video' ? <Film className="w-3 h-3 text-emerald-400" /> : item.type === 'audio' ? <Music className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-rose-400" />}
                    <span>{item.type}</span>
                  </span>

                  {/* Checkbox Overlay */}
                  {isSelectionMode ? (
                    <div
                      className="absolute top-2.5 right-2.5 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectItem(item.id);
                      }}
                    >
                      <button
                        type="button"
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-md ${
                          isSelected
                            ? 'bg-purple-600 text-white border border-purple-400 shadow-purple-600/50'
                            : 'bg-black/75 hover:bg-black/90 text-white/60 border border-white/20'
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <div className="w-4 h-4 rounded-md border-2 border-white/60" />
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Info & Download Action */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2">{item.promptOrStyle}</p>
                    <span className="text-[9px] text-purple-400 font-mono block mt-1">
                      {item.modelUsed} • {item.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ext = item.type === 'video' ? 'mp4' : item.type === 'audio' ? 'wav' : 'png';
                        await downloadMediaFile(item.mediaUrl, `mepic-${item.type}-${item.id}.${ext}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      disabled={isSelectionMode}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelectionMode
                          ? 'opacity-30 cursor-not-allowed text-neutral-600'
                          : 'hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400'
                      }`}
                      title="Excluir da galeria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
