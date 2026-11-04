import { useLayoutEffect, useRef } from 'react';
import type { PreviewModel } from '../hooks/usePriceImage.ts';

type Props = { model: PreviewModel; onDownload(): void; onShare?(): void; onEdit(): void };
const CAPTIONS: Record<PreviewModel['phase'], string> = {
  original: 'Foto asli — belum diperbarui',
  paused: 'Pratinjau sebelumnya — dijeda',
  rendering: 'Menyiapkan hasil terbaru',
  ready: 'Hasil terbaru',
  error: 'Pratinjau belum dapat diperbarui',
};

export function ImagePreview({ model, onDownload, onShare, onEdit }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = holder.current;
    if (!node) return;
    node.replaceChildren();
    if (model.canvas) {
      model.canvas.setAttribute('role', 'img');
      model.canvas.setAttribute('aria-label', 'Pratinjau gambar harga hasil pengaturan');
      node.append(model.canvas);
    }
    return () => { node.replaceChildren(); };
  }, [model.canvas]);
  return <section className="preview-panel" id="preview-section" aria-labelledby="preview-heading">
    <header className="panel-heading"><h2 id="preview-heading" tabIndex={-1}>Pratinjau hasil</h2><span className="muted">Ukuran foto asli</span></header>
    <figure className="preview-figure" aria-busy={model.phase === 'rendering'}>
      <div className="preview-frame">
        <div className="canvas-holder" ref={holder} hidden={!model.canvas} />
        {!model.canvas ? <img src={model.source.url} width={model.source.width} height={model.source.height} alt="Foto daftar harga asli yang dipilih" /> : null}
      </div>
      <figcaption className={'preview-caption ' + (model.phase === 'ready' ? 'is-ready' : '')}>{CAPTIONS[model.phase]}</figcaption>
    </figure>
    <p id="preview-reason" className={'preview-status ' + (model.phase === 'error' ? 'is-error' : '')} role="status">{model.reason}</p>
    {model.smallerText.length && model.phase === 'ready' ? <p className="hint">Teks pada {model.smallerText.length} kolom diperkecil agar tetap muat tanpa bertumpuk.</p> : null}
    <div className="preview-actions">
      <button id="download-png" className="primary download-button" type="button" disabled={!model.canDownload}
        aria-describedby="preview-reason" aria-busy={model.saving} onClick={onDownload}>
        {model.saving ? 'Menyiapkan PNG…' : 'Unduh PNG'}
      </button>
      {model.canShare ? (
        <button id="share-png" className="secondary share-button mobile-only-action" type="button"
          disabled={!model.canDownload || model.saving || model.sharing}
          aria-describedby="preview-reason" aria-busy={model.sharing} onClick={onShare}>
          {model.sharing ? 'Menyiapkan gambar…' : 'Bagikan Gambar'}
        </button>
      ) : null}
    </div>
    {model.downloadError ? <p className="field-error" role="alert">{model.downloadError}</p> : null}
    {model.shareError ? <p className="field-error" role="alert">{model.shareError}</p> : null}
    <button className="text-button mobile-edit-link" type="button" onClick={onEdit}>Kembali ke pengaturan harga</button>
    <p className="export-note">Logo, gramasi, kategori, dan latar tetap mengikuti foto. Jika teks terlalu panjang untuk terbaca, pengunduhan diblokir.</p>
  </section>;
}
