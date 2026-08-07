import React, { useState, useRef } from 'react';
import { base44 } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Link, Plus, X, Upload, ExternalLink, FolderOpen, Loader2, Image } from 'lucide-react';

export default function EvidenciasSection({ folderUrl, setFolderUrl, links, setLinks, photos, setPhotos }) {
  const [newLink, setNewLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddLink = () => {
    const trimmed = newLink.trim();
    if (!trimmed) return;
    setLinks(prev => [...prev, trimmed]);
    setNewLink('');
  };

  const handleRemoveLink = (i) => setLinks(prev => prev.filter((_, idx) => idx !== i));

  const handleRemovePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => [...prev, file_url]);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="col-span-2 space-y-4 pt-2 border-t border-border">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" /> Evidências da Manutenção
      </p>

      {/* Pasta de Evidências */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
          <FolderOpen className="w-3 h-3" /> Pasta de Evidências (link principal)
        </Label>
        <div className="flex gap-2">
          <Input
            value={folderUrl}
            onChange={e => setFolderUrl(e.target.value)}
            placeholder="Cole o link da pasta (Google Drive, OneDrive, SharePoint...)"
            className="text-sm"
          />
          {folderUrl && (
            <a href={folderUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1">
                <ExternalLink className="w-3 h-3" /> Abrir
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Upload de Fotos */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
          <Image className="w-3 h-3" /> Fotos (JPG, PNG, WEBP)
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0">
              <img src={url} alt={`foto-${i}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePhoto(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5 mb-1" /><span className="text-[10px]">Anexar</span></>}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpg,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading && <p className="text-xs text-primary animate-pulse">Enviando imagem...</p>}
      </div>

      {/* Links Externos */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
          <Link className="w-3 h-3" /> Links de Evidências (Drive, OneDrive, Dropbox, S3...)
        </Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
            placeholder="Cole o link e pressione Enter ou clique em +"
            className="text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddLink} className="shrink-0 gap-1">
            <Plus className="w-3 h-3" /> Adicionar
          </Button>
        </div>
        {links.length > 0 && (
          <div className="space-y-1.5">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <Link className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground flex-1 truncate">{link}</span>
                <a href={link} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1">
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </Button>
                </a>
                <button type="button" onClick={() => handleRemoveLink(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}