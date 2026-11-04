import { useState } from 'react';
import { ImagePreview } from './components/ImagePreview.tsx';
import { PriceEditor } from './components/PriceEditor.tsx';
import { UploadPanel } from './components/UploadPanel.tsx';
import { usePriceImage } from './hooks/usePriceImage.ts';

export default function App() {
  const tool = usePriceImage();
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  function changeView(next: 'editor' | 'preview') {
    setView(next);
    requestAnimationFrame(() => {
      const section = document.getElementById(next === 'editor' ? 'editor-section' : 'preview-section');
      section?.scrollIntoView({ block: 'start' });
      section?.querySelector('h2')?.focus({ preventScroll: true });
    });
  }
  return <div className={'application ' + (tool.source ? 'has-source' : '')}>
    <a className="skip-link" href="#main">Lewati ke alat pengubah harga</a>
    <header className="app-header"><div className="header-inner"><div><h1>Ubah harga emas</h1><p>Perbarui angka dan tanggal tanpa mengganti desain foto.</p></div><span className="app-name">Gold Price Generator</span></div></header>
    <main id="main" className="app-main">
      <UploadPanel source={tool.source} session={tool.session} technicalError={tool.technicalError} onFile={file => { setView('editor'); void tool.loadFile(file); }} />
      {tool.source && tool.preview ? <div className="workspace" data-view={view}>
        <PriceEditor model={tool.editor} actions={tool.actions} />
        <ImagePreview model={tool.preview} onDownload={() => { void tool.download(); }} onEdit={() => changeView('editor')} />
      </div> : <section className="start-guide" aria-labelledby="guide-heading">
        <h2 id="guide-heading">Foto asli tetap menjadi desainnya.</h2>
        <p>Yang diubah hanya harga dan, jika Anda memilihnya, tanggal pada gambar.</p>
        <ol>
          <li>Unggah foto utuh dengan sembilan harga Redmark dan dua harga Gift Series.</li>
          <li>Periksa hasil pembacaan dan koreksi harga awal yang belum sesuai.</li>
          <li>Atur kenaikan semua harga atau per produk, lalu unduh PNG.</li>
        </ol>
        <p className="hint">Tidak mendukung foto yang dipotong, diputar, atau susunan kolomnya berbeda.</p>
      </section>}
    </main>
    {tool.source ? <nav className="mobile-switch" aria-label="Tampilan kerja">
      <button type="button" aria-pressed={view === 'editor'} aria-controls="editor-section" onClick={() => changeView('editor')}>Atur harga</button>
      <button type="button" aria-pressed={view === 'preview'} aria-controls="preview-section" onClick={() => changeView('preview')}>Pratinjau</button>
    </nav> : null}
    <footer className="app-footer">Periksa kembali angka pada hasil gambar sebelum membagikannya.</footer>
  </div>;
}
